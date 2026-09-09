import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CognitoService } from '../../auth/cognito/cognito.service';
import { UserRepository } from '../../user/user.repository';

/**
 * Global auth guard backed by AWS Cognito.
 *
 * Flow: verify the Cognito ID token → resolve the existing Mongo user by email
 * → attach it as `request.user` so all existing controllers (`@CurrentUser`,
 * `@CurrentUser('_id')`, RolesGuard) keep working unchanged.
 *
 * Brand-new Google sign-ups (no Mongo record yet) get a lightweight principal
 * with `isNewUser: true`; they are routed through onboarding to create a full
 * user document (which needs required fields not present in the token).
 *
 * NOTE: class name kept as `JwtAuthGuard` so AppModule's APP_GUARD wiring is
 * unchanged. It no longer uses passport/JWT-secret; it validates Cognito tokens.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cognito: CognitoService,
    private readonly userRepo: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(req);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    const claims = await this.cognito.verify(token);
    const email = (claims.email || '').toLowerCase();
    if (!email) throw new UnauthorizedException('Token has no email claim');

    const user = await this.userRepo.findUserByEmail(email);

    // Expose raw Cognito claims for downstream use (e.g. onboarding).
    (req as any).cognito = claims;

    if (user) {
      (req as any).user = user;
    } else {
      // No profile yet — new signup. Onboarding creates the full record.
      (req as any).user = {
        email,
        cognitoSub: claims.sub,
        isNewUser: true,
      };
    }
    return true;
  }

  private extractBearer(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && value ? value : null;
  }
}
