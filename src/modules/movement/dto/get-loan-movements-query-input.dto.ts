import { IsNumberString, IsOptional } from 'class-validator';

export class GetLoanMovementsQueryInput {
  @IsOptional()
  @IsNumberString()
  readonly limit?: string;
}
