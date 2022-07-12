import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class GetAllBorrowersInput {
  @IsOptional()
  @IsString()
  readonly q?: string;

  @IsOptional()
  @IsNumberString()
  readonly limit?: string;

  @IsOptional()
  @IsNumberString()
  readonly skip?: string;
}
