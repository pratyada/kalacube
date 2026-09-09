import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

/**
 * Verifies AWS Cognito JWTs against the user pool's JWKS.
 *
 * We verify the **ID token** (not the access token) because the artist↔profile
 * join key is the user's email, and email lives in the ID token's claims.
 * The frontend therefore sends the Cognito ID token as the Bearer credential.
 */
export interface CognitoClaims {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  'cognito:username'?: string;
  identities?: unknown;
}

@Injectable()
export class CognitoService implements OnModuleInit {
  private readonly logger = new Logger(CognitoService.name);
  private verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const userPoolId = this.config.get<string>('COGNITO_USER_POOL_ID');
    const clientId = this.config.get<string>('COGNITO_APP_CLIENT_ID');

    if (!userPoolId || !clientId) {
      this.logger.warn(
        'COGNITO_USER_POOL_ID / COGNITO_APP_CLIENT_ID not set — Cognito auth is DISABLED until configured.',
      );
      return;
    }

    // Verifier caches the JWKS internally after first fetch.
    this.verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    });
    this.logger.log(`Cognito verifier ready for pool ${userPoolId}`);
  }

  get isConfigured(): boolean {
    return this.verifier !== null;
  }

  async verify(token: string): Promise<CognitoClaims> {
    if (!this.verifier) {
      throw new UnauthorizedException('Cognito auth is not configured');
    }
    try {
      return (await this.verifier.verify(token)) as unknown as CognitoClaims;
    } catch (err) {
      this.logger.debug(`Token verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
