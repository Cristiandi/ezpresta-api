import { IsDateString, IsNumber, IsUUID } from 'class-validator';

export class CreatePaymentMovementInput {
  @IsUUID()
  readonly loanUid: string;

  @IsNumber()
  readonly amount: number;

  @IsDateString({
    format: 'YYYY-MM-DD',
    length: 10,
  })
  readonly paymentDate: string;
}
