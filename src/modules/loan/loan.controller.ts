import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PermissionName, Public } from 'nestjs-basic-acl-sdk';

import { Loan } from './loan.entity';

import { LoanService } from './loan.service';

import { CreateLoanInput } from './dto/create-loan-input.dto';
import { GetUserLoansParamsInput } from './dto/get-user-loans-params-input.dto';
import { GetUserLoansQueryInput } from './dto/get-user-loans-query-input.dto';
import { GetLoanDetailsInput } from './dto/get-loan-details-input.dto';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @PermissionName('loans:handle')
  @Post()
  create(@Body() input: CreateLoanInput): Promise<Loan> {
    return this.loanService.create(input);
  }

  @PermissionName('loans:execute')
  @Post('interest-settlement')
  interestSettlement(): Promise<void> {
    return this.loanService.interestSettlement();
  }

  @PermissionName('loans:user:read')
  @Get('user-loans/:userAuthUid')
  getUserLoans(
    @Param() params: GetUserLoansParamsInput,
    @Query() query: GetUserLoansQueryInput,
  ) {
    return this.loanService.getUserLoans(params, query);
  }

  @PermissionName('loans:user:read')
  @Get('details/:loanUid')
  getLoanDetails(@Param() params: GetLoanDetailsInput) {
    return this.loanService.getLoanDetails(params);
  }
}
