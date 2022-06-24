import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import appConfig from '../../config/app.config';
import { Movement } from './movement.entity';

import { MovementService } from './movement.service';

import { LoanModule } from '../loan/loan.module';
import { MovementTypeModule } from '../movement-type/movement-type.module';
import { MovementController } from './movement.controller';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    TypeOrmModule.forFeature([Movement]),
    forwardRef(() => LoanModule),
    MovementTypeModule,
  ],
  providers: [MovementService],
  exports: [MovementService],
  controllers: [MovementController],
})
export class MovementModule {}
