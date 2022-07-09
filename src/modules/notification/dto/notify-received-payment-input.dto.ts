import { IsUUID } from 'class-validator';

export class NotifyReceivedPaymentInput {
  @IsUUID()
  readonly movementUid: string;
}
