import { IsString } from 'class-validator';

export class GetLoanMovementInput {
  @IsString()
  loanUid: string;
}
