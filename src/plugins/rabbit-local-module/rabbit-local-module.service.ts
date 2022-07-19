import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import appConfig from '../../config/app.config';

import { getRabbitMQExchangeName } from '../../utils';

import { PublishOverdueLoanInput } from './dto/publish-overdue-loan-input.dto';
import { PublishSettleLoanInterestsInput } from './dto/publish-settle-loan-interests-input.dto';
import { PublishLoanRequestCreatedInput } from './dto/publish-loan-request-created-input.dto';
import { PublishReceivedPaymentInput } from './dto/publish-received-payment-input.dto';
import { PublishLoanRequestOnReviewInput } from './dto/publish-loan-request-on-review-input.dto';
import { PublishLoanRequestRejectedInput } from './dto/publish-loan-request-rejected-input.dto';

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

  public async publishLoanRequestCreated(
    input: PublishLoanRequestCreatedInput,
  ): Promise<void> {
    const { exchangeName } = this;

    const routingKey = `${exchangeName}.loan_request_created`;

    await this.amqpConnection.publish(exchangeName, routingKey, {
      ...input,
    });

    Logger.log(
      `message published to exchange ${exchangeName} ` +
        `for routing key ${routingKey} with input: ${JSON.stringify(input)}`,
      RabbitLocalModuleService.name,
    );
  }

  public async publishReceivedPayment(
    input: PublishReceivedPaymentInput,
  ): Promise<void> {
    const { exchangeName } = this;

    const routingKey = `${exchangeName}.received_payment`;

    await this.amqpConnection.publish(exchangeName, routingKey, {
      ...input,
    });

    Logger.log(
      `message published to exchange ${exchangeName} ` +
        `for routing key ${routingKey} with input: ${JSON.stringify(input)}`,
      RabbitLocalModuleService.name,
    );
  }

  public async publishLoanRequestOnReview(
    input: PublishLoanRequestOnReviewInput,
  ): Promise<void> {
    const { exchangeName } = this;

    const routingKey = `${exchangeName}.loan_request_on_review`;

    await this.amqpConnection.publish(exchangeName, routingKey, {
      ...input,
    });

    Logger.log(
      `message published to exchange ${exchangeName} ` +
        `for routing key ${routingKey} with input: ${JSON.stringify(input)}`,
      RabbitLocalModuleService.name,
    );
  }

  public async publishLoanRequestRejected(
    input: PublishLoanRequestRejectedInput,
  ): Promise<void> {
    const { exchangeName } = this;

    const routingKey = `${exchangeName}.loan_request_rejected`;

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
