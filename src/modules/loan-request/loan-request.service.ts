import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import appConfig from '../../config/app.config';

import { LoanRequest, LoanRequestStatus } from './loan-request.entity';

import { BaseService } from '../../common/base.service';
import { UserService } from '../user/user.service';

import { CreateLoanRequestInput } from './dto/create-loan-request-input.dto';
import { GetUserLoanRequestsParamsInput } from './dto/get-user-loan-requests-params-input.dto';
import { GetUserLoanRequestsQueryInput } from './dto/get-user-loan-requests-query-input.dto';
import { GetOneLoanRequestInput } from './dto/get-one-loan-request-input.dto';
import { UpdateUserLoanRequestInput } from './dto/update-user-loan-request-input.dto';

const MINIMUM_LOAN_REQUEST_AMOUNT = 100000; // TODO: use a parameter instead

@Injectable()
export class LoanRequestService extends BaseService<LoanRequest> {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @InjectRepository(LoanRequest)
    private readonly loanRequestRepository: Repository<LoanRequest>,
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
}
