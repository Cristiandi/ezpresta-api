import { IsNumber, IsString } from 'class-validator';

export class CreateLoanRequestInput {
  @IsString()
  readonly userAuthUid: string;

  @IsNumber()
  readonly amount: number;

  @IsString()
  readonly description: string;
}
