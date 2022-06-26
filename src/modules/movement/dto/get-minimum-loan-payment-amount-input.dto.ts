import { IsString } from 'class-validator';

export class GetMinimumLoanPaymentAmountInput {
  @IsString()
  readonly loanUid: string;
}
