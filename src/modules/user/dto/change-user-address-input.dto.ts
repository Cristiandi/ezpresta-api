import { IsString } from 'class-validator';

export class ChangeUserAddressInput {
  @IsString()
  readonly authUid: string;

  @IsString()
  readonly address: string;
}
