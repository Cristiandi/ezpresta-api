import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import appConfig from '../../config/app.config';

import { Loan } from './loan.entity';

import { BaseService } from '../../common/base.service';
import { UserService } from '../user/user.service';
import { MovementService } from '../movement/movement.service';
import { RabbitLocalModuleService } from '../../plugins/rabbit-local-module/rabbit-local-module.service';

import { addMinutes } from '../../utils';

import { CreateLoanInput } from './dto/create-loan-input.dto';
import { GetUserLoansParamsInput } from './dto/get-user-loans-params-input.dto';
import { GetUserLoansQueryInput } from './dto/get-user-loans-query-input.dto';
import { UserLoansOutput } from './dto/user-loans-output.dto';
import { GetLoanDetailsInput } from './dto/get-loan-details-input.dto';
import { GetAllBorrowersInput } from './dto/get-all-borrowers-input.dto';

@Injectable()
export class LoanService extends BaseService<Loan> {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly rabbitLocalModuleService: RabbitLocalModuleService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => MovementService))
    private readonly movementService: MovementService,
  ) {
    super(loanRepository);
  }

  // function to create a loan
  public async create(input: CreateLoanInput): Promise<Loan> {
    const { userAuthUid } = input;

    // check if the user exists
    const existingUser = await this.userService.getOneByFields({
      fields: {
        authUid: userAuthUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // create the loan
    const {
      amount,
      monthlyInterestRate,
      monthlyInterestOverdueRate,
      startDate,
      description,
    } = input;

    const parsedStartDate = new Date(startDate);

    const createdLoan = await this.loanRepository.create({
      user: existingUser,
      amount,
      monthlyInterestRate,
      annualInterestRate: monthlyInterestRate * 12,
      monthlyInterestOverdueRate,
      annualInterestOverdueRate: monthlyInterestOverdueRate * 12,
      startDate: addMinutes(
        parsedStartDate,
        parsedStartDate.getTimezoneOffset(),
      ),
      description,
    });

    const savedLoan = await this.loanRepository.save(createdLoan);

    // create the loan movement
    await this.movementService.createLoanMovement({
      loanUid: savedLoan.uid,
    });

    delete savedLoan.user;

    return savedLoan;
  }

  // function to settle the loans interests
  public async interestSettlement(): Promise<void> {
    const loans = await this.loanRepository.find({
      where: {
        paid: false,
      },
    });

    (async () => {
      for (const loan of loans) {
        await this.rabbitLocalModuleService.publishSettleLoanInterests({
          loanUid: loan.uid,
        });
      }
    })();
  }

  // function to get the user loans
  public async getUserLoans(
    paramsInput: GetUserLoansParamsInput,
    queryInput: GetUserLoansQueryInput,
  ): Promise<UserLoansOutput[]> {
    const { userAuthUid } = paramsInput;
    const { limit } = queryInput;

    // get the user
    const user = await this.userService.getOneByFields({
      fields: {
        authUid: userAuthUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // get the loans
    const loans = await this.loanRepository.find({
      where: {
        user: {
          id: user.id,
        },
      },
      take: limit ? parseInt(limit, 10) : undefined,
      order: {
        startDate: 'DESC',
      },
    });

    const userLoans = await Promise.all(
      loans.map(async (loan) => {
        const { uid } = loan;

        const [minimumLoanPaymentAmount, loanPaymentDate, loanPaymentStatus] =
          await Promise.all([
            this.movementService.getMinimumLoanPaymentAmount({
              loanUid: uid,
            }),
            this.movementService.getLoanPaymentDate({
              loanUid: uid,
            }),
            this.movementService.getLoanPaymentStatus({
              loanUid: uid,
            }),
          ]);

        return {
          id: loan.id,
          uid,
          amount: loan.amount,
          description: loan.description,
          minimumLoanPaymentAmount,
          loanPaymentDate,
          loanPaymentStatus,
        };
      }),
    );

    return userLoans;
  }

  // function to get the loan details
  public async getLoanDetails(input: GetLoanDetailsInput) {
    const { loanUid } = input;

    // get the loan
    const loan = await this.getOneByFields({
      fields: {
        uid: loanUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    const [
      minimumLoanPaymentAmount,
      loanPaymentDate,
      loanPaymentStatus,
      totalLoanAmount,
    ] = await Promise.all([
      this.movementService.getMinimumLoanPaymentAmount({
        loanUid: loan.uid,
      }),
      this.movementService.getLoanPaymentDate({
        loanUid: loan.uid,
      }),
      this.movementService.getLoanPaymentStatus({
        loanUid: loan.uid,
      }),
      this.movementService.getTotalLoanAmount({
        loanUid: loan.uid,
      }),
    ]);

    const {
      id,
      uid,
      description,
      amount,
      monthlyInterestRate,
      monthlyInterestOverdueRate,
    } = loan;

    return {
      id,
      uid,
      description,
      amount,
      monthlyInterestRate,
      monthlyInterestOverdueRate,
      minimumLoanPaymentAmount,
      loanPaymentDate,
      loanPaymentStatus,
      totalLoanAmount,
    };
  }

  // function to get the overview of the loans
  public async getOverview() {
    // get the loans that are not paid
    const existingLoans = await this.loanRepository.find({
      where: {
        paid: false,
      },
    });

    // determinate the total amount of loans and
    // the total minimum loans payment amount
    const { totalLoansAmount, totalLoansMinimumPaymentAmount } =
      await existingLoans.reduce(
        async (pre, cur) => {
          const [minimumLoanPaymentAmount, totalLoanAmount] = await Promise.all(
            [
              await this.movementService.getMinimumLoanPaymentAmount({
                loanUid: cur.uid,
              }),
              await this.movementService.getTotalLoanAmount({
                loanUid: cur.uid,
              }),
            ],
          );

          const resolvedPre = await pre;

          return {
            totalLoansAmount: resolvedPre.totalLoansAmount + totalLoanAmount,
            totalLoansMinimumPaymentAmount:
              resolvedPre.totalLoansMinimumPaymentAmount +
              minimumLoanPaymentAmount,
          };
        },
        Promise.resolve({
          totalLoansAmount: 0,
          totalLoansMinimumPaymentAmount: 0,
        }),
      );

    return {
      numberOfLoans: existingLoans.length,
      totalLoansAmount,
      totalLoansMinimumPaymentAmount,
    };
  }

  // function to get all borrowers
  public async getAllBorrowers(input: GetAllBorrowersInput) {
    const { q, limit, skip } = input;

    const exisingUsers = await this.userService.getAll({
      q,
      limit,
      skip,
    });

    const response = await Promise.all(
      exisingUsers.map(async (user) => {
        const loans = await this.loanRepository.find({
          where: {
            user: {
              id: user.id,
            },
          },
        });

        const loanPaymentStatuses = await Promise.all(
          loans.map((loan) =>
            this.movementService.getLoanPaymentStatus({
              loanUid: loan.uid,
            }),
          ),
        );

        const userInOverdue = loanPaymentStatuses.find(
          (loanPaymentStatus) => loanPaymentStatus === 'atrasado',
        );

        return {
          ...user,
          inOverdue: userInOverdue ? true : false,
        };
      }),
    );

    return response;
  }

  public async loanHasBeenPaid(input: any) {
    const { loanUid } = input;

    const existingLoan = await this.getOneByFields({
      fields: {
        uid: loanUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    const preloadedLoan = await this.loanRepository.preload({
      id: existingLoan.id,
      paid: true,
    });

    await this.loanRepository.save(preloadedLoan);
  }

  public async getTotalBorrowedPerMonth() {
    const query = this.loanRepository
      .createQueryBuilder('l')
      .select([
        `extract(month from l.start_date) as month`,
        'extract(year from l.start_date) as year',
        'sum(l.amount) as amount',
      ])
      .groupBy('month, year')
      .orderBy('year, month')
      .limit(12);

    const loanAmountsByMonth = await query.getRawMany();

    const loanAmountsByMonthParsed = loanAmountsByMonth.map((item) => {
      return {
        ...item,
        amount: parseFloat(item.amount),
      };
    });

    return loanAmountsByMonthParsed;
  }

  public async getTotalByTypes() {
    const query = this.loanRepository
      .createQueryBuilder('l')
      .select(['mt.name as movementTypeName', 'abs(sum(m.amount)) as total'])
      .innerJoin('l.movements', 'm')
      .innerJoin('m.movementType', 'mt')
      .where('l.paid = :paid', { paid: false })
      .orderBy('mt.id')
      .groupBy('mt.id');

    const totalByTypes = await query.getRawMany();

    const totalByTypesParsed = totalByTypes.map((item) => {
      return {
        ...item,
        total: parseFloat(item.total),
      };
    });

    return totalByTypesParsed;
  }
}
