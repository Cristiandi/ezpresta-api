import { IsString } from 'class-validator';

export class SettleLoanInterestsInput {
  @IsString()
  readonly loanUid: string;
}
