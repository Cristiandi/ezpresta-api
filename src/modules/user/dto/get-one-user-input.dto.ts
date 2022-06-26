import { IsString } from 'class-validator';

export class GetOneUserInput {
  @IsString()
  authUid: string;
}
