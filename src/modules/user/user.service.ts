import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicAclService } from 'nestjs-basic-acl-sdk';

import appConfig from '../../config/app.config';

import { User } from './user.entity';

import { BaseService } from '../../common/base.service';

import { CreateBorrowerInput } from './dto/create-borrower-input.dto';
import { GetOneUserInput } from './dto/get-one-user-input.dto';
import { ChangeUserEmailInput } from './dto/change-user-email-input.dto';
import { ChangeUserPhoneInput } from './dto/change-user-phone-input.dto';
import { ChangeUserAddressInput } from './dto/change-user-address-input.dto';
import { SendUserResetPasswordEmail } from './dto/send-user-reset-password-email-input.dto';
import { ChangeUserPasswordInput } from './dto/change-user-password-input.dto';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly basicAclService: BasicAclService,
  ) {
    super(userRepository);
  }

  public async createBorrower(input: CreateBorrowerInput): Promise<User> {
    // check if the user already exists by document number
    const { documentNumber } = input;

    const existingUserByDocumentNumber = await this.getOneByFields({
      fields: {
        documentNumber,
      },
      loadRelationIds: false,
    });

    if (existingUserByDocumentNumber) {
      throw new ConflictException(
        `already exist an user with the document number ${documentNumber}.`,
      );
    }

    // check if the user already exists by email
    const { email } = input;

    const exisingUserByEmail = await this.getOneByFields({
      fields: {
        email,
      },
      loadRelationIds: false,
    });

    if (exisingUserByEmail) {
      throw new ConflictException(
        `already exist an user with the email ${email}.`,
      );
    }

    const { phone } = input;

    const exisingUserByPhoneNumber = await this.getOneByFields({
      fields: {
        phone,
      },
      loadRelationIds: false,
    });

    if (exisingUserByPhoneNumber) {
      throw new ConflictException(
        `already exist an user with the phone number ${phone}.`,
      );
    }

    const { password, fullName } = input;

    const roleCode = '01BO'; // TODO: get the role code from the config

    const aclUser = await this.basicAclService.createUser({
      email,
      password,
      phone: `+57${phone}`,
      roleCode: roleCode,
      sendEmail: true,
      emailTemplateParams: {
        fullName,
      },
    });

    try {
      const { authUid } = aclUser;

      const { address } = input;

      const createdUser = this.userRepository.create({
        authUid,
        documentNumber,
        fullName,
        email,
        phone,
        address,
      });

      const savedUser = await this.userRepository.save(createdUser);

      return savedUser;
    } catch (error) {
      Logger.warn('deleting the user in ACL', UserService.name);

      await this.basicAclService.deleteUser({
        authUid: aclUser.authUid,
      });
    }
  }

  public async getOne(input: GetOneUserInput): Promise<User> {
    const existingUser = await this.getOneByFields({
      fields: {
        authUid: input.authUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    return existingUser;
  }

  public async deleteBorrower(input: GetOneUserInput): Promise<User> {
    // get the user
    const existingUser = await this.getOneByFields({
      fields: {
        authUid: input.authUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // check if the user exists
    if (!existingUser) {
      throw new NotFoundException(
        `the user with the authUid ${input.authUid} does not exist.`,
      );
    }

    // delete the user
    const deletedUser = await this.userRepository.remove(existingUser);

    // delete the user in ACL
    await this.basicAclService.deleteUser({
      authUid: deletedUser.authUid,
    });

    return deletedUser;
  }

  public async changeEmail(input: ChangeUserEmailInput): Promise<User> {
    const { authUid } = input;

    // get the user
    const existingUser = await this.getOneByFields({
      fields: {
        authUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    // update the user in ACL
    const { email } = input;

    await this.basicAclService.changeEmail({
      authUid: existingUser.authUid,
      email,
      emailTemplateParams: {
        fullName: existingUser.fullName,
      },
    });

    // update the user in DB
    const preloadedUser = await this.userRepository.preload({
      id: existingUser.id,
      email,
    });

    const updatedUser = await this.userRepository.save(preloadedUser);

    return updatedUser;
  }

  public async changePhone(input: ChangeUserPhoneInput): Promise<User> {
    const { authUid } = input;

    const existingUser = await this.getOneByFields({
      fields: {
        authUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    const { phone } = input;

    // change the phone in the ACL
    try {
      await this.basicAclService.changePhone({
        authUid: existingUser.authUid,
        phone: `+57${phone}`,
      });
    } catch (error) {
      if (error?.message.includes('user not found')) {
        throw new ConflictException(`the phone ${phone} it's already used.`);
      }
    }

    // update the user in DB
    const preloadedUser = await this.userRepository.preload({
      id: existingUser.id,
      phone,
    });

    const updatedUser = await this.userRepository.save(preloadedUser);

    return updatedUser;
  }

  public async changeAddress(input: ChangeUserAddressInput): Promise<User> {
    const { authUid } = input;

    const existingUser = await this.getOneByFields({
      fields: {
        authUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    const { address } = input;

    // update the user in DB
    const preloadedUser = await this.userRepository.preload({
      id: existingUser.id,
      address,
    });

    const updatedUser = await this.userRepository.save(preloadedUser);

    return updatedUser;
  }

  public async sendResetPasswordEmail(input: SendUserResetPasswordEmail) {
    const { email } = input;

    await this.basicAclService.sendResetPasswordEmail({
      email,
    });

    return {
      message: 'email message was sent',
    };
  }

  public async changePassword(
    paramInput: GetOneUserInput,
    bodyInput: ChangeUserPasswordInput,
  ) {
    const { authUid } = paramInput;

    const existingUser = await this.getOneByFields({
      fields: {
        authUid,
      },
      checkIfExists: true,
      loadRelationIds: false,
    });

    const { oldPassword, newPassword } = bodyInput;

    try {
      await this.basicAclService.changePassword({
        authUid: existingUser.authUid,
        oldPassword,
        newPassword,
        emailTemplateParams: {
          fullName: existingUser.fullName,
        },
      });
    } catch (error) {
      if (error?.message.includes('incorrect')) {
        throw new UnauthorizedException(
          'the password is incorrect.',
          UserService.name,
        );
      }
      throw error;
    }

    return {
      message: 'password was changed',
    };
  }
}
