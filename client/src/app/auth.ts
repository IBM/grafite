import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { Permission } from './utils/permission';
import { AUTH_PROVIDER } from '@utils/constants';

const MOCK_EMAIL = 'admin@email.com';
const MOCK_NAME = 'Admin';
const MOCK_PERMISSIONS = [Permission.ADMIN, Permission.MAINTAINER];

const authOptions: AuthOptions = {
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    CredentialsProvider({
      id: AUTH_PROVIDER,
      name: 'Mock',
      credentials: {},
      async authorize(_credentials) {
        return {
          id: MOCK_EMAIL,
          name: MOCK_NAME,
          email: MOCK_EMAIL,
          permissions: MOCK_PERMISSIONS,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    // How long (in seconds) until an idle session expires and is no longer valid.
    maxAge: parseInt(process.env.NEXT_PUBLIC_SESSION_MAXAGE ?? '7200', 10),
  },
  callbacks: {
    signIn: async () => true,
    async redirect({ baseUrl }) {
      return baseUrl;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.email = token.sub;
        session.user.permissions = token.permissions as Permission[];
      }

      return {
        ...session,
      };
    },
    jwt: async ({ token, user }) => {
      if (user) token.user = user;

      if (token.sub) {
        token.permissions = MOCK_PERMISSIONS;
      }

      return token;
    },
  },
};

export { authOptions };
