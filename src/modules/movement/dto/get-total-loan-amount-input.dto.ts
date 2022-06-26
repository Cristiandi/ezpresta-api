import { IsString } from 'class-validator';

export class GetTotalLoanAmountInput {
  @IsString()
  readonly loanUid: string;
}
