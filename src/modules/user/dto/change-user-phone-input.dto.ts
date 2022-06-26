import { IsString, Length } from 'class-validator';

export class ChangeUserPhoneInput {
  @IsString()
  readonly authUid: string;

  @Length(10)
  @IsString()
  readonly phone: string;
}
