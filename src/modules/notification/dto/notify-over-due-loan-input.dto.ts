import { IsUUID } from 'class-validator';

export class NotifyOverdueLoanInputDto {
  @IsUUID()
  readonly loanUid: string;
}
