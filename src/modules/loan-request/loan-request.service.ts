import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';

import appConfig from '../../config/app.config';

import { LoanRequest, LoanRequestStatus } from './loan-request.entity';

import { BaseService } from '../../common/base.service';
import { UserService } from '../user/user.service';
import { RabbitLocalModuleService } from '../../plugins/rabbit-local-module/rabbit-local-module.service';
import { MailingService } from '../../plugins/mailing/mailing.service';
import { EventMessageService } from '../event-message/event-message.service';

import { formatCurrency, getRabbitMQExchangeName } from '../../utils';

import { CreateLoanRequestInput } from './dto/create-loan-request-input.dto';
import { GetUserLoanRequestsParamsInput } from './dto/get-user-loan-requests-params-input.dto';
import { GetUserLoanRequestsQueryInput } from './dto/get-user-loan-requests-query-input.dto';
import { GetOneLoanRequestInput } from './dto/get-one-loan-request-input.dto';
import { UpdateUserLoanRequestInput } from './dto/update-user-loan-request-input.dto';

const MINIMUM_LOAN_REQUEST_AMOUNT = 100000; // TODO: use a parameter instead
const RABBITMQ_EXCHANGE = getRabbitMQExchangeName();

@Injectable()
export class LoanRequestService extends BaseService<LoanRequest> {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @InjectRepository(LoanRequest)
    private readonly loanRequestRepository: Repository<LoanRequest>,
    private readonly rabbitLocalModuleService: RabbitLocalModuleService,
    private readonly eventMessageService: EventMessageService,
    private readonly mailingService: MailingService,
    private readonly userService: UserService,
  ) {
    super(loanRequestRepository);
  }

  public async create(input: CreateLoanRequestInput) {
    const { userAuthUid } = input;

    // check if the user exists
    const existingUser = await this.userService.getOneByFields({
      fields: {
        authUid: userAuthUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // check if the user already has a loan request in CREADA state
    const existingLoanRequest = await this.loanRequestRepository.findOne({
      where: {
        user: {
          id: existingUser.id,
        },
        status: LoanRequestStatus.CREADA,
      },
    });

    if (existingLoanRequest) {
      throw new ConflictException(
        `the user ${userAuthUid} already has a loan request in CREADA state`,
      );
    }

    // create the loan request
    const { amount, description } = input;

    // check the input amount
    if (amount < MINIMUM_LOAN_REQUEST_AMOUNT) {
      throw new ConflictException(
        `the amount must be at least ${MINIMUM_LOAN_REQUEST_AMOUNT}`,
      );
    }

    const createdLoanRequest = this.loanRequestRepository.create({
      user: existingUser,
      amount,
      description,
    });

    const savedLoanRequest = await this.loanRequestRepository.save(
      createdLoanRequest,
    );

    // publish a event to notify the admin
    await this.rabbitLocalModuleService.publishLoanRequestCreated({
      loanRequestUid: savedLoanRequest.uid,
    });

    return savedLoanRequest;
  }

  public async getUserLoanRequests(
    paramsInput: GetUserLoanRequestsParamsInput,
    queryInput: GetUserLoanRequestsQueryInput,
  ) {
    const { userAuthUid } = paramsInput;

    // check if the user exists
    const existingUser = await this.userService.getOneByFields({
      fields: {
        authUid: userAuthUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // get the loan requests
    const { limit, skip, status } = queryInput;

    const loanRequests = await this.loanRequestRepository.find({
      where: {
        user: {
          id: existingUser.id,
        },
        status,
      },
      take: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
    });

    return loanRequests;
  }

  public async getOne(input: GetOneLoanRequestInput) {
    const { loanRequestUid } = input;

    const existingLoanRequest = await this.getOneByFields({
      fields: {
        uid: loanRequestUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    return existingLoanRequest;
  }

  public async updateUserLoanRequest(
    paramsInput: GetOneLoanRequestInput,
    input: UpdateUserLoanRequestInput,
  ) {
    const { loanRequestUid } = paramsInput;

    const existingLoanRequest = await this.getOneByFields({
      fields: {
        uid: loanRequestUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    const { amount, description } = input;

    // check the input amount
    if (amount && amount < MINIMUM_LOAN_REQUEST_AMOUNT) {
      throw new ConflictException(
        `the amount must be at least ${MINIMUM_LOAN_REQUEST_AMOUNT}`,
      );
    }

    const preloadedLoanRequest = await this.loanRequestRepository.preload({
      id: existingLoanRequest.id,
      amount,
      description,
    });

    const savedLoanRequest = await this.loanRequestRepository.save(
      preloadedLoanRequest,
    );

    return savedLoanRequest;
  }

  public async delete(input: GetOneLoanRequestInput) {
    const { loanRequestUid } = input;

    const existingLoanRequest = await this.getOneByFields({
      fields: {
        uid: loanRequestUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    const deletedLoanRequest = await this.loanRequestRepository.remove(
      existingLoanRequest,
    );

    return deletedLoanRequest;
  }

  @RabbitRPC({
    exchange: RABBITMQ_EXCHANGE,
    routingKey: `${RABBITMQ_EXCHANGE}.loan_request_created`,
    queue: `${RABBITMQ_EXCHANGE}.loan_request_created`,
  })
  public async loanRequestCreated(input: any) {
    const eventMessage = await this.eventMessageService.create({
      routingKey: `${RABBITMQ_EXCHANGE}.loan_request_created`,
      functionName: 'loanRequestCreated',
      data: input,
    });

    try {
      const { loanRequestUid } = input;
      const {
        app: { selftWebUrl },
      } = this.appConfiguration;

      const existingLoanRequest = await this.getOneByFields({
        fields: {
          uid: loanRequestUid,
        },
        checkIfExists: true,
        loadRelationIds: false,
        relations: ['user'],
      });

      const { user } = existingLoanRequest;

      const { fullName, email } = user;

      // send a mail to the admin and to the borrower
      await Promise.all([
        this.mailingService.sendEmail({
          templateName: 'ADMINISTRATOR_LOAN_REQUEST_CREATED',
          subject: `${fullName} ha solicitado un préstamo`,
          to: 'cristiandavidippolito@gmail.com',
          parameters: {
            borrowerName: fullName,
            loanRequestAmount: formatCurrency(existingLoanRequest.amount),
            link: selftWebUrl,
          },
        }),
        this.mailingService.sendEmail({
          templateName: 'BORROWER_LOAN_REQUEST_CREATED',
          subject: 'Solicitaste un préstamo',
          to: email,
          parameters: {
            borrowerName: fullName.split(' ')[0],
            loanRequestAmount: formatCurrency(existingLoanRequest.amount),
            link: selftWebUrl + 'loan-requests',
          },
        }),
      ]);
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
