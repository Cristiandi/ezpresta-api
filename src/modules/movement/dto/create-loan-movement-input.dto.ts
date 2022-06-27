import { IsUUID } from 'class-validator';

export class CreateLoanMovementInput {
  @IsUUID()
  readonly loanUid: string;
}
