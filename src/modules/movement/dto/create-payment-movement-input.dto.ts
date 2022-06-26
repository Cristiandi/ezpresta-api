import { IsDateString, IsNumber, IsString } from 'class-validator';

export class CreatePaymentMovementInput {
  @IsString()
  readonly loanUid: string;

  @IsNumber()
  readonly amount: number;

  @IsDateString({
    format: 'YYYY-MM-DD',
    length: 10,
  })
  readonly paymentDate: string;
}
