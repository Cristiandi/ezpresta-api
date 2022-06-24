import { IsString } from 'class-validator';

export class CreateLoanMovementInput {
  @IsString()
  readonly loanUid: string;
}
