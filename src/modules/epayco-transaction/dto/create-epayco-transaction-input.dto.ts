import { IsNumber, IsUUID } from 'class-validator';

export class CreateEpaycoTransactionInput {
  @IsUUID()
  readonly loanUid: string;

  @IsNumber()
  readonly amount: number;
}
