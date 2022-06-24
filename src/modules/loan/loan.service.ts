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

import { Loan } from './loan.entity';

import { BaseService } from '../../common/base.service';
import { UserService } from '../user/user.service';
import { MovementService } from '../movement/movement.service';

import { addMinutes } from '../../utils';

import { CreateLoanInput } from './dto/create-loan-input.dto';

import { InterestSettlementInput } from './dto/interest-settlement-input.dto';

@Injectable()
export class LoanService extends BaseService<Loan> {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => MovementService))
    private readonly movementService: MovementService,
  ) {
    super(loanRepository);
  }

  public async create(input: CreateLoanInput): Promise<Loan> {
    const { key } = input;

    const {
      app: { apiKey },
    } = this.appConfiguration;

    if (key !== apiKey) {
      throw new UnauthorizedException('invalid key');
    }

    const { userAuthUid } = input;

    // check if the user exists
    const existingUser = await this.userService.getOneByFields({
      fields: {
        authUid: userAuthUid,
      },
      checkIfExists: true,
    });

    // create the loan
    const {
      amount,
      monthlyInterestRate,
      monthlyInterestOverdueRate,
      startDate,
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
    });

    const savedLoan = await this.loanRepository.save(createdLoan);

    // create the loan movement
    await this.movementService.createLoanMovement({
      loanUid: savedLoan.uid,
    });

    delete savedLoan.user;

    return savedLoan;
  }

  public async interestSettlement(
    input: InterestSettlementInput,
  ): Promise<void> {
    const { key } = input;

    const {
      app: { apiKey },
    } = this.appConfiguration;

    if (key !== apiKey) {
      throw new UnauthorizedException('invalid key');
    }

    const loans = await this.loanRepository.find();

    (async () => {
      for (const loan of loans) {
        Logger.log(
          `settling interest for loan ${loan.uid}...`,
          LoanService.name,
        );

        await this.movementService.settleLoanInterests({
          loanUid: loan.uid,
        });
      }
    })();
  }
}
