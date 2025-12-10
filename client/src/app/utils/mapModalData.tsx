import { Link } from '@carbon/react';
import { ThumbsDown, ThumbsUp } from '@carbon/react/icons';
import { DetailsModalRendererData, FieldRenderType } from '@components/DetailsModalRenderer/utils';
import { UserComment } from '@types';

import { Feedback, getDashboardFeedback } from './getFunctions/getDashboardFeedbacks';
import { getDashboardIssue, Issue } from './getFunctions/getDashboardIssues';
import { getDashboardTest, Test } from './getFunctions/getDashboardTests';
import { JudgeTypes, parseJudgeType } from './keyMappings';
import { mapIssueStatus, mapTestStatus } from './mapStatus';
import { patchDashboardIssue } from './patchFunctions/patchDashboardIssue';
import { patchDashboardTest } from './patchFunctions/patchDashboardTest';

export const mapFeedbackModalData = (data: Feedback | null): DetailsModalRendererData[] | undefined => {
  if (!data) return undefined;
  return [
    [
      {
        label: 'ID',
        content: data.id,
        renderType: FieldRenderType.IDTAG,
        renderProps: ['copiable'],
        displayedInHeader: true,
      },
      {
        label: 'Model ID',
        content: `${data.modelId}${data.revision ? ` (${data.revision})` : ''}`,
      },
    ],
    [
      {
        label: 'Tags',
        content: data.tags,
        renderType: FieldRenderType.TAGLIST,
      },
      {
        label: 'Recommended fix',
        content: data.recommendedFix,
      },
    ],
    {
      renderType: FieldRenderType.DIVIDER,
    },
    [
      {
        label: 'Triagers',
        content: data.triage?.emails?.join('\n'),
      },
      {
        label: 'Triager comments',
        content: data.triage?.comments?.map((c) => c.comment).join('\n'),
        renderProps: ['formatMarkdown'],
        span: 2,
      },
    ],
    {
      renderType: FieldRenderType.DIVIDER,
    },
    {
      label: 'Model input',
      content: data.modelInput,
      renderProps: ['copiable', 'expandable'],
    },
    {
      label: 'Model response',
      content: data.modelOutput,
      renderProps: ['copiable', 'expandable'],
    },
    [
      {
        label: 'Mode',
        content: data.mode,
      },
      {
        label: 'Model parameters',
        content: data.modelParameters,
        span: 2,
      },
    ],
    {
      renderType: FieldRenderType.DIVIDER,
    },
    [
      (() => {
        const content = (() => {
          if (!data.userTags) return null;
          try {
            return JSON.parse(data.userTags); //if tags is parse-able list, display tag list
          } catch (error) {
            console.error(error);
          }
          return data.userTags;
        })();

        return {
          label: 'User tags',
          content,
          renderType: content && Array.isArray(content) ? FieldRenderType.TAGLIST : undefined,
        };
      })(),
      {
        label: 'User rating',
        content: (() => {
          switch (data.userRating) {
            case 'THUMBS_DOWN':
              return <ThumbsDown size={18} />;
            case 'THUMBS_UP':
              return <ThumbsUp size={18} />;
            default:
              return data.userRating;
          }
        })(),
      },
    ],
    {
      label: 'User comment',
      content: data.userComment,
    },
    {
      renderType: FieldRenderType.DIVIDER,
    },
    {
      label: 'Comments',
      content: data.comments ?? [],
    },
  ];
};

export const mapTestModalData = (data: Test, addData?: (data?: DetailsModalRendererData[]) => void) => {
  if (!data) return undefined;
  return [
    {
      label: 'ID',
      content: data.id,
      renderType: FieldRenderType.IDTAG,
      displayedInHeader: true,
      renderProps: ['copiable'],
    },
    {
      label: 'Status',
      content: mapTestStatus(data),
      renderType: FieldRenderType.STATUSTAG,
      displayedInHeader: true,
    },
    [
      {
        label: 'Test flags',
        content: data.flags ?? [],
        renderType: FieldRenderType.TAGLIST,
      },
      {
        label: 'Source ID (if applicable)',
        content: data.source_id,
        renderType: FieldRenderType.IDTAG,
        renderProps: ['copiable', 'fullId'],
      },
    ],
    [
      {
        label: 'Connected issue',
        content: data.issueId,
        renderType: FieldRenderType.IDTAG,
        action: (id: string) => {
          if (addData) {
            addData(undefined);
            getDashboardIssue(id).then((res) => {
              const modalData = mapIssueModalData(res, addData) as DetailsModalRendererData[];
              return addData(modalData);
            });
          }
        },
      },
    ],
    {
      renderType: FieldRenderType.DIVIDER,
    },
    [
      {
        label: 'Raw (freeform) prompt',
        content: data.prompt,
        renderProps: ['previewMarkdown', 'expandable'],
        isPromptElement: true,
      },
      {
        label: 'Messages',
        content: data.messages,
        renderProps: ['formatMarkdown', 'expandable'],
        isPromptElement: true,
      },
      ...(data.tools
        ? [
            {
              label: 'Tools',
              content: JSON.stringify(data.tools),
              renderProps: ['formatMarkdown', 'expandable'],
            },
          ]
        : []),
    ],
    [
      {
        label: 'Model response',
        content: data.sampleOutput,
        renderProps: ['previewMarkdown', 'expandable'],
      },
      {
        label: `Desired output ${!!data.desiredOutput && !!data.desiredOutputSource ? `(source: ${data.desiredOutputSource})` : ''}`,
        content: data.desiredOutput,
        renderProps: ['previewMarkdown', 'expandable'],
      },
    ],
    {
      renderType: FieldRenderType.DIVIDER,
    },
    {
      label: 'Judge prompt content',
      content: parseJudgeType(data.validators?.[0]?.parameters.judgeType as JudgeTypes),
    },
    {
      label: 'Judge guidelines',
      content: data.validators?.[0]?.parameters.judgeGuidelines,
    },
    {
      renderType: FieldRenderType.DIVIDER,
    },
    {
      label: 'Author',
      content: data.author,
    },
    {
      label: 'Comments',
      content: data.comments ?? [],
      action: (comment: UserComment) =>
        patchDashboardTest(data.id!, { key: 'comments', value: [...(data.comments ?? []), comment] }),
    },
  ];
};

export const mapIssueModalData = (data: Issue, addData?: (data?: DetailsModalRendererData[]) => void) => {
  if (!data) return undefined;
  return [
    {
      label: 'ID',
      content: data.id,
      renderType: FieldRenderType.IDTAG,
      renderProps: ['copiable'],
      displayedInHeader: true,
    },
    {
      label: 'Status',
      content: mapIssueStatus(data),
      renderType: FieldRenderType.STATUSTAG,
      displayedInHeader: true,
    },
    {
      label: 'title',
      content: data.title,
    },
    {
      label: 'Description',
      content: data.description,
    },

    {
      renderType: FieldRenderType.DIVIDER,
    },
    [
      {
        label: 'Resolution',
        content: data.resolution,
        renderType: FieldRenderType.TAGLIST,
      },
      {
        label: 'Note',
        content: data.note,
      },
    ],
    {
      label: 'Tags',
      content: data.tags,
      renderType: FieldRenderType.TAGLIST,
    },
    {
      renderType: FieldRenderType.DIVIDER,
    },
    [
      {
        label: `Opened Tests (${data.testIds?.length ?? 0})`,
        content: data.testIds,
        renderType: 'idTagList',
        action: (id: string) => {
          if (addData) {
            addData();
            getDashboardTest(id).then((res) => {
              const modalData = mapTestModalData(res, addData) as DetailsModalRendererData[];
              return addData(modalData);
            });
          }
        },
      },
      {
        label: `Connected Feedbacks (${(data.feedbackIds?.length ?? 0) + (data.sources?.length ?? 0)})`,
        content: [
          ...data.feedbackIds,
          ...(data.sources?.map((d) => (
            <Link
              size="sm"
              href={d.value}
              target="_blank"
              rel="noreferrer"
              key={d.value}
              style={{ display: 'block', paddingBlock: '.25rem' }}
            >
              {d.value}
            </Link>
          )) ?? []),
        ],
        renderType: 'idTagList',
        action: (id: string) => {
          if (addData) {
            addData();
            getDashboardFeedback(id).then((res) => {
              const modalData = mapFeedbackModalData(res) as DetailsModalRendererData[];
              return addData(modalData);
            });
          }
        },
      },
    ],
    {
      renderType: FieldRenderType.DIVIDER,
    },
    {
      label: 'Authors',
      content: data.authors.join('\n'),
    },
    {
      label: 'Comments',
      content: data.comments ?? [],
      action: (comment: UserComment) =>
        patchDashboardIssue(data.id!, { key: 'comments', value: [...(data.comments ?? []), comment] }),
    },
  ];
};
