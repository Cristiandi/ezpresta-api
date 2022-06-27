import { IsString, Length } from 'class-validator';

export class GetLoanPaymentsParamsInput {
  @Length(5)
  @IsString()
  readonly loanUid: string;
}
