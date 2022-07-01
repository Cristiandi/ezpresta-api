import { IsNumber, IsString } from 'class-validator';

export class UpdateUserLoanRequestInput {
  @IsNumber()
  readonly amount: number;

  @IsString()
  readonly description: string;
}
