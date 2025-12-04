'use client';

import { Button, FluidDropdown, FluidTextArea, InlineLoading, Theme } from '@carbon/react';
import { Edit } from '@carbon/react/icons';
import { useThemePreference } from '@components/ThemePreference';
import ValidationScore from '@components/ValidationScore';
import { APICallError } from '@types';
import { JudgeResult } from '@utils/getFunctions/getDashboardResult';
import { postResultAnnotation } from '@utils/postFunctions/postResultAnnotation';
import { useSession } from 'next-auth/react';
import { useRef, useState } from 'react';

import styles from './Annotation.module.scss';

type AnnotationProps = {
  testId: string;
  runId: string;
  currentScore: 0 | 1;
  updateJudgeResults: (annotation: JudgeResult) => void;
};

export const Annotation = ({ runId, testId, currentScore, updateJudgeResults }: AnnotationProps) => {
  const [expanded, setExpanded] = useState(false);
  const [score, setScore] = useState({ score: currentScore === 0 ? 1 : 0 });
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);
  const justificationRef = useRef<string>('');

  const session = useSession();

  const { theme } = useThemePreference();
  const temporaryFieldTheme = theme === 'g100' ? 'g90' : 'g10';

  const onSave = async () => {
    const justification = justificationRef.current;
    if (!justification) {
      setError('Justification cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await postResultAnnotation(runId, {
        test_id: testId,
        score: score.score,
        annotation: justification,
      });

      updateJudgeResults({
        modelId: session.data?.user?.email || 'unknown',
        testJustification: justification,
        testScore: score.score,
        type: 'human',
      });
      setExpanded(false);
    } catch (err) {
      if (err instanceof APICallError) {
        setError('Failed to save the human evaluation. Please try again or refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.annotationWrapper}>
      <div className={styles.actionsRow}>
        <label>Judge results</label>
        {expanded ? (
          <div className={styles.buttons}>
            <Button size="sm" onClick={() => setExpanded(false)} kind="secondary" disabled={loading}>
              Discard
            </Button>
            {loading ? (
              <InlineLoading className={styles.loading} description="Saving..." />
            ) : (
              <Button size="sm" onClick={onSave}>
                Save
              </Button>
            )}
          </div>
        ) : (
          <Button size="sm" kind="ghost" renderIcon={Edit} onClick={() => setExpanded(true)}>
            Update result
          </Button>
        )}
      </div>
      {expanded && (
        <div className={styles.form}>
          <div>
            <Theme theme={temporaryFieldTheme}>
              <FluidDropdown
                id="annotation-score"
                items={[{ score: 0 }, { score: 1 }]}
                //@ts-expect-error rendering component
                itemToString={(i) => <ValidationScore size="sm" score={(i as { score: number }).score} />}
                label="Score"
                titleText="Score"
                onChange={({ selectedItem }) => setScore(selectedItem as { score: number })}
                selectedItem={score}
              />
            </Theme>
          </div>
          <Theme theme={temporaryFieldTheme}>
            <FluidTextArea
              //@ts-expect-error Carbon prop type definition error
              onBlur={(e) => {
                justificationRef.current = e.target.value;
              }}
              onClick={() => {
                setError(null);
              }}
              invalid={!!error}
              invalidText={error}
              labelText="Justification"
              placeholder={`* Updating result(adding human evaluaiton) overwrites any existing human evaluaiton\nWhy did the test passed / failed?`}
              rows={1}
            />
          </Theme>
        </div>
      )}
    </div>
  );
};
