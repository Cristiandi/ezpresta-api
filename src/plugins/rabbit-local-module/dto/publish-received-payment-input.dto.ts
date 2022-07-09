import { IsUUID } from 'class-validator';

export class PublishReceivedPaymentInput {
  @IsUUID()
  readonly movementUid: string;
}
