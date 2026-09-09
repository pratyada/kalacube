import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Auth is handled by AWS Cognito (Hosted UI: email/password + Google one-tap).
 * Signup / login / password-reset / token-refresh all happen client-side against
 * Cognito — there are no own-JWT endpoints here anymore. The backend only
 * validates the Cognito ID token (see JwtAuthGuard) and exposes the current user.
 *
 * Legacy own-JWT flows (register/login/refresh/forgot/reset/verify + passport
 * Google) were removed; AuthService retains the helpers only for reference and
 * should be pruned in a follow-up.
 */
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getMe(@CurrentUser('_id') userId: string) {
    return this.authService.getMe(userId);
  }
}
