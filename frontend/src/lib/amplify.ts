import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Amplify Auth is configured from NEXT_PUBLIC_COGNITO_* env vars.
 * Until the AWS session provides the Hosted UI domain + app client id
 * (see AWS_SETUP_CHECKLIST.md), auth stays inert — the app still builds/runs.
 *
 * We send the Cognito **ID token** to the API (it carries the email claim used
 * to resolve the artist's profile — see the backend JwtAuthGuard).
 */
let configured = false;

export function configureAmplify() {
  if (configured) return;

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID;
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN; // host only, no https://

  if (!userPoolId || !userPoolClientId) return; // not wired yet

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          loginWith: domain
            ? {
                oauth: {
                  domain,
                  scopes: ['openid', 'email', 'profile'],
                  redirectSignIn: [`${origin}/auth/oauth/callback`],
                  redirectSignOut: [`${origin}/`],
                  responseType: 'code',
                },
              }
            : undefined,
        },
      },
    },
    { ssr: true },
  );
  configured = true;
}

/** Current Cognito ID token, or null if not signed in / not configured. */
export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

// Configure on module load (client + SSR-safe; idempotent).
configureAmplify();
