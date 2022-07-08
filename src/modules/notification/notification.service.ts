import { Inject, Injectable, Logger } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { ConfigType } from '@nestjs/config';
import * as twilio from 'twilio';

import appConfig from '../../config/app.config';

import { formatCurrency, getRabbitMQExchangeName } from '../../utils';

import { UserService } from '../user/user.service';
import { LoanService } from '../loan/loan.service';
import { MovementService } from '../movement/movement.service';
import { EventMessageService } from '../event-message/event-message.service';

import { NotifyOverdueLoanInputDto } from './dto/notify-over-due-loan-input.dto';

const RABBITMQ_EXCHANGE = getRabbitMQExchangeName();

@Injectable()
export class NotificationService {
  private twilioClient: twilio.Twilio;

  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    private readonly eventMessageService: EventMessageService,
    private readonly userService: UserService,
    private readonly loanService: LoanService,
    private readonly movementService: MovementService,
  ) {
    const {
      twilio: { accountSid, authToken },
    } = this.appConfiguration;
    this.twilioClient = twilio(accountSid, authToken);
  }

  @RabbitRPC({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: `${RABBITMQ_EXCHANGE}.overdue_loan`,
    queue: `${RABBITMQ_EXCHANGE}.overdue_loan`,
  })
  async notifyOverdueLoan(input: NotifyOverdueLoanInputDto) {
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
      const minimumLoanPaymentAmount =
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

      const { sid } = await this.twilioClient.messages.create({
        body: message,
        messagingServiceSid,
        to: `+57${user.phone}`,
      });

      Logger.log(`twilio message sent: ${sid}`, NotificationService.name);
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
