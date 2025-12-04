import { Tag } from '@carbon/react';

const TestStatusTag = ({ status, isApproved }: { status: string; isApproved: boolean }) => {
  return (
    <Tag type={isApproved ? 'green' : status === 'Draft' ? 'warm-gray' : 'cyan'} size="sm">
      {isApproved ? 'Approved' : status}
    </Tag>
  );
  return;
};

export default TestStatusTag;
