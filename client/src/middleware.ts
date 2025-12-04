import { Permission } from '@utils/permission';
import { NextResponse } from 'next/server';
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware';

const maintainerRoutes = [/^\/test-manager(\/.*)?$/, /^\/issue$/];

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    //if not signed in, redirect
    if (!req.nextauth.token) NextResponse.redirect(new URL('/auth/signin', req.url));

    const { permissions } = req.nextauth.token!;

    const isMaintainerRoute = maintainerRoutes.find((pattern) => pattern.test(req.nextUrl.pathname)) !== undefined;

    if (isMaintainerRoute && !permissions.includes(Permission.MAINTAINER))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: '/auth/signin',
    },
    callbacks: {
      authorized: async ({ token }) => {
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ['/test', '/', '/api(.*)', '/test-manager(.*)', '/issue', '/my-qa-tests'], // Paths to protect
};
