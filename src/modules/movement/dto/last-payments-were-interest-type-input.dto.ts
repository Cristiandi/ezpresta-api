import { IsNumber, IsUUID } from 'class-validator';

export class LastPaymentsWereInterestTypeInput {
  @IsUUID()
  readonly loanUid: string;

  @IsNumber()
  readonly numberOfPayments: number;
}
