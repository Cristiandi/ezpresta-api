import { IsUUID } from 'class-validator';

export class GetTotalLoanAmountInput {
  @IsUUID()
  readonly loanUid: string;
}
