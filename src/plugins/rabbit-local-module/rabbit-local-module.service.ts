import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import appConfig from '../../config/app.config';

import { getRabbitMQExchangeName } from '../../utils';

import { PublishOverdueLoanInput } from './dto/publish-overdue-loan-input.dto';
import { PublishSettleLoanInterestsInput } from './dto/publish-settle-loan-interests-input.dto';

@Injectable()
export class RabbitLocalModuleService {
  private exchangeName: string;

  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    private readonly amqpConnection: AmqpConnection,
  ) {
    this.exchangeName = getRabbitMQExchangeName();
  }

  public async publishOverdueLoan(
    input: PublishOverdueLoanInput,
  ): Promise<void> {
    const { exchangeName } = this;

    const { loanUid } = input;

    const routingKey = `${exchangeName}.overdue_loan`;

    await this.amqpConnection.publish(this.exchangeName, routingKey, {
      loanUid,
    });

    Logger.log(
      `message published to exchange ${exchangeName} ` +
        `for routing key ${routingKey} with input: ${JSON.stringify(input)}`,
      RabbitLocalModuleService.name,
    );
  }

  public async publishSettleLoanInterests(
    input: PublishSettleLoanInterestsInput,
  ): Promise<void> {
    const { exchangeName } = this;

    const { loanUid } = input;

    const routingKey = `${exchangeName}.settle_loan_interests`;

    await this.amqpConnection.publish(exchangeName, routingKey, {
      loanUid,
    });

    Logger.log(
      `message published to exchange ${exchangeName} ` +
        `for routing key ${routingKey} with input: ${JSON.stringify(input)}`,
      RabbitLocalModuleService.name,
    );
  }

  public async publishPaymentConfirmation(input: any): Promise<void> {
    const { exchangeName } = this;

    const routingKey = `${exchangeName}.payment_confirmation`;

    await this.amqpConnection.publish(exchangeName, routingKey, {
      ...input,
    });

    Logger.log(
      `message published to exchange ${exchangeName} ` +
        `for routing key ${routingKey} with input: ${JSON.stringify(input)}`,
      RabbitLocalModuleService.name,
    );
  }
}
