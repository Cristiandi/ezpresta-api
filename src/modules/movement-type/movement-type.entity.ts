import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Movement } from '../movement/movement.entity';

@ObjectType()
@Entity({ name: 'movement_type' })
@Unique('uk_movement_type_uid', ['uid'])
export class MovementType extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Generated('uuid')
  @Column()
  uid: string;

  @Field()
  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Field()
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Field()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // relations

  @Field(() => [Movement])
  @OneToMany(() => Movement, (movement) => movement.movementType)
  movements: Movement[];
}
