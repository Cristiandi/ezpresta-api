import {
  ConflictException,
  forwardRef,
  HttpException,
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

import { Movement } from './movement.entity';

import { BaseService } from '../../common/base.service';
import { RabbitLocalModuleService } from '../../plugins/rabbit-local-module/rabbit-local-module.service';
import { LoanService } from '../loan/loan.service';
import { MovementTypeService } from '../movement-type/movement-type.service';
import { EventMessageService } from '../event-message/event-message.service';

import {
  addDays,
  getNumberOfDays,
  addMinutes,
  getRabbitMQExchangeName,
  delay,
} from '../../utils';

import { GetLoanAmountToSettleInterestInput } from './dto/get-loan-amount-to-settle-interest-input.dto';
import { SettleLoanInterestsInput } from './dto/settle-loan-interests-input.dto';
import { CreateLoanMovementInput } from './dto/create-loan-movement-input.dto';
import { GetLoanMovementInput } from './dto/get-loan-movement-input.dto';
import { CreatePaymentMovementInput } from './dto/create-payment-movement-input.dto';
import { GetMinimumLoanPaymentAmountInput } from './dto/get-minimum-loan-payment-amount-input.dto';
import { GetLastPaymentMovementInput } from './dto/get-last-payment-movement-input.dto';
import { GetLoanPaymentDateInput } from './dto/get-loan-payment-date-input.dto';
import { GetLoanPaymentStatusInput } from './dto/get-loan-payment-status-input.dto';
import { GetTotalLoanAmountInput } from './dto/get-total-loan-amount-input.dto';
import { GetLoanPaymentsParamsInput } from './dto/get-loan-payments-params-input.dto';
import { GetLoanPaymentsQueryInput } from './dto/get-loan-payments-query-input.dto';
import { GetLoanMovementsParamsInput } from './dto/get-loan-movements-params-input.dto';
import { GetLoanMovementsQueryInput } from './dto/get-loan-movements-query-input.dto';
import { LastPaymentsWereInterestTypeInput } from './dto/last-payments-were-interest-type-input.dto';

const RABBITMQ_EXCHANGE = getRabbitMQExchangeName();
const MAXIMUM_AMOUNT_TO_FORGIVE = 100;

@Injectable()
export class MovementService extends BaseService<Movement> {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
    private readonly rabbitLocalModuleService: RabbitLocalModuleService,
    private readonly eventMessageService: EventMessageService,
    @Inject(forwardRef(() => LoanService))
    private readonly loanService: LoanService,
    private readonly movementTypeService: MovementTypeService,
  ) {
    super(movementRepository);
  }

  public async createLoanMovement(
    input: CreateLoanMovementInput,
  ): Promise<Movement> {
    const { loanUid } = input;

    // get the loan
    const existingLoan = await this.loanService.getOneByFields({
      fields: { uid: loanUid },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // get the movement type
    const loanType = await this.movementTypeService.getOneByFields({
      fields: { code: '01P' },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // create the loan movement
    const created = this.movementRepository.create({
      loan: existingLoan,
      movementType: loanType,
      amount: existingLoan.amount,
      at: existingLoan.startDate,
    });

    const saved = await this.movementRepository.save(created);

    delete saved.loan;

    return saved;
  }

  public async createPaymentMovement(
    input: CreatePaymentMovementInput,
  ): Promise<Movement> {
    const { loanUid, amount, paymentDate } = input;

    // get the loan movement
    const loanMovement = await this.getLoanMovement({
      loanUid,
    });

    if (!loanMovement) {
      throw new NotFoundException(
        `no loan movement found for the loan ${loanUid}`,
      );
    }

    // check if the payment amount is greater than the minimum loan payment amount
    const minimumLoanPaymentAmount = await this.getMinimumLoanPaymentAmount({
      loanUid,
    });

    if (amount < minimumLoanPaymentAmount) {
      throw new ConflictException(
        `the payment amount ${amount} is lower than the minimum loan payment amount ${minimumLoanPaymentAmount}`,
      );
    }

    // get the movement type
    const paymentType = await this.movementTypeService.getOneByFields({
      fields: { code: '04P' },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // create the movement
    const { loan } = loanMovement;

    const parsedPaymentDate = new Date(paymentDate);

    const created = this.movementRepository.create({
      loan: loan,
      movementType: paymentType,
      amount: amount * -1,
      at: addMinutes(parsedPaymentDate, parsedPaymentDate.getTimezoneOffset()),
    });

    // save the movement
    const saved = await this.movementRepository.save(created);

    // get the total loan amount
    const totalLoanAmount = await this.getTotalLoanAmount({
      loanUid,
    });

    // if the total amount is zero or less than MAXIMUM_AMOUNT_TO_FORGIVE,
    // then the loan is paid
    if (totalLoanAmount < MAXIMUM_AMOUNT_TO_FORGIVE) {
      // update the loan status to paid
      await this.loanService.loanHasBeenPaid({
        loanUid,
      });
    }

    // publish the event
    await this.rabbitLocalModuleService.publishReceivedPayment({
      movementUid: saved.uid,
    });

    return saved;
  }

  private async getLoanMovement(
    input: GetLoanMovementInput,
  ): Promise<Movement | undefined> {
    const { loanUid } = input;

    const existingLoan = await this.loanService.getOneByFields({
      fields: { uid: loanUid },
      checkIfExists: true,
      loadRelationIds: false,
    });

    const loanType = await this.movementTypeService.getOneByFields({
      fields: { code: '01P' },
      checkIfExists: true,
      loadRelationIds: false,
    });

    const loanMovement = await this.movementRepository
      .createQueryBuilder('m')
      .where('m.loan = :loanId', { loanId: existingLoan.id })
      .andWhere('m.movementType = :movementTypeId', {
        movementTypeId: loanType.id,
      })
      .getOne();

    if (!loanMovement) {
      return undefined;
    }

    return {
      ...loanMovement,
      loan: existingLoan,
      movementType: loanType,
    } as Movement;
  }

  private async getLastPaymentMovement(
    input: GetLastPaymentMovementInput,
  ): Promise<Movement | undefined> {
    const { loanUid } = input;

    const loanMovement = await this.getLoanMovement({
      loanUid,
    });

    if (!loanMovement) {
      throw new NotFoundException(
        `no loan movement found for the loan ${loanUid}`,
      );
    }

    const { loan } = loanMovement;

    // get the last payment movement
    const query = this.movementRepository
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.movementType', 'mt')
      .where('m.loan = :loanId', { loanId: loan.id })
      .andWhere('mt.code IN (:...codes)', { codes: ['04P'] })
      .orderBy('m.at', 'DESC')
      .limit(1);

    const lastPaymentMovement = await query.getOne();

    if (!lastPaymentMovement) {
      return undefined;
    }

    return {
      ...lastPaymentMovement,
      loan,
    } as Movement;
  }

  // this function returns the reference amount from the loan
  // that will be used to calculate the interest
  private async getLoanAmountToSettleInterest(
    input: GetLoanAmountToSettleInterestInput,
  ): Promise<number> {
    const { loanUid } = input;

    const existingLoan = await this.loanService.getOneByFields({
      fields: { uid: loanUid },
      checkIfExists: true,
      loadRelationIds: false,
    });

    const { settlementDate } = input;

    const { amount } = await this.movementRepository
      .createQueryBuilder('m')
      .select('SUM(m.amount)', 'amount')
      .where('m.loan = :loanId', { loanId: existingLoan.id })
      .andWhere('m.at <= :settlementDate', { settlementDate })
      .getRawOne();

    return amount;
  }

  @RabbitRPC({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: `${RABBITMQ_EXCHANGE}.settle_loan_interests`,
    queue: `${RABBITMQ_EXCHANGE}.settle_loan_interests`,
  })
  private async settleLoanInterestsRPC(input: SettleLoanInterestsInput) {
    const eventMessage = await this.eventMessageService.create({
      routingKey: `${RABBITMQ_EXCHANGE}.settle_loan_interests`,
      functionName: 'settleLoanInterests',
      data: input,
    });

    try {
      const { loanUid } = input;

      Logger.log(
        `settling loan interests for ${loanUid}`,
        MovementService.name,
      );

      const loanMovement = await this.getLoanMovement({ loanUid });

      if (!loanMovement) {
        throw new NotFoundException(
          `no loan movement found for the loan ${loanUid}`,
        );
      }

      const { loan } = loanMovement;

      // get the movement types
      const [interestType, overdueInterestType, paymentType] =
        await Promise.all([
          this.movementTypeService.getOneByFields({
            fields: { code: '02IC' },
            checkIfExists: true,
            loadRelationIds: false,
          }),
          this.movementTypeService.getOneByFields({
            fields: { code: '03IM' },
            checkIfExists: true,
            loadRelationIds: false,
          }),
          this.movementTypeService.getOneByFields({
            fields: { code: '04P' },
            checkIfExists: true,
            loadRelationIds: false,
          }),
        ]);

      // get the last interest movement and the last payment movement
      const [lastInterestMovement, lastPaymentMovement] = await Promise.all([
        this.movementRepository
          .createQueryBuilder('m')
          .where('m.loan = :loanId', { loanId: loan.id })
          .andWhere('m.movementType IN (:...ids)', {
            ids: [interestType.id, overdueInterestType.id],
          })
          .orderBy('m.at', 'DESC')
          .getOne(),
        this.movementRepository
          .createQueryBuilder('m')
          .where('m.loan = :loanId', { loanId: loan.id })
          .andWhere('m.movementType IN (:...ids)', {
            ids: [paymentType.id],
          })
          .orderBy('m.at', 'DESC')
          .getOne(),
      ]);

      // determinate the first date to begin the iterative creation of the interest movements
      const startDate = lastInterestMovement
        ? new Date(lastInterestMovement.at)
        : new Date(loanMovement.at);

      // determinate the reference date to determinate if the loan is overdue
      const referenceOverDueDate = lastPaymentMovement
        ? lastPaymentMovement.at
        : loanMovement.at;

      // get the loan value to settle interest
      const loanAmountToSettleInterest =
        await this.getLoanAmountToSettleInterest({
          loanUid,
          settlementDate: referenceOverDueDate,
        });

      // console.log('loanValueToSettleInterest', loanValueToSettleInterest);

      const currentDateTime = new Date();
      const currentDate = new Date(
        currentDateTime.getFullYear(),
        currentDateTime.getMonth(),
        currentDateTime.getDate(),
      );

      Logger.log(`${loanUid} | startDate ${startDate}`, MovementService.name);
      Logger.log(
        `${loanUid} | currentDate ${currentDate}`,
        MovementService.name,
      );

      // get the number of days in order know how many interest movements will be created by day
      const numberOfDays = getNumberOfDays(startDate, currentDate);

      Logger.log(
        `${loanUid} | numberOfDays ${numberOfDays}`,
        MovementService.name,
      );

      let iterationDate = startDate;

      for (let i = 0; i < numberOfDays; i++) {
        iterationDate = addDays(iterationDate, 1);

        // console.log('iterationDate', iterationDate);

        // check if already exists a interest movement for the iteration date
        const existingInterestMovement = await this.movementRepository
          .createQueryBuilder('m')
          .where('m.loan = :loanId', { loanId: loan.id })
          .andWhere('m.movementType IN (:...ids)', {
            ids: [interestType.id, overdueInterestType.id],
          })
          .andWhere('m.at = :iterationDate', { iterationDate })
          .getOne();

        if (existingInterestMovement) {
          Logger.warn('interest movement already exists', MovementService.name);

          continue;
        }

        // determinate if the loan is overdue
        const numberOfDaySinceReferenceOverDueDate = getNumberOfDays(
          referenceOverDueDate,
          iterationDate,
        );

        const isOverdue = numberOfDaySinceReferenceOverDueDate > 30; // TODO: change this value to a configurable value

        // console.log('isOverdue', isOverdue);

        // create the interest movement
        const created = this.movementRepository.create({
          amount: isOverdue
            ? loanAmountToSettleInterest *
              (loan.annualInterestOverdueRate / 360)
            : loanAmountToSettleInterest * (loan.annualInterestRate / 360),
          at: iterationDate, // addMinutes(iterationDate, iterationDate.getTimezoneOffset()),
          loan,
          movementType: isOverdue ? overdueInterestType : interestType,
        });

        // save the movement
        const saved = await this.movementRepository.save(created);

        // check if the saved movement is an overdue interest movement
        // in this case, publish an event to notify the user
        if (saved?.movementType?.id === overdueInterestType.id) {
          // check if the iteration date YYYY/MM/DD is the same as current date
          if (
            iterationDate.getFullYear() === currentDate.getFullYear() &&
            iterationDate.getMonth() === currentDate.getMonth() &&
            iterationDate.getDate() === currentDate.getDate()
          ) {
            await this.rabbitLocalModuleService.publishOverdueLoan({
              loanUid: loan.uid,
            });
          }
        }
      }

      await delay(500);

      return {
        status: 200,
        message: 'success',
        data: {},
      };
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

  public async settleLoanInterests(input: SettleLoanInterestsInput) {
    const { status, message, data } = await this.settleLoanInterestsRPC(input);

    if (status !== 200) {
      throw new HttpException(message, status);
    }

    return data;
  }

  // this function returns the minimum paument amount of the loan
  public async getMinimumLoanPaymentAmount(
    input: GetMinimumLoanPaymentAmountInput,
  ): Promise<number> {
    const { loanUid } = input;

    // get the loan movement
    const loanMovement = await this.getLoanMovement({ loanUid });
    if (!loanMovement) {
      throw new NotFoundException(
        `no loan movement found for the loan ${loanUid}`,
      );
    }

    // get the last payment movement
    const lastPaymentMovement = await this.getLastPaymentMovement({
      loanUid,
    });

    const referenceDate = lastPaymentMovement
      ? lastPaymentMovement.at
      : loanMovement.at;

    // get the 1 percent of the loan amoutn to settle interest
    // from the last payment movement, but if there is no last payment movement
    // get the 1 percent of the loan amount to settle interest from the loan movement
    const nPercentOfLoanAmountToSettleInterest =
      await this.getNPercentOfLoanAmountToSettleInterest({
        loanUid,
        percent: 1,
        settlementDate: referenceDate,
      });

    const { loan } = loanMovement;

    // get the interest type movements
    const [interestType, overdueInterestType] = await Promise.all([
      this.movementTypeService.getOneByFields({
        fields: { code: '02IC' },
        checkIfExists: true,
        loadRelationIds: false,
      }),
      this.movementTypeService.getOneByFields({
        fields: { code: '03IM' },
        checkIfExists: true,
        loadRelationIds: false,
      }),
    ]);

    const query = this.movementRepository
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.amount), 0)', 'amount')
      .where('m.loan = :loanId', { loanId: loan.id })
      .andWhere('m.movementType IN (:...movementTypeIds)', {
        movementTypeIds: [interestType.id, overdueInterestType.id],
      })
      .andWhere('m.at > :settlementDate', {
        settlementDate: referenceDate,
      });

    const { amount } = await query.getRawOne();

    /*
    Logger.log(
      `loan ${loanUid} | amount ${amount} | nPercentOfLoanAmountToSettleInterest ${nPercentOfLoanAmountToSettleInterest}`,
      MovementService.name,
    );
    */

    return parseFloat(amount) + nPercentOfLoanAmountToSettleInterest;
  }

  // this function returns the loan payment date
  public async getLoanPaymentDate(
    input: GetLoanPaymentDateInput,
  ): Promise<Date> {
    const { loanUid } = input;

    // get the loan movement
    const loanMovement = await this.getLoanMovement({ loanUid });

    if (!loanMovement) {
      throw new NotFoundException(
        `no loan movement found for the loan ${loanUid}`,
      );
    }

    // get the last payment movement
    const lastPaymentMovement = await this.getLastPaymentMovement({
      loanUid,
    });

    if (lastPaymentMovement) {
      return addDays(lastPaymentMovement.at, 30);
    }

    return addDays(loanMovement.at, 30);
  }

  // this function returns the loan payment status
  public async getLoanPaymentStatus(
    input: GetLoanPaymentStatusInput,
  ): Promise<string> {
    const { loanUid } = input;

    // get the loan movement
    const loanMovement = await this.getLoanMovement({ loanUid });

    if (!loanMovement) {
      throw new NotFoundException(
        `no loan movement found for the loan ${loanUid}`,
      );
    }

    // get the movement types
    const [interestType, overdueInterestType, paymentType] = await Promise.all([
      this.movementTypeService.getOneByFields({
        fields: { code: '02IC' },
        checkIfExists: true,
        loadRelationIds: false,
      }),
      this.movementTypeService.getOneByFields({
        fields: { code: '03IM' },
        checkIfExists: true,
        loadRelationIds: false,
      }),
      this.movementTypeService.getOneByFields({
        fields: { code: '04P' },
        checkIfExists: true,
        loadRelationIds: false,
      }),
    ]);

    const { loan } = loanMovement;

    if (loan.paid) {
      return 'pagado';
    }

    // get the last interest movement
    const lastInterestMovement = await this.movementRepository
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.movementType', 'mt')
      .where('m.loan = :loanId', { loanId: loan.id })
      .andWhere('m.movementType IN (:...ids)', {
        ids: [interestType.id, overdueInterestType.id],
      })
      .orderBy('m.at', 'DESC')
      .limit(1)
      .getOne();

    if (!lastInterestMovement) {
      return 'al día';
    }

    // try to get a payment for the same date that the interest movement
    const paymentMovement = await this.movementRepository
      .createQueryBuilder('m')
      .where('m.loan = :loanId', { loanId: loan.id })
      .andWhere('m.movementType = :paymentTypeId', {
        paymentTypeId: paymentType.id,
      })
      .andWhere('m.at = :date', { date: lastInterestMovement.at })
      .getOne();

    if (paymentMovement) {
      return 'al día';
    }

    const { movementType } = lastInterestMovement;

    if (movementType.id === interestType.id) {
      return 'al día';
    }
    if (movementType.id === overdueInterestType.id) {
      return 'atrasado';
    }
    return 'no definido';
  }

  //  this function returns the total loan amount AKA the total amount to pay
  public async getTotalLoanAmount(
    input: GetTotalLoanAmountInput,
  ): Promise<number> {
    const { loanUid } = input;

    // get the loan movement
    const loanMovement = await this.getLoanMovement({ loanUid });

    if (!loanMovement) {
      throw new NotFoundException(
        `no loan movement found for the loan ${loanUid}`,
      );
    }

    // get the total amount of the loan
    const { loan } = loanMovement;

    const { totalAmount } = await this.movementRepository
      .createQueryBuilder('m')
      .select('SUM(m.amount)', 'totalAmount')
      .where('m.loan = :loanId', { loanId: loan.id })
      .getRawOne();

    return parseFloat(totalAmount);
  }

  // this function returns the loan payment movements
  public async getLoanPayments(
    paramsInput: GetLoanPaymentsParamsInput,
    queryInput: GetLoanPaymentsQueryInput,
  ): Promise<Movement[]> {
    const { loanUid } = paramsInput;

    const loanMovement = await this.getLoanMovement({ loanUid });
    if (!loanMovement) {
      throw new NotFoundException(
        `no loan movement found for the loan ${loanUid}`,
      );
    }

    // get the payment type
    const paymentType = await this.movementTypeService.getOneByFields({
      fields: { code: '04P' },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // get the payments of the loan
    const { loan } = loanMovement;

    const { limit } = queryInput;

    const query = this.movementRepository
      .createQueryBuilder('m')
      .where('m.loan = :loanId', { loanId: loan.id })
      .andWhere('m.movementType = :paymentTypeId', {
        paymentTypeId: paymentType.id,
      })
      .orderBy('m.at', 'DESC')
      .limit(limit ? parseInt(limit, 10) : undefined);

    const payments = await query.getMany();

    return payments;
  }

  // this function returns the loan movements
  public async getLoanMovements(
    paramsInput: GetLoanMovementsParamsInput,
    queryInput: GetLoanMovementsQueryInput,
  ): Promise<Movement[]> {
    const { loanUid } = paramsInput;

    const loanMovement = await this.getLoanMovement({ loanUid });
    if (!loanMovement) {
      throw new NotFoundException(
        `no loan movement found for the loan ${loanUid}`,
      );
    }

    // get the loan movements
    const { loan } = loanMovement;

    const { limit, startDate, endDate } = queryInput;

    const query = this.movementRepository
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.movementType', 'mt')
      .where('m.loan = :loanId', { loanId: loan.id });

    if (startDate) {
      query.andWhere('m.at >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('m.at <= :endDate', { endDate });
    }

    query
      .orderBy('m.at', 'DESC')
      .addOrderBy('mt.id', 'DESC')
      .limit(limit ? parseInt(limit, 10) : undefined);

    const movements = await query.getMany();

    return movements;
  }

  public async getNPercentOfLoanAmountToSettleInterest(input: {
    loanUid: string;
    percent: number;
    settlementDate: Date;
  }): Promise<number> {
    const { loanUid, percent, settlementDate } = input;

    // get the loan value to settle interest
    const loanAmountToSettleInterest = await this.getLoanAmountToSettleInterest(
      {
        loanUid,
        settlementDate,
      },
    );

    // get the 1% of the loan value to settle interest
    const result = loanAmountToSettleInterest * (percent / 100);

    return result;
  }
}
