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
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';

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
    const shouldSkip = isRabbitContext(context);
    if (shouldSkip) return true;

    // check if the request is public
    const isPublic = this.reflector.get<string>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );

    if (isPublic) return true;

    // get the permission name from the annotation @PermissionName
    const permissionName = this.reflector.get<string>(
      PERMISSION_NAME_KEY,
      context.getHandler(),
    );

    if (!permissionName) {
      throw new InternalServerErrorException('acl slug not found.');
    }

    // get the request from the context
    const request = context.switchToHttp().getRequest();

    // try to get the authorization header
    const authorizationHeader: string =
      request.headers['Authorization'] || request.headers['authorization'];

    // try to get the api-key header
    const apiKeyHeader: string =
      request.headers['Api-Key'] || request.headers['api-key'];

    if (!authorizationHeader && !apiKeyHeader) {
      throw new UnauthorizedException(
        `api-key header and authorization header weren't found.`,
      );
    }

    let token;
    if (authorizationHeader) {
      // try to get the token from the authorization header
      const tokenArray = authorizationHeader.split(' ');
      if (tokenArray.length !== 2) {
        throw new UnauthorizedException('invalid token format.');
      }

      token = tokenArray[1];

      if (!token) {
        throw new UnauthorizedException('token not found.');
      }
    }

    let apiKey;
    if (apiKeyHeader) {
      // try to get the api-key from the api-key header
      apiKey = apiKeyHeader;

      if (!apiKey) {
        throw new UnauthorizedException('api-key not found.');
      }
    }

    // check if the user has the permission to access the resource in the acl
    try {
      const permission = await this.basicAclService.checkPermission({
        token,
        permissionName,
        apiKey,
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
