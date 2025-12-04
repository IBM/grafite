import { InlineLoading } from '@carbon/react';
import Comment from '@components/Comment';
import LabelledItem from '@components/LabelledItem';
import ShortIdTag from '@components/ShortIdTag';
import TagSelector from '@components/TagSelector';
import { useIsAdmin } from '@hooks/permissionHooks';
import { getDashboardLabelSettings } from '@utils/getFunctions/getDashboardLabelSettings';
import { postDashboardLabelSetting } from '@utils/postFunctions/postDashboardLabelSetting';
import { Fragment } from 'react';

import { useTestDataContext } from '../TestDataContext';
import styles from './TestRightSidebar.module.scss';

const TestRightSidebar = ({
  renderTrigger,
  setRenderTrigger,
}: {
  step: number;
  changeStep: (step: number) => void;
  renderTrigger: boolean;
  setRenderTrigger: (status: boolean) => void;
}) => {
  const { testInfo, updateTest, removeTestValue, isLoading } = useTestDataContext();

  const isAdmin = useIsAdmin();

  const manageFlag = (flag: string, isSelect?: boolean) => {
    setRenderTrigger(true);
    if (isSelect) updateTest('flags', flag, true);
    else removeTestValue('flags', flag);
    setTimeout(() => setRenderTrigger(false), 0);
  };

  return (
    <section className={styles.rightSidebar}>
      <h3>Current test</h3>

      <LabelledItem id="right-sidebar-test-id" label="Test ID">
        <div aria-labelledby="right-sidebar-test-id">
          {renderTrigger || isLoading || !testInfo.id ? (
            <span className={styles.empty}>Not yet saved</span>
          ) : (
            <ShortIdTag id={testInfo.id?.toString()} copiable color="gray" />
          )}
        </div>
      </LabelledItem>
      <TagSelector
        deselectTag={(flag: string) => {
          manageFlag(flag, false);
        }}
        selectTag={(flag: string) => {
          manageFlag(flag, true);
        }}
        getTags={() => getDashboardLabelSettings({ type: 'test', setting: 'tag' })}
        tags={testInfo.flags ?? []}
        appendable={isAdmin}
        addNewTag={(newValue) => postDashboardLabelSetting({ label: newValue, type: 'test', setting: 'tag' })}
      />
      <LabelledItem id="right-sidebar-test-comments" label="Comments">
        <div aria-labelledby="right-sidebar-comment" className={styles.list}>
          {isLoading || !testInfo ? (
            <InlineLoading description="Loading comments..." />
          ) : (
            <>
              {!testInfo.comments?.length ? (
                <span className={styles.empty}>No comment added</span>
              ) : (
                <>
                  {testInfo.comments.map((comment) => (
                    <Fragment key={`comment_${comment.author}_${comment.created_time}`}>
                      <Comment comment={comment} />
                    </Fragment>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </LabelledItem>
    </section>
  );
};

export default TestRightSidebar;
