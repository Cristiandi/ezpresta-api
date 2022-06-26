import { IsString } from 'class-validator';

export class GetLoanDetailsInput {
  @IsString()
  readonly loanUid: string;
}
