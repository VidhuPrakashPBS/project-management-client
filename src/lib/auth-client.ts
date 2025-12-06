import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import type { auth } from '../../../server/src/lib/auth';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  cookiePrefix: 'pbspm',
  plugins: [adminClient(), inferAdditionalFields<typeof auth>()],
});
