import { Tag } from '@carbon/react';
import { PropsWithChildren } from 'react';

// children: 'Ready for review' | 'Approved' | 'Resolved' | 'Inactive';

const StatusTag = ({ children }: PropsWithChildren) => {
  const color = (() => {
    switch (children) {
      case 'Ready for review':
        return 'cyan';
      case 'Approved':
        return 'green';
      case 'Resolved':
        return 'high-contrast';
      case 'Inactive':
        return 'gray';
      default:
        return 'cool-gray';
    }
  })();
  return <Tag type={color}>{children}</Tag>;
};

export default StatusTag;
