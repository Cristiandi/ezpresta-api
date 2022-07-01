import { Module } from '@nestjs/common';
import { LoanRequestService } from './loan-request.service';
import { LoanRequestController } from './loan-request.controller';

@Module({
  providers: [LoanRequestService],
  controllers: [LoanRequestController],
})
export class LoanRequestModule {}
