import { IsString } from 'class-validator';

export class GetOneLoanRequestInput {
  @IsString()
  readonly loanRequestUid: string;
}
