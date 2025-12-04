import { SourceType, TriageStatus } from '@api/dashboard/issues/utils';
import { Button, Form, Loading, TextArea, TextInput } from '@carbon/react';
import TagSelector from '@components/TagSelector';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { useIsAdmin } from '@hooks/permissionHooks';
import { getEmptyIssue } from '@issue/utils';
import { useFeedbackContext } from '@modules/FeedbacksContext';
import { useIssuesContext } from '@modules/IssuesContext';
import { useTestContext } from '@modules/TestContext';
import { type Feedback } from '@utils/getFunctions/getDashboardFeedbacks';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';
import { getDashboardLabelSettings } from '@utils/getFunctions/getDashboardLabelSettings';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import { patchDashboardIssue } from '@utils/patchFunctions/patchDashboardIssue';
import { patchDashboardTest } from '@utils/patchFunctions/patchDashboardTest';
import { postDashboardIssue } from '@utils/postFunctions/postDashboardIssue';
import { postDashboardLabelSetting } from '@utils/postFunctions/postDashboardLabelSetting';
import { putDashboardIssue } from '@utils/putFunctions/putDashboardIssue';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

import FeedbackSelector from './FeedbackSelector';
import FormHeader from './FormHeader';
import styles from './IssueForm.module.scss';
import QATestSelector from './QATestSelector';
import { getIssueStatus, mapClientToServerSchema, setIssueStatus } from './utils';

type IssueFormProps = {
  issueCopy?: Issue | null;
  loading: boolean;
  initiateIssueCopy: () => void;
};

export const IssueForm = ({ issueCopy, loading, initiateIssueCopy }: IssueFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prev = searchParams.get('prev');

  const { issues, fetchIssues, loading: loadingIssues } = useIssuesContext();
  const { feedbacks } = useFeedbackContext();
  const { loading: loadingTests } = useTestContext();

  const { addToastMsg } = useToastMessageContext();

  const isAdmin = useIsAdmin();

  const { data: sessionData } = useSession();

  const [status, setStatus] = useState<TriageStatus>(getIssueStatus(issueCopy));
  const [tags, setTags] = useState<string[]>([]);
  const [feedbackChannels, setFeedbackChannels] = useState<string[]>([]);
  const [connectedFeedbacks, setConnectedFeedbacks] = useState<Feedback[]>([]);
  const [openedTests, setOpenedTests] = useState<Test[]>([]);
  const [resolution, setResolution] = useState<string[]>([]);
  const [actionableToast, setActionableToast] = useState<boolean>(false);
  const [loadingSave, setLoadingSave] = useState<boolean>(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const resolutionNoteInputRef = useRef<HTMLTextAreaElement | null>(null);
  const ghMappingInputRef = useRef<HTMLInputElement | null>(null);

  const updateStatus = (status: TriageStatus) => {
    if (issueCopy && issueCopy.id) {
      patchDashboardIssue(issueCopy.id, {
        key: 'triage.ready_for_review',
        value: status === TriageStatus.READY_FOR_REVIEW,
      })
        .then(() => {
          addToastMsg(200, 'Successfully saved the changes', 'Saved the changes');
        })
        .catch((err) => addToastMsg(err.status, err.message, 'Failed to mark as ready'))
        .finally(() => {
          setStatus(status);
          if (status === TriageStatus.READY_FOR_REVIEW) setActionableToast(false);
        });
    }
  };

  const closeToast = () => {
    setActionableToast(false);
  };

  const saveIssue = () => {
    setLoadingSave(true);

    if (!titleInputRef.current?.value) {
      addToastMsg(400, 'Title is required', 'Failed to save');
      setLoadingSave(false);
      return;
    }

    const sources = (() => {
      const sourceList = [];
      if (ghMappingInputRef.current?.value) {
        const value = ghMappingInputRef.current?.value?.trim();
        sourceList.push({ type: SourceType.GITHUB, value });
      }
      if (feedbackChannels) {
        for (const val of feedbackChannels) {
          sourceList.push({ type: SourceType.GENERAL, value: val.trim() });
        }
      }
      return sourceList;
    })();

    const author = sessionData?.user?.email;
    const updates = {
      sources,
      tags,
      authors: [...(issueCopy?.authors ?? []), author].filter(
        (a, idx, arr) => !!a && Number(arr.indexOf(a)) === Number(idx),
      ) as string[],
      feedbackIds: connectedFeedbacks.map((f) => f.id).filter((id) => id !== undefined),
      testIds: openedTests.map((t) => t.id).filter((id) => id !== undefined),
      title: titleInputRef.current.value,
      description: descriptionInputRef.current?.value,
    };

    if (issueCopy?.id) {
      const updated = { ...setIssueStatus(issueCopy, status), ...updates, resolution };

      const formattedIssue = mapClientToServerSchema({
        ...setIssueStatus(issueCopy, status),
        ...updates,
        resolution,
        note: resolutionNoteInputRef.current?.value || updated.note,
      });

      putDashboardIssue(issueCopy.id || '', formattedIssue)
        .then(() => {
          //update tests too
          const targetIssue = issues?.find((issue) => issue.id === issueCopy.id);
          const newTests = updates.testIds.filter((id) => !targetIssue?.testIds.includes(id));
          const removedTests = targetIssue?.testIds.filter((id) => !updates.testIds.includes(id));

          const testUpdatePromises = [];
          if (newTests?.length) {
            for (const id of newTests) {
              testUpdatePromises.push(() => patchDashboardTest(id, { key: 'issue_id', value: issueCopy.id }));
            }
          }
          if (removedTests?.length) {
            for (const id of removedTests) {
              testUpdatePromises.push(() => patchDashboardTest(id, { key: 'issue_id', value: '' }));
            }
          }
          return Promise.all(testUpdatePromises.map((p) => p()));
        })
        .then(() => {
          if (status === TriageStatus.DRAFT) {
            setActionableToast(true);
            return;
          }
          addToastMsg(200, 'Successfully saved the changes', 'Saved the changes');
          fetchIssues();
        })
        .catch((err) => addToastMsg(err.status, err.message, 'Failed to save'))
        .finally(() => setLoadingSave(false));
    } else {
      const newIssue = mapClientToServerSchema({
        ...getEmptyIssue(),
        ...updates,
        resolution,
        note: resolutionNoteInputRef.current?.value ?? null,
        authors: [sessionData?.user?.email].filter((a) => a !== undefined && a !== null),
      });

      postDashboardIssue(newIssue)
        .then((id) => {
          setActionableToast(true);

          router.replace(`/issue?id=${id}${prev ? '&prev=true' : ''}`, { scroll: false });

          return id;
        })
        .then((id) => {
          const testUpdatePromises = [];
          for (const testId of newIssue.test_ids) {
            testUpdatePromises.push(() => patchDashboardTest(testId, { key: 'issue_id', value: id }));
          }
          return Promise.all(testUpdatePromises.map((p) => p()));
        })
        .then(() => {
          fetchIssues();
        })
        .catch((err) => addToastMsg(err.status, err.message, 'Failed to save'))
        .finally(() => setLoadingSave(false));
    }
  };

  useEffect(() => {
    if (issueCopy?.id) {
      setStatus(getIssueStatus(issueCopy));

      setTags([...(issueCopy?.tags || [])]);

      setFeedbackChannels(
        issueCopy?.sources ? issueCopy.sources.filter((src) => src.type !== 'github').map((src) => src.value) : [],
      );

      setResolution(issueCopy?.resolution ? issueCopy.resolution : []);

      if (titleInputRef.current) {
        titleInputRef.current.value = issueCopy?.title || '';
      }

      if (descriptionInputRef.current) {
        descriptionInputRef.current.value = issueCopy?.description || '';
      }

      if (resolutionNoteInputRef.current) {
        resolutionNoteInputRef.current.value = issueCopy?.note || '';
      }

      if (ghMappingInputRef.current) {
        ghMappingInputRef.current.value = issueCopy?.sources?.find((src) => src.type === 'github')?.value || '';
      }
    }
  }, [issueCopy]);

  if (!isAdmin) return <AccessFailed errorType="permission" />;
  if (!loading && issueCopy === null) return <AccessFailed errorType="issue" />;

  return (
    <section>
      {loading && <Loading />}
      <FormHeader
        save={saveIssue}
        updateStatus={updateStatus}
        closeToast={closeToast}
        initiateIssueCopy={initiateIssueCopy}
        issue={issueCopy ?? null}
        loading={loadingSave}
        status={status}
        toastOpen={actionableToast}
        disableSave={loading || !feedbacks || loadingIssues || loadingTests}
      />
      <Form className={styles.form}>
        <section>
          <h5>Metadata</h5>
          <TextInput ref={titleInputRef} className={styles.title} id="title" labelText="Title" autoFocus />
          <TextArea id="description" labelText="Description" ref={descriptionInputRef} />
          <TagSelector
            addNewTag={(newValue) => postDashboardLabelSetting({ label: newValue, type: 'issue', setting: 'tag' })}
            appendable={isAdmin}
            selectTag={(tag) => setTags((prev) => [...prev, tag])}
            deselectTag={(tag) => setTags((prev) => prev.filter((t) => t !== tag))}
            tags={tags}
            direction="horizontal"
            label="Tags"
            getTags={() => getDashboardLabelSettings({ type: 'issue', setting: 'tag' })}
          />
          <TagSelector
            addNewTag={(newValue) =>
              postDashboardLabelSetting({ label: newValue, type: 'issue', setting: 'resolution' })
            }
            appendable={isAdmin}
            selectTag={(tag) => setResolution((prev) => [...prev, tag])}
            deselectTag={(tag) => setResolution((prev) => prev.filter((t) => t !== tag))}
            tags={resolution}
            direction="horizontal"
            label="Resolution"
            getTags={() => getDashboardLabelSettings({ type: 'issue', setting: 'resolution' })}
          />
          <TextArea id="resolution-note" labelText="Resolution note" ref={resolutionNoteInputRef} />
        </section>

        <FeedbackSelector
          issue={issueCopy}
          connectedFeedbacks={connectedFeedbacks}
          setConnectedFeedbacks={setConnectedFeedbacks}
          ghMappingInputRef={ghMappingInputRef}
          feedbackChannels={feedbackChannels}
          setFeedbackChannels={setFeedbackChannels}
        />

        <QATestSelector openedTests={openedTests} setOpenedTests={setOpenedTests} issue={issueCopy} />
      </Form>
    </section>
  );
};

const AccessFailed = ({ errorType }: { errorType: 'issue' | 'permission' }) => {
  const router = useRouter();
  const title = errorType === 'issue' ? 'Issue not found' : 'Access denied';
  const body =
    errorType === 'issue'
      ? 'Something went wrong while searching for issue'
      : "You don't have permission to edit issues";

  return (
    <div className={styles.issueNotFound}>
      <div className={styles.icon}>!</div>
      <div className={styles.title}>{title}</div>
      <div className={styles.body}>{body}</div>
      <Button
        size="md"
        onClick={() => {
          router.back();
        }}
      >
        Go back
      </Button>
    </div>
  );
};
