import {
  Body,
  CacheInterceptor,
  CacheTTL,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PermissionName } from 'nestjs-basic-acl-sdk';

import { Loan } from './loan.entity';

import { LoanService } from './loan.service';

import { CreateLoanInput } from './dto/create-loan-input.dto';
import { GetUserLoansParamsInput } from './dto/get-user-loans-params-input.dto';
import { GetUserLoansQueryInput } from './dto/get-user-loans-query-input.dto';
import { GetLoanDetailsInput } from './dto/get-loan-details-input.dto';
import { GetAllBorrowersInput } from './dto/get-all-borrowers-input.dto';

@UseInterceptors(CacheInterceptor)
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

  @PermissionName('loans:read')
  @Get('user-loans/:userAuthUid')
  getUserLoans(
    @Param() params: GetUserLoansParamsInput,
    @Query() query: GetUserLoansQueryInput,
  ) {
    return this.loanService.getUserLoans(params, query);
  }

  @PermissionName('loans:read')
  @Get('details/:loanUid')
  getLoanDetails(@Param() params: GetLoanDetailsInput) {
    return this.loanService.getLoanDetails(params);
  }

  @CacheTTL(3600 * 24)
  @PermissionName('loans:admin:read')
  @Get('overview')
  getOverview() {
    return this.loanService.getOverview();
  }

  @CacheTTL(3600)
  @PermissionName('loans:read:admin')
  @Get('admin/borrowers')
  getAllBorrowers(@Query() input: GetAllBorrowersInput) {
    return this.loanService.getAllBorrowers(input);
  }
}
