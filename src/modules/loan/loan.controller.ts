import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { Loan } from './loan.entity';

import { LoanService } from './loan.service';

import { InterestSettlementInput } from './dto/interest-settlement-input.dto';
import { CreateLoanInput } from './dto/create-loan-input.dto';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post()
  create(@Body() input: CreateLoanInput): Promise<Loan> {
    return this.loanService.create(input);
  }

  @Post('interest-settlement')
  interestSettlement(@Body() input: InterestSettlementInput): Promise<void> {
    return this.loanService.interestSettlement(input);
  }
}
