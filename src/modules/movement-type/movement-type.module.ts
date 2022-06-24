import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import appConfig from '../../config/app.config';

import { MovementType } from './movement-type.entity';

import { MovementTypeService } from './movement-type.service';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    TypeOrmModule.forFeature([MovementType]),
  ],
  providers: [MovementTypeService],
  exports: [MovementTypeService],
})
export class MovementTypeModule {}
