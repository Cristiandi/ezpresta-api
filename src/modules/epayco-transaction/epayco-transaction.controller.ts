import {
  All,
  Body,
  Controller,
  Post,
  Query,
  Redirect,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PermissionName, Public } from 'nestjs-basic-acl-sdk';

import { EpaycoTransactionService } from './epayco-transaction.service';

import { CreateEpaycoTransactionInput } from './dto/create-epayco-transaction-input.dto';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('epayco-transactions')
export class EpaycoTransactionController {
  constructor(private readonly service: EpaycoTransactionService) {}

  @PermissionName('epaycTtransactions:handle')
  @Post()
  create(@Body() input: CreateEpaycoTransactionInput) {
    return this.service.create(input);
  }

  @Public()
  @Post('/confirmation')
  confirmation(@Body() input: any) {
    return this.service.initConfirmation(input);
  }

  @Public()
  @All('/response')
  @Redirect(process.env.SELF_WEB_URL, 302)
  handleResponsePage(@Query() queryInput: any) {
    return this.service.handleResponsePage(queryInput);
  }
}
