import { IsDateString, IsNumber, IsString } from 'class-validator';

export class CreateLoanInput {
  @IsString()
  key: string;

  @IsString()
  readonly userAuthUid: string;

  @IsNumber()
  readonly amount: number;

  @IsNumber()
  readonly monthlyInterestRate: number;

  @IsNumber()
  readonly monthlyInterestOverdueRate: number;

  @IsDateString({
    format: 'YYYY-MM-DD',
    length: 10,
  })
  readonly startDate: string;
}
