import { IsUUID } from 'class-validator';

export class GetMinimumLoanPaymentAmountInput {
  @IsUUID()
  readonly loanUid: string;
}
