import {
  Body,
  CacheInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Movement } from './movement.entity';

import { MovementService } from './movement.service';
import { PermissionName } from 'nestjs-basic-acl-sdk';

import { CreatePaymentMovementInput } from './dto/create-payment-movement-input.dto';
import { GetLoanPaymentsParamsInput } from './dto/get-loan-payments-params-input.dto';
import { GetLoanPaymentsQueryInput } from './dto/get-loan-payments-query-input.dto';
import { GetLoanMovementsParamsInput } from './dto/get-loan-movements-params-input.dto';
import { GetLoanMovementsQueryInput } from './dto/get-loan-movements-query-input.dto';

@UseInterceptors(CacheInterceptor)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('movements')
export class MovementController {
  constructor(private readonly movementService: MovementService) {}

  @PermissionName('movements:handle')
  @Post('payment')
  createPaymentMovement(
    @Body() input: CreatePaymentMovementInput,
  ): Promise<Movement> {
    return this.movementService.createPaymentMovement(input);
  }

  @PermissionName('movements:read')
  @Get('loan/:loanUid/payments')
  getLoanPayments(
    @Param() paramsInput: GetLoanPaymentsParamsInput,
    @Query() queryInput: GetLoanPaymentsQueryInput,
  ) {
    return this.movementService.getLoanPayments(paramsInput, queryInput);
  }

  @PermissionName('movements:read')
  @Get('loan/:loanUid/movements')
  getLoanMovements(
    @Param() paramsInput: GetLoanMovementsParamsInput,
    @Query() queryInput: GetLoanMovementsQueryInput,
  ) {
    return this.movementService.getLoanMovements(paramsInput, queryInput);
  }
}
