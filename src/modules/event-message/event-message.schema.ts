import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventMessageDocument = EventMessage & Document;

@Schema()
export class EventMessage {
  @Prop({ required: true })
  hash: string;

  @Prop({ required: true })
  routingKey: string;

  @Prop({ required: true })
  functionName: string;

  @Prop({ required: true, type: JSON })
  data: JSON;

  @Prop({ type: JSON })
  error: JSON;

  @Prop({ required: true })
  environment: string;

  @Prop({ default: new Date() })
  createdAt: Date;
}

export const EventMessageSchema = SchemaFactory.createForClass(EventMessage);
