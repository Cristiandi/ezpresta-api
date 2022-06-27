import { IsUUID } from 'class-validator';

export class GetLoanPaymentsParamsInput {
  @IsUUID()
  readonly loanUid: string;
}
