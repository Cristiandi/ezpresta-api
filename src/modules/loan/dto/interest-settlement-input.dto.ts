import { IsString } from 'class-validator';

export class InterestSettlementInput {
  @IsString()
  key: string;
}
