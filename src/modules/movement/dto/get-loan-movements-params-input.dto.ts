import { IsString, IsUUID, Length } from 'class-validator';

export class GetLoanMovementsParamsInput {
  @IsUUID()
  readonly loanUid: string;
}
