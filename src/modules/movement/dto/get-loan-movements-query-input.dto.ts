import { IsDateString, IsNumberString, IsOptional } from 'class-validator';

export class GetLoanMovementsQueryInput {
  @IsOptional()
  @IsNumberString()
  readonly limit?: string;

  @IsOptional()
  @IsDateString({
    format: 'YYYY-MM-DD',
    length: 10,
  })
  readonly startDate: string;

  @IsOptional()
  @IsDateString({
    format: 'YYYY-MM-DD',
    length: 10,
  })
  readonly endDate: string;
}
