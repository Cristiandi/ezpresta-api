import { IsUUID } from 'class-validator';

export class GetLoanPaymentStatusInput {
  @IsUUID()
  readonly loanUid: string;
}
