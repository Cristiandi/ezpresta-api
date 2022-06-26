import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PermissionName, Public } from 'nestjs-basic-acl-sdk';

import { UserService } from './user.service';

import { CreateBorrowerInput } from './dto/create-borrower-input.dto';
import { GetOneUserInput } from './dto/get-one-user-input.dto';
import { ChangeUserEmailInput } from './dto/change-user-email-input.dto';
import { ChangeUserPhoneInput } from './dto/change-user-phone-input.dto';
import { ChangeUserAddressInput } from './dto/change-user-address-input.dto';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('borrower')
  createBorrower(@Body() input: CreateBorrowerInput) {
    return this.userService.createBorrower(input);
  }

  @PermissionName('user:read')
  @Get('/:authUid')
  getOne(@Param() input: GetOneUserInput) {
    return this.userService.getOne(input);
  }

  @PermissionName('users:handle')
  @Delete('borrower/:authUid')
  deleteBorrower(@Param() input: GetOneUserInput) {
    return this.userService.deleteBorrower(input);
  }

  @PermissionName('user:handle')
  @Patch('email')
  changeEmail(@Body() input: ChangeUserEmailInput) {
    return this.userService.changeEmail(input);
  }

  @PermissionName('user:handle')
  @Patch('phone')
  changePhone(@Body() input: ChangeUserPhoneInput) {
    return this.userService.changePhone(input);
  }

  @PermissionName('user:handle')
  @Patch('address')
  changeAddress(@Body() input: ChangeUserAddressInput) {
    return this.userService.changeAddress(input);
  }
}
