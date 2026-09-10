import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CognitoClaims } from '../common/decorators/cognito-claims.decorator';
import type { CognitoClaims as Claims } from './cognito/cognito.service';
import { OnboardingDto } from './dto/onboarding.dto';

/**
 * Auth is handled by AWS Cognito (Hosted UI: email/password + Google one-tap).
 * Signup / login / password-reset / token-refresh all happen client-side against
 * Cognito — there are no own-JWT endpoints here anymore. The backend only
 * validates the Cognito ID token (see JwtAuthGuard) and exposes the current user.
 */
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getMe(@CurrentUser() principal: any) {
    // A verified Cognito user with no Mongo record yet — the frontend routes
    // this to onboarding instead of treating it as "logged out".
    if (!principal || principal.isNewUser) {
      return {
        data: { isNewUser: true, email: principal?.email ?? null },
        message: 'Onboarding required',
      };
    }
    return this.authService.getMe(principal._id.toString());
  }

  @Post('onboarding')
  async onboarding(
    @CognitoClaims() claims: Claims,
    @Body() dto: OnboardingDto,
  ) {
    return this.authService.onboard(claims, dto);
  }
}
