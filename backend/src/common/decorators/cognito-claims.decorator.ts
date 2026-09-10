import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CognitoClaims as Claims } from '../../auth/cognito/cognito.service';

/**
 * Exposes the verified Cognito ID-token claims that JwtAuthGuard attached to
 * `req.cognito`. Used by onboarding to seed a Mongo profile for a brand-new
 * sign-up (whose `req.user` is only a `{ isNewUser: true }` principal).
 */
export const CognitoClaims = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Claims => {
    const req = ctx.switchToHttp().getRequest();
    return req.cognito;
  },
);
