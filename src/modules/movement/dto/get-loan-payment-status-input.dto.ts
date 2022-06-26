import { IsString } from 'class-validator';

export class GetLoanPaymentStatusInput {
  @IsString()
  readonly loanUid: string;
}
