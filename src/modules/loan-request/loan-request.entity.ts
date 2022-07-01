import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum LoanRequestStatus {
  CREADA = 'CREADA',
  REVISION = 'REVISION',
  RECHAZADA = 'RECHAZADA',
  APROBADA = 'APROBADA',
}

@Entity({ name: 'loan_request' })
@Unique('uk_loan_request_uid', ['uid'])
export class Loan extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column()
  uid: string;

  @Column({ type: 'varchar', length: 160 })
  description: string;

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
    type: 'enum',
    enum: LoanRequestStatus,
    default: LoanRequestStatus.CREADA,
  })
  status: LoanRequestStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // relations
}
