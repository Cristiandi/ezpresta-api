import { IsNumber, IsString } from 'class-validator';

export class CreatePaymentMovementInput {
  @IsString()
  readonly key: string;

  @IsString()
  readonly loanUid: string;

  @IsNumber()
  readonly amount: number;
}
