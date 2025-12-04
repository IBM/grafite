import { Permission } from '@utils/permission';
import { useSession } from 'next-auth/react';

export const useUserPermission = () => {
  const { data } = useSession();

  if (!data?.user) return [Permission.VIEWER];

  return data.user.permissions;
};

export const useIsMaintainer = () => {
  const userPermissions = useUserPermission();

  return userPermissions.includes(Permission.MAINTAINER);
};

export const useIsAdmin = () => {
  const userPermission = useUserPermission();

  return userPermission.includes(Permission.ADMIN);
};
