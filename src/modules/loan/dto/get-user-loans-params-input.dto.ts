import { IsString } from 'class-validator';

export class GetUserLoansParamsInput {
  @IsString()
  userAuthUid: string;
}
