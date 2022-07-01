import { IsString } from 'class-validator';

export class GetUserLoanRequestsParamsInput {
  @IsString()
  readonly userAuthUid: string;
}
