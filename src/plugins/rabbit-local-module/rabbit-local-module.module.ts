import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRabbitMQExchangeName } from '../../utils';

import appConfig from '../../config/app.config';

import { RabbitLocalModuleService } from './rabbit-local-module.service';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rabbitmqURL = configService.get<string>('config.rabbitmq.url');

        const rabbitmqExchangeName = getRabbitMQExchangeName();

        const waitForConnection = configService.get<boolean>(
          'config.rabbitmq.waitForConnection',
        );

        return {
          exchanges: [
            {
              type: 'topic', // TODO: use a env variable
              name: rabbitmqExchangeName,
            },
          ],
          channels: {
            'channel-1': {
              prefetchCount: 1,
              default: true,
            },
          },
          uri: rabbitmqURL,
          connectionInitOptions: { wait: waitForConnection },
        };
      },
    }),
  ],
  providers: [RabbitLocalModuleService],
  exports: [RabbitLocalModuleService],
})
export class RabbitLocalModuleModule {}
