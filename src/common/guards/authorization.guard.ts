import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { BasicAclService } from 'nestjs-basic-acl-sdk';

import appConfig from '../../config/app.config';

import { IS_PUBLIC_KEY } from 'nestjs-basic-acl-sdk';
import { PERMISSION_NAME_KEY } from 'nestjs-basic-acl-sdk';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    private readonly basicAclService: BasicAclService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // check if the request is public
    const isPublic = this.reflector.get<string>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );

    if (isPublic) return true;

    // get the request from the context
    const request = context.switchToHttp().getRequest();

    // try to get the authorization header
    const authorizationHeader: string =
      request.headers['Authorization'] || request.headers['authorization'];
    if (!authorizationHeader) {
      throw new UnauthorizedException('authorization header not found.');
    }

    // try to get the token from the authorization header
    const tokenArray = authorizationHeader.split(' ');
    if (tokenArray.length !== 2) {
      throw new UnauthorizedException('invalid token format.');
    }

    const token = tokenArray[1];

    if (!token) {
      throw new UnauthorizedException('token not found.');
    }

    // get the permission name from the annotation @PermissionName
    const permissionName = this.reflector.get<string>(
      PERMISSION_NAME_KEY,
      context.getHandler(),
    );

    if (!permissionName) {
      throw new InternalServerErrorException('acl slug not found.');
    }

    // check if the user has the permission to access the resource in the acl
    try {
      const permission = await this.basicAclService.checkPermission({
        token,
        permissionName,
      });

      /*
      Logger.log(
        `permission ${JSON.stringify(permission)}.`,
        AuthorizationGuard.name,
      );
      */

      return permission.allowed;
    } catch (error) {
      Logger.error(
        `permission check error ${error.message}.`,
        AuthorizationGuard.name,
      );
      throw new UnauthorizedException(error.message);
    }
  }
}
