import { IsString } from 'class-validator';

export class GetLoanPaymentDateInput {
  @IsString()
  loanUid: string;
}
