'use client';

import { InlineNotification } from '@carbon/react';
import DetailsModalRenderer from '@components/DetailsModalRenderer';
import { FieldRenderType } from '@components/DetailsModalRenderer/utils';
import ValidationScore from '@components/ValidationScore';
import { useIsAdmin } from '@hooks/permissionHooks';
import buildJudgePrompt from '@utils/buildJudgePrompt';
import { JudgeResult, type Result } from '@utils/getFunctions/getDashboardResult';
import { parseBinaryJudgeScore } from '@utils/parseJudgeScore';
import { MutableRefObject, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Annotation } from './Annotation';
import styles from './ResultTestDetailsModal.module.scss';

export type Props = {
  test: Omit<Result, 'taskName' | 'isSeed' | 'testDescription'> | null;
  open: boolean;
  modelId: string;
  judgeModelId: string;
  runId: string;
  close: () => void;
  gridDataRefreshRef?: MutableRefObject<((testId?: string, result?: JudgeResult, runId?: string) => void) | null>;
};

const ResultTestDetailsModal = ({ test, open, modelId, judgeModelId, close, runId, gridDataRefreshRef }: Props) => {
  const isAdmin = useIsAdmin();
  const [result, setResult] = useState(test);

  useEffect(() => {
    setResult(test);
  }, [test]);

  function updateJudgeResults(annotation: JudgeResult) {
    setResult((prev) => {
      if (!prev) return null;

      const newValue = { ...prev };

      if (!newValue.judgeResults) {
        newValue['judgeResults'] = [annotation];
      } else {
        newValue.judgeResults.push(annotation);
      }

      return newValue;
    });
    if (gridDataRefreshRef?.current) gridDataRefreshRef.current(test?.testId, annotation, runId);
  }

  const judgeResults = useMemo(() => {
    if (!result) return [];

    const annotation = result?.judgeResults
      ? result.judgeResults.findLast((judgeResult) => judgeResult.type && judgeResult.type === 'human')
      : undefined;

    if (annotation)
      return [
        [
          {
            label: `Score: ${annotation.modelId}`,
            content: <ValidationScore score={annotation.testScore} />,
          },
          {
            label: 'Justification',
            content: annotation.testJustification,
            span: 3,
          },
        ],
      ];

    return result.judgeResults.map((r, _i, arr) => [
      {
        label: `Score${arr.length > 1 ? `: ${r.modelId}` : ''}`,
        content: <ValidationScore score={r.testScore} />,
      },
      {
        label: 'Justification',
        content: r.testJustification,
        span: 3,
      },
    ]);
  }, [result]);

  const [isClientReady, setClientReady] = useState<boolean>(false);
  const generateModalData = () => {
    return test
      ? [
          {
            content: (
              <InlineNotification
                kind="info"
                hideCloseButton
                subtitle="This is a snapshot of the test used for this test run. The information here might not reflect the latest test data."
                lowContrast
                className={styles.notification}
              />
            ),
          },
          {
            label: 'ID',
            content: test.testId,
            renderType: FieldRenderType.IDTAG,
            displayedInHeader: true,
            renderProps: ['copiable'],
          },
          [
            {
              label: 'Model',
              content: modelId,
            },
            {
              label: 'Judge model(s)',
              content: judgeModelId,
            },
          ],
          {
            renderType: FieldRenderType.DIVIDER,
          },
          {
            content: (
              <Annotation
                testId={test.testId}
                runId={runId}
                currentScore={parseBinaryJudgeScore(test as Result) as 1 | 0}
                updateJudgeResults={updateJudgeResults}
              />
            ),
          },
          ...judgeResults,
          {
            renderType: FieldRenderType.DIVIDER,
          },
          ...[
            test.messages
              ? {
                  label: 'Messages',
                  content: test.messages,
                  renderProps: ['expandable', 'previewMarkdown'],
                  isPromptElement: true,
                }
              : {
                  label: 'Raw prompt',
                  content: test.promptText,
                  renderProps: ['expandable', 'previewMarkdown'],
                  isPromptElement: true,
                },
          ],
          [
            {
              label: 'Model response',
              content: test.modelResponse,
              renderProps: ['expandable', 'previewMarkdown'],
            },
            {
              label: 'Desired output',
              content: test.groundTruth,
              renderProps: ['expandable', 'previewMarkdown'],
            },
          ],
          {
            renderType: FieldRenderType.DIVIDER,
          },
          {
            label: 'Judge guideline',
            content: test.judgeGuidelines,
            renderProps: ['expandable', 'previewMarkdown'],
          },
          {
            label: 'Judge prompt',
            content: buildJudgePrompt(
              test.judgePrompt,
              test.promptText,
              test.modelResponse,
              test.groundTruth,
              test.judgeGuidelines,
            ),
            renderProps: ['expandable', 'previewMarkdown'],
          },
        ]
      : undefined;
  };

  const data = generateModalData();

  useEffect(() => {
    setClientReady(true);
  }, []);

  if (!isClientReady) return null;
  return createPortal(
    <DetailsModalRenderer
      size="lg"
      open={open}
      modalHeading="Test result detail"
      onClose={close}
      primaryLink={isAdmin && test?.testId ? `/test?id=${test.testId}` : undefined}
      primaryButtonText={isAdmin ? 'Edit test' : undefined}
      data={data}
    >
      {test || !open ? undefined : (
        <InlineNotification lowContrast title="Cannot retrieve the test data" kind="error" />
      )}
    </DetailsModalRenderer>,
    document.body,
  );
};

export default ResultTestDetailsModal;
