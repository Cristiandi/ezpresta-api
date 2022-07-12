import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class GetAllUsersInput {
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
