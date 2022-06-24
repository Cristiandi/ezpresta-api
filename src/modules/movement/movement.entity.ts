import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Loan } from '../loan/loan.entity';
import { MovementType } from '../movement-type/movement-type.entity';

@ObjectType()
@Entity({ name: 'movement' })
@Unique('uk_movement_uid', ['uid'])
export class Movement extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Generated('uuid')
  @Column()
  uid: string;

  @Field()
  @Column({ type: 'decimal', precision: 12, scale: 3 })
  amount: number;

  @Field()
  @Column({ type: 'timestamptz' })
  at: Date;

  @Field()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // relations

  @Field(() => Loan)
  @ManyToOne(() => Loan, (loan) => loan.movements, { nullable: false })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @Field(() => MovementType)
  @ManyToOne(() => MovementType, (movementType) => movementType.movements, {
    nullable: false,
  })
  @JoinColumn({ name: 'movement_type_id' })
  movementType: MovementType;
}
