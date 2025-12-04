import TagsMultiSelectDropdown from '@components/TagsMultiSelectDropdown';

import { Dispatch, RefObject, SetStateAction, useEffect } from 'react';
import { SelectorModal } from './SelectorModal';
import { DropdownSkeleton } from '@carbon/react';

import styles from './IssueForm.module.scss';
import { useFeedbackContext } from '@modules/FeedbacksContext';
import { Feedback } from '@utils/getFunctions/getDashboardFeedbacks';
import { TextInput } from '@carbon/react';
import ListForm from '@components/ListForm';
import { Issue } from '@utils/getFunctions/getDashboardIssues';

interface Props {
  issue: Issue | null | undefined;
  connectedFeedbacks: Feedback[];
  setConnectedFeedbacks: Dispatch<SetStateAction<Feedback[]>>;
  ghMappingInputRef: RefObject<HTMLInputElement>;
  feedbackChannels: string[];
  setFeedbackChannels: Dispatch<SetStateAction<string[]>>;
}

const FeedbackSelector = ({
  issue,
  connectedFeedbacks,
  setConnectedFeedbacks,
  ghMappingInputRef,
  feedbackChannels,
  setFeedbackChannels,
}: Props) => {
  const { feedbacks } = useFeedbackContext();

  useEffect(() => {
    if (issue?.id && feedbacks)
      setConnectedFeedbacks(
        issue?.feedbackIds ? issue.feedbackIds.map((id) => feedbacks?.find((f) => f.id === id)).filter((f) => !!f) : [],
      );
  }, [issue, feedbacks]);

  return (
    <section>
      <h5>Connected Feedback</h5>
      {feedbacks ? (
        <div className={styles.selectorWrapper}>
          <TagsMultiSelectDropdown
            items={feedbacks}
            titleText="Feedback"
            selectedItems={connectedFeedbacks}
            setSelectedItems={setConnectedFeedbacks}
            displayShortID
            type="feedback"
          />
          <SelectorModal
            items={feedbacks}
            setSelectedItems={setConnectedFeedbacks}
            selectedItems={connectedFeedbacks}
            type="feedback"
          />
        </div>
      ) : (
        <DropdownSkeleton />
      )}
      <TextInput
        ref={ghMappingInputRef}
        id="gh-mapping"
        labelText="GitHub mapping"
        helperText="Add GitHub issue url if the same issue has GitHub issue"
      />
      <ListForm
        values={feedbackChannels}
        setValues={setFeedbackChannels}
        id="other-feedback-channels"
        label="Feedback from other sources"
        placeholder="https://xxxxxx.slack.com/archives"
      />
    </section>
  );
};

export default FeedbackSelector;
