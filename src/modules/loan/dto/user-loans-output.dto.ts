export class UserLoansOutput {
  readonly id: number;

  readonly uid: string;

  readonly description: string;

  readonly minimumLoanPaymentAmount: number;

  readonly loanPaymentDate: Date;

  readonly loanPaymentStatus: string;
}
