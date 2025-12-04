import { DetailedSearchModule, SearchModuleItem } from '@components/DetailedSearchModule/DetailedSearchModule';
import ShortIdTag from '@components/ShortIdTag';
import { useTestContext } from '@modules/TestContext';
import { MultipleTagsRenderer } from '@utils/ag-grid/TagsTooltip/MultipleTagsRenderer';
import { type Feedback } from '@utils/getFunctions/getDashboardFeedbacks';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import { ICellEditorParams } from 'ag-grid-community';
import { KeyboardEvent, useEffect, useId, useState } from 'react';

import { useFeedbackContext } from '../FeedbacksContext';
import styles from './IssuesTable.module.scss';

export const ExternalFieldCellEditor = (
  props: ICellEditorParams<Issue, string[]> & { type: 'tests' | 'feedbacks' },
) => {
  const [items, setItems] = useState<SearchModuleItem[][] | null>(null);

  const { tests } = useTestContext();
  const { feedbacks } = useFeedbackContext();

  const id = useId();

  const mapContent = (propType: string, data: (Feedback | Test)[]) => {
    const isFeedback = ((data: (Feedback | Test)[]): data is Feedback[] => {
      return Object.keys(data?.[0]).includes('source');
    })(data);
    const isTest = ((data: (Feedback | Test)[]): data is Test[] => {
      return Object.keys(data?.[0]).includes('flags');
    })(data);

    if (propType === 'feedbacks' && isFeedback) {
      const getTitle = (d: Feedback) =>
        d.userComment ? (
          <>
            <ShortIdTag size="sm" id={d.id} className={styles.detailedSearchModuleItemTag} /> {d.userComment}
          </>
        ) : (
          <ShortIdTag size="sm" id={d.id} className={styles.detailedSearchModuleItemTag} />
        );
      return data?.map((d: Feedback) => [
        {
          label: 'Source',
          value: d.source,
          rawValue: d.source,
        },
        {
          label: 'Tags',
          value: d.tags,
          rawValue: Array.isArray(d.tags) ? d.tags?.join(', ') : '',
        },
        {
          label: 'Model ID',
          value: d.modelId,
          rawValue: d.modelId,
        },
        {
          label: 'Title',
          value: getTitle(d as Feedback),
          rawValue: d.userComment ?? '',
          type: 'title',
        },
        {
          label: 'ID',
          value: d.id,
          rawValue: d.id,
          type: 'hidden',
        },
      ]);
    }
    if (isTest) {
      const getStatus = (d: Test) => (d.approved ? 'Approved' : d.readyForReview ? 'Ready for review' : 'Draft');
      return data?.map((d: Test) => [
        {
          label: 'Status',
          value: getStatus(d as Test),
          rawValue: getStatus(d as Test),
        },
        {
          label: 'Author',
          value: d.author,
          rawValue: d.author,
        },
        {
          label: 'Flags',
          value: d.flags,
          rawValue: Array.isArray(d.flags) ? d.flags?.join(', ') : '',
        },
        {
          label: 'Title',
          value: (
            <>
              <ShortIdTag size="sm" id={(d as Test).id} className={styles.detailedSearchModuleItemTag} /> {d.prompt}
            </>
          ),
          rawValue: d.prompt ?? '',
          type: 'title',
        },
        {
          label: 'ID',
          value: d.id,
          rawValue: d.id,
          type: 'hidden',
        },
      ]);
    }
    console.error('Prop type is wrong');
    return null;
  };

  useEffect(() => {
    setItems(mapContent(props.type, props.type === 'feedbacks' ? (feedbacks as Feedback[]) : (tests as Test[])));
  }, [feedbacks, tests, props.type]);

  const values = props.data[`${props.type === 'tests' ? 'test' : 'feedback'}Ids`];

  return (
    <div className={styles.externalFieldCellEditor} aria-labelledby={id}>
      <label id={id}>Connected {props.type}</label>
      <div className={styles.tags}>
        {!values.length ? (
          <span className={styles.empty}>No {props.type} selected</span>
        ) : (
          <MultipleTagsRenderer
            isId
            values={values}
            deleteBtn
            onDelete={(val) => {
              props.stopEditing();

              const newValue = props.value ? [...props.value] : [];

              props.node.setDataValue(
                props.colDef?.field || '',
                newValue.filter((id) => id !== val),
              );
            }}
          />
        )}
      </div>
      <div className={styles.padding}>
        <DetailedSearchModule
          label={`Connect more ${props.type}`}
          id={`dropdow-connect-more-${props.type}`}
          items={items}
          onChange={({ selectedItem }: { selectedItem: { [key: string]: unknown } | undefined | null }) => {
            props.stopEditing();

            if (selectedItem) {
              props.node.setDataValue(
                props.colDef.field || '',
                props.value ? [selectedItem._id, ...props.value] : [selectedItem._id],
              );
            }
          }}
          onKeyDownCapture={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              props.stopEditing(true);
            }
          }}
          shouldFilterItem={({ inputValue, item }: { item: { [key: string]: unknown }; inputValue: string | null }) => {
            if (props.value?.includes(item._id as string)) return false;
            if (!inputValue || inputValue === '' || inputValue.length < 3) return true;

            const input = inputValue.toLowerCase();

            if (
              Object.values(item)
                .map((d) => `${d}`)
                .join(' ')
                .toLowerCase()
                .includes(input)
            )
              return true;

            return false;
          }}
        />
      </div>
    </div>
  );
};
