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
import { EpaycoTransaction } from '../epayco-transaction/epayco-transaction.entity';

@Entity({ name: 'loan' })
@Unique('uk_loan_uid', ['uid'])
export class Loan extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column()
  uid: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  description?: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    transformer: {
      from: (value: string) => parseFloat(value),
      to: (value: number) => value,
    },
  })
  amount: number;

  @Column({
    name: 'annual_interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 3,
    transformer: {
      from: (value: string) => parseFloat(value),
      to: (value: number) => value,
    },
  })
  annualInterestRate: number;

  @Column({
    name: 'monthly_interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 3,
    transformer: {
      from: (value: string) => parseFloat(value),
      to: (value: number) => value,
    },
  })
  monthlyInterestRate: number;

  @Column({
    name: 'annual_interest_overdue_rate',
    type: 'decimal',
    precision: 5,
    scale: 3,
    transformer: {
      from: (value: string) => parseFloat(value),
      to: (value: number) => value,
    },
  })
  annualInterestOverdueRate: number;

  @Column({
    name: 'monthly_interest_overdue_rate',
    type: 'decimal',
    precision: 5,
    scale: 3,
    transformer: {
      from: (value: string) => parseFloat(value),
      to: (value: number) => value,
    },
  })
  monthlyInterestOverdueRate: number;

  @Column({
    name: 'start_date',
    type: 'timestamptz',
  })
  startDate: Date;

  @Column({
    type: 'boolean',
    default: false,
  })
  paid?: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // relations

  @ManyToOne(() => User, (user) => user.loans, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Movement, (movement) => movement.loan)
  movements: Movement[];

  @OneToMany(
    () => EpaycoTransaction,
    (epaycoTransaction) => epaycoTransaction.loan,
  )
  epaycoTransactions: EpaycoTransaction[];
}
