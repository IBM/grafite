import { Permission } from '@utils/permission';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from 'next-auth';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    access_token?: string;
    access_token_expiry?: number;
    refresh_token?: string;
    error?: string;
    permissions: Permission[];
  }
  interface Session {
    user?: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string;
    access_token_expiry?: number;
    refresh_token?: string;
    error?: string;
    permissions: Permission[];
  }
}
