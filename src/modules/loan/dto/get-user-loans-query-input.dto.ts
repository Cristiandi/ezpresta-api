import { IsNumberString, IsOptional } from 'class-validator';

export class GetUserLoansQueryInput {
  @IsOptional()
  @IsNumberString()
  readonly limit?: string;
}
