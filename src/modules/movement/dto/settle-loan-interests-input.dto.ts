import { IsUUID } from 'class-validator';

export class SettleLoanInterestsInput {
  @IsUUID()
  readonly loanUid: string;
}
