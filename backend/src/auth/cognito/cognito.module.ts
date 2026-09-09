import { Global, Module } from '@nestjs/common';
import { CognitoService } from './cognito.service';

/**
 * Global so the auth guard (registered in AppModule via APP_GUARD) can inject
 * CognitoService without importing this module everywhere.
 */
@Global()
@Module({
  providers: [CognitoService],
  exports: [CognitoService],
})
export class CognitoModule {}
