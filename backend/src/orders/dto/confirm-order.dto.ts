import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Payment confirmation callback. In live mode these carry the Razorpay
 * order/payment ids + signature to verify. In stub mode they may be empty —
 * the stub adapter marks the order paid without a real charge (test mode).
 */
export class ConfirmOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  razorpayOrderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  razorpayPaymentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  razorpaySignature?: string;
}
