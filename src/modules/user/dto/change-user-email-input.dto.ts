import { IsEmail, IsString } from 'class-validator';

export class ChangeUserEmailInput {
  @IsString()
  readonly authUid: string;

  @IsEmail()
  readonly email: string;
}
