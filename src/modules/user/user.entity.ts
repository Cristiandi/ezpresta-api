import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Loan } from '../loan/loan.entity';

@ObjectType()
@Entity({ name: 'user' })
@Unique('uk_user_auth_uid', ['authUid'])
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ name: 'auth_uid', type: 'varchar', length: 100, nullable: true })
  authUid?: string;

  @Field({ nullable: true })
  @Column({
    name: 'document_number',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  documentNumber?: string;

  @Field({ nullable: true })
  @Column({ name: 'full_name', type: 'varchar', length: 160, nullable: true })
  fullName?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 13, nullable: true })
  phone?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  addres?: string;

  @Field()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // relations

  @Field(() => [Loan])
  @OneToMany(() => Loan, (loan) => loan.user)
  loans: Loan[];
}
