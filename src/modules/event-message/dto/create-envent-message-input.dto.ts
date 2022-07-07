export class CreateEventMessageInput {
  readonly routingKey: string;

  readonly functionName: string;

  readonly data: any;

  readonly error?: any;
}
