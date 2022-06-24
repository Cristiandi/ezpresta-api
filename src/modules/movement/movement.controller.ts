import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Movement } from './movement.entity';

import { MovementService } from './movement.service';

import { CreatePaymentMovementInput } from './dto/create-payment-movement-input.dto';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('movements')
export class MovementController {
  constructor(private readonly movementService: MovementService) {}

  @Post('payment')
  createPaymentMovement(
    @Body() input: CreatePaymentMovementInput,
  ): Promise<Movement> {
    return this.movementService.createPaymentMovement(input);
  }
}
