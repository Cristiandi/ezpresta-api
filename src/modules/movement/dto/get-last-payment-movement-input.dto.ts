import { IsString } from 'class-validator';

export class GetLastPaymentMovementInput {
  @IsString()
  loanUid: string;
}
