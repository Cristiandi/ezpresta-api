import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../user/user.entity';
import { Movement } from '../movement/movement.entity';

@ObjectType()
@Entity({ name: 'loan' })
@Unique('uk_loan_uid', ['uid'])
export class Loan extends BaseEntity {
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
  @Column({
    name: 'annual_interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 3,
  })
  annualInterestRate: number;

  @Field()
  @Column({
    name: 'monthly_interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 3,
  })
  monthlyInterestRate: number;

  @Field()
  @Column({
    name: 'annual_interest_overdue_rate',
    type: 'decimal',
    precision: 5,
    scale: 3,
  })
  annualInterestOverdueRate: number;

  @Field()
  @Column({
    name: 'monthly_interest_overdue_rate',
    type: 'decimal',
    precision: 5,
    scale: 3,
  })
  monthlyInterestOverdueRate: number;

  @Field()
  @Column({
    name: 'start_date',
    type: 'timestamptz',
  })
  startDate: Date;

  @Field()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // relations

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.loans, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => [Movement])
  @OneToMany(() => Movement, (movement) => movement.loan)
  movements: Movement[];
}
