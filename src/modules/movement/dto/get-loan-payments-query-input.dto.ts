import { IsNumberString, IsOptional } from 'class-validator';

export class GetLoanPaymentsQueryInput {
  @IsOptional()
  @IsNumberString()
  readonly limit?: string;
}
