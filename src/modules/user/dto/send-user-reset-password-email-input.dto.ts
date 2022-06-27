import { IsEmail } from 'class-validator';

export class SendUserResetPasswordEmail {
  @IsEmail()
  readonly email: string;
}
