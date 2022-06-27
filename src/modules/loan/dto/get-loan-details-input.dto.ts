import { IsUUID } from 'class-validator';

export class GetLoanDetailsInput {
  @IsUUID()
  readonly loanUid: string;
}
