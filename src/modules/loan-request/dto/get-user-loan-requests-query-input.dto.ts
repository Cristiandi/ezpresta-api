import { IsEnum, IsNumberString, IsOptional } from 'class-validator';
import { LoanRequestStatus } from '../loan-request.entity';

export class GetUserLoanRequestsQueryInput {
  @IsOptional()
  @IsNumberString()
  readonly limit?: string;

  @IsOptional()
  @IsNumberString()
  readonly skip?: string;

  @IsOptional()
  @IsEnum(LoanRequestStatus)
  readonly status?: LoanRequestStatus;
}
