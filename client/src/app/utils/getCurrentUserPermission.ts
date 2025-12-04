import { authOptions } from '@auth';
import { getServerSession } from 'next-auth';

import { Permission } from './permission';

export const getCurrentUserPermission = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) return [Permission.VIEWER];

  return session.user.permissions;
};
