import { Controller, Get } from '@nestjs/common';
import { Public } from 'nestjs-basic-acl-sdk';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
