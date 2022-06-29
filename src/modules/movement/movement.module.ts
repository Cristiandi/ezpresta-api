import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

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
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rabbitmqURL = configService.get<string>('config.rabbitmq.url');

        const rabbitmqExchange = configService.get<string>(
          'config.rabbitmq.exchange',
        );

        const waitForConnection = configService.get<boolean>(
          'config.rabbitmq.waitForConnection',
        );

        return {
          exchanges: [
            {
              type: 'topic', // TODO: use a env variable
              name: rabbitmqExchange,
            },
          ],
          uri: rabbitmqURL,
          connectionInitOptions: { wait: waitForConnection },
        };
      },
    }),
    forwardRef(() => LoanModule),
    MovementTypeModule,
  ],
  providers: [MovementService],
  exports: [MovementService],
  controllers: [MovementController],
})
export class MovementModule {}
