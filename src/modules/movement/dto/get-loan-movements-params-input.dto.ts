import { IsUUID } from 'class-validator';

export class GetLoanMovementsParamsInput {
  @IsUUID()
  readonly loanUid: string;
}
