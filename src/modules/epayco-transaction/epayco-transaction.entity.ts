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

@Entity({ name: 'epayco_transaction' })
@Unique('uk_epayco_transaction_uid', ['uid'])
export class EpaycoTransaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column()
  uid: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  reference?: string;

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

  @Column({ type: 'int', default: 0 })
  status: number;

  @Column({ type: 'boolean', default: false, nullable: true })
  used?: boolean;

  @Column({ type: 'varchar', length: 160, nullable: true })
  comment?: string;

  @Column({ type: 'boolean', default: true, nullable: true })
  testing?: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // relations

  @ManyToOne(() => Loan, (loan) => loan.movements, { nullable: false })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;
}
