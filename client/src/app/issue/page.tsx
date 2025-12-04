'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { getDashboardIssue, type Issue } from '@utils/getFunctions/getDashboardIssues';
import type { APICallError } from '@types';
import { useToastMessageContext } from '@components/ToastMessageContext';
import IssueForm from '@issue/modules/IssueForm';
import { FeedbackContextProvider } from '@modules/FeedbacksContext';
import { TestContextProvider } from '@modules/TestContext';
import { getEmptyIssue } from './utils';
import { Loading } from '@carbon/react';

export default function CreateEditIssuePage() {
  const searchParams = useSearchParams();

  const { addToastMsg } = useToastMessageContext();

  const [issueCopy, setIssueCopy] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  const id = searchParams.get('id');

  const initiateIssueCopy = useCallback(async () => {
    setLoading(true);
    if (id) {
      getDashboardIssue(id)
        .then((i) => setIssueCopy({ ...i }))
        .catch((err: APICallError) => addToastMsg(err.status, err.message, `Failed to find issue with id "${id}"`))
        .finally(() => setLoading(false));
    } else {
      setIssueCopy(getEmptyIssue());
      setTimeout(() => setLoading(false), 200);
    }
  }, [id]);

  useEffect(() => {
    initiateIssueCopy();
  }, [initiateIssueCopy]);

  return (
    <FeedbackContextProvider>
      <TestContextProvider>
        {loading ? (
          <Loading />
        ) : (
          <IssueForm issueCopy={issueCopy} loading={loading} initiateIssueCopy={initiateIssueCopy} />
        )}
      </TestContextProvider>
    </FeedbackContextProvider>
  );
}
