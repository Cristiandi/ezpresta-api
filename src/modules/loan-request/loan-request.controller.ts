import {
  Body,
  CacheInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PermissionName } from 'nestjs-basic-acl-sdk';

import { LoanRequestService } from './loan-request.service';

import { CreateLoanRequestInput } from './dto/create-loan-request-input.dto';
import { GetUserLoanRequestsParamsInput } from './dto/get-user-loan-requests-params-input.dto';
import { GetUserLoanRequestsQueryInput } from './dto/get-user-loan-requests-query-input.dto';
import { GetOneLoanRequestInput } from './dto/get-one-loan-request-input.dto';
import { UpdateUserLoanRequestInput } from './dto/update-user-loan-request-input.dto';

@UseInterceptors(CacheInterceptor)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('loan-requests')
export class LoanRequestController {
  constructor(private readonly service: LoanRequestService) {}

  @PermissionName('loanRequests:handle')
  @Post()
  create(@Body() input: CreateLoanRequestInput) {
    return this.service.create(input);
  }

  @PermissionName('loanRequests:read')
  @Get('user-loan-requests/:userAuthUid')
  getUserLoanRequests(
    @Param() params: GetUserLoanRequestsParamsInput,
    @Query() query: GetUserLoanRequestsQueryInput,
  ) {
    return this.service.getUserLoanRequests(params, query);
  }

  @PermissionName('loanRequests:read')
  @Get('/:loanRequestId')
  getOne(@Param() params: GetOneLoanRequestInput) {
    return this.service.getOne(params);
  }

  @PermissionName('loanRequests:handle')
  @Patch('/:loanRequestId')
  updateUserLoanRequest(
    @Param() params: GetOneLoanRequestInput,
    @Body() input: UpdateUserLoanRequestInput,
  ) {
    return this.service.updateUserLoanRequest(params, input);
  }

  @PermissionName('loanRequests:handle')
  @Delete('/:loanRequestId')
  deleteUserLoanRequest(@Param() params: GetOneLoanRequestInput) {
    return this.service.delete(params);
  }
}
