import { authOptions } from '@auth';
import { getServerSession } from 'next-auth';

export async function fetchWithEmailHeader(input: RequestInfo, init?: RequestInit) {
  const session = await getServerSession(authOptions);

  const headers = new Headers(init?.headers);

  if (session?.user?.email) {
    headers.set('x-user-email', session.user.email);
  }

  return fetch(input, { ...init, headers });
}
