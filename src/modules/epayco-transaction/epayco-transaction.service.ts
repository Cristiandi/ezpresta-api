import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';

import appConfig from '../../config/app.config';

import { EpaycoTransaction } from './epayco-transaction.entity';

import { BaseService } from '../../common/base.service';
import { RabbitLocalModuleService } from '../../plugins/rabbit-local-module/rabbit-local-module.service';
import { LoanService } from '../loan/loan.service';
import { MovementService } from '../movement/movement.service';

import { hash, getRabbitMQExchangeName } from '../../utils';

import { CreateEpaycoTransactionInput } from './dto/create-epayco-transaction-input.dto';

const RABBITMQ_EXCHANGE = getRabbitMQExchangeName();

@Injectable()
export class EpaycoTransactionService extends BaseService<EpaycoTransaction> {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @InjectRepository(EpaycoTransaction)
    private readonly epaycoTransactionRepository: Repository<EpaycoTransaction>,
    private readonly rabbitLocalModuleService: RabbitLocalModuleService,
    private readonly loanService: LoanService,
    private readonly movementService: MovementService,
  ) {
    super(epaycoTransactionRepository);
  }

  public async create(input: CreateEpaycoTransactionInput) {
    const { loanUid } = input;

    // check if loan exists
    const existingLoan = await this.loanService.getOneByFields({
      fields: {
        uid: loanUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // create the epayco transaction
    const {
      epayco: { testing },
    } = this.appConfiguration;

    const { amount } = input;

    const createdEpaycoTransaction =
      await this.epaycoTransactionRepository.create({
        loan: existingLoan,
        amount,
        status: 0,
        testing,
      });

    const savedEpaycoTransaction = await this.epaycoTransactionRepository.save(
      createdEpaycoTransaction,
    );

    return savedEpaycoTransaction;
  }

  public async initConfirmation(input: any) {
    if (!input.x_ref_payco) {
      throw new BadRequestException('x_ref_payco is required');
    }

    if (!input.x_id_invoice) {
      throw new BadRequestException('x_id_invoice is required');
    }

    if (!input.x_amount) {
      throw new BadRequestException('x_amount is required');
    }

    if (!input.x_signature) {
      throw new BadRequestException('x_signature is required');
    }

    if (!input.x_cod_transaction_state) {
      throw new BadRequestException('x_cod_transaction_state is required');
    }

    await this.rabbitLocalModuleService.publishPaymentConfirmation(input);

    return {
      status: 'ok',
    };
  }

  @RabbitRPC({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: `${RABBITMQ_EXCHANGE}.payment_confirmation`,
    queue: `${RABBITMQ_EXCHANGE}.payment_confirmation`,
  })
  public async confirmation(input: any) {
    Logger.log('confirmation', EpaycoTransactionService.name);

    const { x_id_invoice: epaycoTransactionUid } = input;

    // look for the epayco transaction
    // as we use x_id_invoice as the epaycoTransactionUid
    // we're also checking if x_id_invoice is righty
    const existingEpaycoTransaction = await this.getOneByFields({
      fields: {
        uid: epaycoTransactionUid,
      },
      relations: ['loan'],
      loadRelationIds: false,
    });

    if (!existingEpaycoTransaction) {
      Logger.warn(
        `EpaycoTransaction not found: ${epaycoTransactionUid}`,
        EpaycoTransactionService.name,
      );
      throw new NotFoundException(
        `epayco transaction with uid ${epaycoTransactionUid} not found`,
      );
    }

    // check if the transaction is already used
    if (existingEpaycoTransaction.used) {
      Logger.warn(
        `epayco transaction with uid ${epaycoTransactionUid} already used`,
        EpaycoTransactionService.name,
      );
      throw new ConflictException(
        `epayco transaction with uid ${epaycoTransactionUid} already used`,
      );
    }

    // update the epayco transaction with th reference
    const { x_ref_payco: reference } = input;

    await this.epaycoTransactionRepository.update(
      { id: existingEpaycoTransaction.id },
      { reference, used: true },
    );

    // check the amount
    const { x_amount: amount } = input;
    if (parseFloat(amount) !== existingEpaycoTransaction.amount) {
      await this.epaycoTransactionRepository.update(
        { id: existingEpaycoTransaction.id },
        { status: -1, comment: 'amount mismatch' },
      );

      throw new ConflictException('amount mismatch');
    }

    // check the signature
    const {
      epayco: { pCustId, pKey },
    } = this.appConfiguration;

    const { x_transaction_id: transactionId, x_currency_code: currencyCode } =
      input;

    const signature = hash(
      pCustId +
        '^' +
        pKey +
        '^' +
        reference +
        '^' +
        transactionId +
        '^' +
        amount +
        '^' +
        currencyCode,
    );

    if (signature !== input.x_signature) {
      await this.epaycoTransactionRepository.update(
        { id: existingEpaycoTransaction.id },
        { status: -1, comment: 'signature mismatch' },
      );

      throw new ConflictException('invalid signature');
    }

    // update the transaction
    const { x_cod_transaction_state: status } = input;

    await this.epaycoTransactionRepository.update(
      { id: existingEpaycoTransaction.id },
      { status: parseInt(status, 10) },
    );

    if (!existingEpaycoTransaction.testing && status === '1') {
      const formatDateForPayment = (date) => {
        return new Date(date).toISOString().slice(0, 10);
      };

      // create the payment
      try {
        await this.movementService.createPaymentMovement({
          loanUid: existingEpaycoTransaction.loan.uid,
          amount: existingEpaycoTransaction.amount,
          paymentDate: formatDateForPayment(new Date()),
        });
      } catch (error) {
        Logger.error(error, EpaycoTransactionService.name);
        throw error;
      }
    }
  }

  public handleResponsePage(queryInput: any) {
    const { ref_payco } = queryInput;

    const {
      app: { selftWebUrl },
    } = this.appConfiguration;

    return {
      url: `${selftWebUrl}loans/epayco/response?ref_payco=${ref_payco}`,
      statusCode: 302,
    };
  }
}
