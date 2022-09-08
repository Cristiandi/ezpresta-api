// eslint-disable-next-line @typescript-eslint/no-var-requires
const messagebird = require('messagebird');
import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { ConfigType } from '@nestjs/config';
import * as twilio from 'twilio';

import appConfig from '../../config/app.config';

import { formatCurrency, getRabbitMQExchangeName } from '../../utils';

import { UserService } from '../user/user.service';
import { LoanService } from '../loan/loan.service';
import { MovementService } from '../movement/movement.service';
import { EventMessageService } from '../event-message/event-message.service';
import { MailingService } from '../../plugins/mailing/mailing.service';

import { NotifyOverdueLoanInputDto } from './dto/notify-over-due-loan-input.dto';
import { NotifyReceivedPaymentInput } from './dto/notify-received-payment-input.dto';

const RABBITMQ_EXCHANGE = getRabbitMQExchangeName();

@Injectable()
export class NotificationService {
  private twilioClient: twilio.Twilio;
  private messagebirdClient;

  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    private readonly mailingService: MailingService,
    private readonly eventMessageService: EventMessageService,
    private readonly userService: UserService,
    private readonly loanService: LoanService,
    private readonly movementService: MovementService,
  ) {
    const {
      twilio: { accountSid, authToken },
      messagebird: { apiKey },
    } = this.appConfiguration;
    this.twilioClient = twilio(accountSid, authToken);
    this.messagebirdClient = messagebird(apiKey);
  }

  @RabbitRPC({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: `${RABBITMQ_EXCHANGE}.overdue_loan`,
    queue: `${RABBITMQ_EXCHANGE}.overdue_loan`,
  })
  async notifyOverdueLoanRPC(input: NotifyOverdueLoanInputDto) {
    const eventMessage = await this.eventMessageService.create({
      routingKey: `${RABBITMQ_EXCHANGE}.overdue_loan`,
      functionName: 'notifyOverdueLoan',
      data: input,
    });

    try {
      const { loanUid } = input;

      // get the user from the loan
      const { user } = await this.loanService.getOneByFields({
        fields: {
          uid: loanUid,
        },
        relations: ['user'],
        loadRelationIds: false,
      });

      // get the minimul payment amount
      const { amount: minimumLoanPaymentAmount } =
        await this.movementService.getMinimumLoanPaymentAmount({
          loanUid,
        });

      // get the first name of the user with the first letter capitalized
      const { fullName } = user;
      const firstName = fullName.split(' ')[0];
      const firstNameCapitalized =
        firstName.charAt(0).toUpperCase() + firstName.slice(1);

      // define the message
      const message =
        `EZPresta: ${firstNameCapitalized} tú prestamo esta vencido, ` +
        `recuerda ponerte al día pagando ` +
        `minimo ${formatCurrency(minimumLoanPaymentAmount)}`;

      // send the sms to the user using the twilio client
      const {
        twilio: { messagingServiceSid },
      } = this.appConfiguration;

      // try to send the sms with the twilio client
      let useMessageBird = false;

      try {
        const { sid } = await this.twilioClient.messages.create({
          body: message,
          messagingServiceSid,
          to: `+57${user.phone}`,
        });

        Logger.log(`twilio message sent: ${sid}`, NotificationService.name);
      } catch (error) {
        await this.eventMessageService.setError({
          id: eventMessage._id,
          error,
        });

        useMessageBird = true;
      }

      // if the twilio client fails, try to send the sms with the messagebird client
      if (useMessageBird) {
        this.messagebirdClient.messages.create(
          {
            originator: 'EZPresta',
            recipients: [`+57${user.phone}`],
            body: message,
          },
          async (error, response) => {
            if (error) {
              await this.eventMessageService.setError({
                id: eventMessage._id,
                error,
              });
            } else {
              Logger.log(
                `messagebird message sent: ${response.id}`,
                NotificationService.name,
              );
            }
          },
        );
      }
    } catch (error) {
      const message = error.message;

      await this.eventMessageService.setError({
        id: eventMessage._id,
        error,
      });

      return {
        status: error.status || 500,
        message,
        data: {},
      };
    }
  }

  @RabbitRPC({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: `${RABBITMQ_EXCHANGE}.received_payment`,
    queue: `${RABBITMQ_EXCHANGE}.received_payment`,
  })
  async notifyReceivedPayment(input: NotifyReceivedPaymentInput) {
    const eventMessage = await this.eventMessageService.create({
      routingKey: `${RABBITMQ_EXCHANGE}.received_payment`,
      functionName: 'received_payment',
      data: input,
    });

    try {
      const { movementUid } = input;

      // get the movement
      const existingMovement = await this.movementService.getOneByFields({
        fields: {
          uid: movementUid,
        },
        relations: ['loan', 'movementType'],
        loadRelationIds: false,
      });

      // check if the movement is a payment
      const { movementType } = existingMovement;

      // TODO:  use a parameter instead of hardcoded value
      if (!['04P', '05PI'].includes(movementType.code)) {
        throw new ConflictException(
          `the movement ${movementUid} is not a payment`,
          NotificationService.name,
        );
      }

      const { loan, amount: paymentAmount } = existingMovement;

      // get the user from the loan
      const { user } = await this.loanService.getOneByFields({
        fields: {
          uid: loan.uid,
        },
        relations: ['user'],
        loadRelationIds: false,
      });

      await this.mailingService.sendEmail({
        templateName: 'BORROWER_RECEIVED_PAYMENT',
        subject: 'Recibimos tú pago!',
        to: user.email,
        parameters: {
          borrowerName: user.fullName.split(' ')[0],
          paymentAmount: formatCurrency(paymentAmount * -1),
        },
      });
    } catch (error) {
      const message = error.message;

      await this.eventMessageService.setError({
        id: eventMessage._id,
        error,
      });

      return {
        status: error.status || 500,
        message,
        data: {},
      };
    }
  }
}
