export class SendEmailInput {
  readonly to: string | string[];

  readonly subject: string;

  readonly templateName: string;

  readonly parameters: Record<string, any>;

  readonly text?: string;

  readonly attachment?;
}
