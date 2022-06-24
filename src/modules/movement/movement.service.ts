import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import appConfig from '../../config/app.config';

import { Movement } from './movement.entity';

import { BaseService } from '../../common/base.service';
import { LoanService } from '../loan/loan.service';
import { MovementTypeService } from '../movement-type/movement-type.service';

import { addDays, getNumberOfDays } from '../../utils';

import { GetLoanValueToSettleInterestInput } from './dto/get-loan-value-to-settle-interest-input.dto';
import { SettleLoanInterestsInput } from './dto/settle-loan-interests-input.dto';
import { CreateLoanMovementInput } from './dto/create-loan-movement-input.dto';
import { GetLoanMovementInput } from './dto/get-loan-movement-input.dto';
import { CreatePaymentMovementInput } from './dto/create-payment-movement-input.dto';

@Injectable()
export class MovementService extends BaseService<Movement> {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
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
    });

    // get the movement type
    const loanType = await this.movementTypeService.getOneByFields({
      fields: { code: '01P' },
      checkIfExists: true,
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
    const { key } = input;

    const {
      app: { apiKey },
    } = this.appConfiguration;

    if (key !== apiKey) {
      throw new UnauthorizedException('invalid key');
    }

    const { loanUid } = input;

    // get the loan
    const existingLoan = await this.loanService.getOneByFields({
      fields: { uid: loanUid },
      checkIfExists: true,
    });

    // get the movement type
    const paymentType = await this.movementTypeService.getOneByFields({
      fields: { code: '04P' },
      checkIfExists: true,
    });

    // create the loan movement
    const { amount } = input;

    const created = this.movementRepository.create({
      loan: existingLoan,
      movementType: paymentType,
      amount: amount * -1,
      at: existingLoan.startDate,
    });

    const saved = await this.movementRepository.save(created);

    return saved;
  }

  private async getLoanMovement(
    input: GetLoanMovementInput,
  ): Promise<Movement> {
    const { loanUid } = input;

    const existingLoan = await this.loanService.getOneByFields({
      fields: { uid: loanUid },
      checkIfExists: true,
    });

    const loanType = await this.movementTypeService.getOneByFields({
      fields: { code: '01P' },
      checkIfExists: true,
    });

    const movement = await this.movementRepository
      .createQueryBuilder('m')
      .where('m.loan = :loanId', { loanId: existingLoan.id })
      .andWhere('m.movementType = :movementTypeId', {
        movementTypeId: loanType.id,
      })
      .getOne();

    return {
      ...movement,
      loan: existingLoan,
    } as Movement;
  }

  private async getLoanValueToSettleInterest(
    input: GetLoanValueToSettleInterestInput,
  ): Promise<number> {
    const { loanUid } = input;

    const existingLoan = await this.loanService.getOneByFields({
      fields: { uid: loanUid },
      checkIfExists: true,
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

  public async settleLoanInterests(
    input: SettleLoanInterestsInput,
  ): Promise<void> {
    const { loanUid } = input;

    const loanMovement = await this.getLoanMovement({ loanUid });

    const { loan } = loanMovement;

    // get the movement types
    const [interestType, overdueInterestType, paymentType] = await Promise.all([
      this.movementTypeService.getOneByFields({
        fields: { code: '02IC' },
        checkIfExists: true,
      }),
      this.movementTypeService.getOneByFields({
        fields: { code: '03IM' },
        checkIfExists: true,
      }),
      this.movementTypeService.getOneByFields({
        fields: { code: '04P' },
        checkIfExists: true,
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
        .andWhere('m.movementType = :movementTypeId', {
          movementTypeId: paymentType.id,
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
    const loanValueToSettleInterest = await this.getLoanValueToSettleInterest({
      loanUid,
      settlementDate: referenceOverDueDate,
    });

    // console.log('loanValueToSettleInterest', loanValueToSettleInterest);

    const currentDate = new Date();

    // get the number of days in order know how many interest movements will be created by day
    const numberOfDays = getNumberOfDays(startDate, currentDate);

    let iterationDate = startDate;

    // start from 1 to prevent the creation of a movement that didn't happen yet
    for (let i = 1; i < numberOfDays; i++) {
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

      const created = this.movementRepository.create({
        amount: isOverdue
          ? loanValueToSettleInterest * (loan.annualInterestOverdueRate / 360)
          : loanValueToSettleInterest * (loan.annualInterestRate / 360),
        at: iterationDate, // addMinutes(iterationDate, iterationDate.getTimezoneOffset()),
        loan,
        movementType: isOverdue ? overdueInterestType : interestType,
      });

      await this.movementRepository.save(created);
    }
  }
}
