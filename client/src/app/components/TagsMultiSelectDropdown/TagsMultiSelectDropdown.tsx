'use client';

import { DismissibleTag, FilterableMultiSelect, Tag } from '@carbon/react';
import LabelledItem from '@components/LabelledItem';
import { type Feedback } from '@utils/getFunctions/getDashboardFeedbacks';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import shortenID from '@utils/shortenID';
import { type Dispatch, type SetStateAction, useEffect, useId, useRef, useState } from 'react';

import styles from './TagsMultiSelectDropdown.module.scss';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = Record<string, any>;

type TagsMultiSelectDropdownProps = {
  titleText: string;
  items: Item[];
  keyToBeDisplayed?: string;
  selectedItems: Item[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedItems: Dispatch<SetStateAction<any[]>>;
  displayShortID?: boolean;
  className?: string;
  type: 'test' | 'feedback' | 'default';
};

const testSearchString = (test: Test) => {
  return `${test.id} ${test.prompt} ${test.approved ? 'Approved' : test.readyForReview ? 'Ready for review' : 'Draft'} ${test.author} ${test.flags?.join(' ')}`;
};

const feedbackSearchString = (feedback: Feedback) => {
  return `${feedback.id} ${feedback.source} ${feedback.userComment} ${feedback.tags?.join(' ')} ${feedback.modelId}`;
};

export const TagsMultiSelectDropdown = ({
  titleText,
  items,
  selectedItems,
  setSelectedItems,
  displayShortID = false,
  className,
  keyToBeDisplayed = 'id',
  type,
}: TagsMultiSelectDropdownProps) => {
  const id = useId();
  const hasLessItems = items.length < 30;

  const [renderedItems, setRenderedItems] = useState<Item[]>(hasLessItems ? items : selectedItems);
  const [open, setOpen] = useState<boolean>(false);
  const [isOverflow, setIsOverflow] = useState<boolean>(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overflowBoxRef = useRef<HTMLDivElement>(null);

  const resetRenderedItems = () => setRenderedItems(hasLessItems ? items : selectedItems);

  useEffect(() => {
    resetRenderedItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) {
      const box = overflowBoxRef.current;
      if (box) {
        setIsOverflow(box.scrollHeight > box.clientHeight);
      }
    }
  }, [open, selectedItems]);

  if (!type) {
    throw Error('"type" prop is needed to define what is going to be rendered in the dropdown items!');
  }

  for (const item of items) {
    if (!Object.hasOwn(item, keyToBeDisplayed)) {
      throw Error(
        `Key "${keyToBeDisplayed}" doesn't exist in some of the items. You can change the key to be displayed by changing the "keyToBeDisplayed" prop.`,
      );
    }

    if (typeof item[keyToBeDisplayed] !== 'string') {
      throw Error(
        `Key "${keyToBeDisplayed}" ("keyToBeDisplayed" prop) value must be strings. You can change the key to be displayed by changing the "keyToBeDisplayed" prop.`,
      );
    }
  }

  return (
    <div className={styles.wrapper}>
      <FilterableMultiSelect
        placeholder={!!selectedItems ? '' : 'Search item to select'}
        open={open}
        autoAlign
        onMenuChange={setOpen}
        className={`${type !== 'default' && styles.dropdown} ${className}`}
        id={id}
        items={renderedItems}
        titleText={titleText}
        selectedItems={selectedItems}
        onChange={({ selectedItems }: { selectedItems: Item[] }) => setSelectedItems(selectedItems)}
        onInputValueChange={(inputValue: Item) => {
          const inputValueLowercase = inputValue.toLowerCase();
          if (!inputValue) return resetRenderedItems();
          if (!!debounceRef.current) clearTimeout(debounceRef.current);

          if (inputValue.length > 2) {
            debounceRef.current = setTimeout(() => {
              switch (type) {
                case 'test':
                  setRenderedItems(
                    (items as Test[]).filter((test) =>
                      testSearchString(test).toLowerCase().includes(inputValueLowercase),
                    ),
                  );
                  break;
                case 'feedback':
                  setRenderedItems(
                    (items as Feedback[]).filter((feedback) =>
                      feedbackSearchString(feedback).toLowerCase().includes(inputValueLowercase),
                    ),
                  );
                  break;
                case 'default':
                  setRenderedItems(
                    items.filter((item) => item[keyToBeDisplayed].toLowerCase().includes(inputValueLowercase)),
                  );
                  break;
              }
            }, 300);
          }
        }}
        itemToString={(item: Item) => {
          if (type === 'test') {
            const test = item as Test;

            return testSearchString(test);
          } else if (type === 'feedback') {
            const feedback = item as Feedback;

            return feedbackSearchString(feedback);
          } else {
            return item[keyToBeDisplayed];
          }
        }}
        itemToElement={(item: Item) => {
          if (type === 'test') {
            const test = item as Test;

            return (
              <div className={styles.item} key={`${id}-element-${test.id}`}>
                <label>
                  {shortenID(test.id)}: {test.prompt}
                </label>
                <div className={styles.row}>
                  <LabelledItem label="Status" id={`${id}-test-item-${test.id}-status`}>
                    {test.approved ? 'Approved' : test.readyForReview ? 'Ready for review' : 'Draft'}
                  </LabelledItem>
                  <LabelledItem label="Author" id={`${id}-test-item-${test.id}-author`}>
                    {test.author}
                  </LabelledItem>
                  <LabelledItem label="Flags" id={`${id}-test-item-${test.id}-flags`}>
                    {test.flags && test.flags.length > 0 ? test.flags.join(', ') : '-'}
                  </LabelledItem>
                </div>
              </div>
            );
          } else if (type === 'feedback') {
            const feedback = item as Feedback;

            return (
              <div className={styles.item} key={`${id}-element-${feedback.id}`}>
                <label>
                  {shortenID(feedback.id)}
                  {feedback.userComment ? `: ${feedback.userComment}` : ''}
                </label>
                <div className={styles.row}>
                  <LabelledItem label="Source" id={`${id}-feedback-item-${feedback.id}-source`}>
                    {feedback.source}
                  </LabelledItem>
                  <LabelledItem label="Tags" id={`${id}-feedback-item-${feedback.id}-tags`}>
                    {feedback.tags && feedback.tags.length > 0 ? feedback.tags.join(', ') : '-'}
                  </LabelledItem>
                  <LabelledItem label="Model ID" id={`${id}-feedback-item-${feedback.id}-model_id`}>
                    {feedback.modelId}
                  </LabelledItem>
                </div>
              </div>
            );
          } else {
            return (
              <Tag className={styles.itemTag} type="high-contrast" key={`${id}-element-${item[keyToBeDisplayed]}`}>
                {item[keyToBeDisplayed]}
              </Tag>
            );
          }
        }}
      />
      {!open && (
        <div className={styles.selectedItems} ref={overflowBoxRef}>
          {selectedItems.length > 0
            ? selectedItems.map((i) => {
                const id = i[keyToBeDisplayed];
                const key = `${id}-label-${id}`;
                const text = displayShortID ? shortenID(id) : id;

                if (!id) return null;
                return (
                  <DismissibleTag
                    onClose={() => setSelectedItems((prev) => prev.filter((item) => item[keyToBeDisplayed] !== id))}
                    type="outline"
                    key={key}
                    text={text}
                    title="Dismiss"
                    onClick={() => setOpen(true)}
                  />
                );
              })
            : ''}
          {!!selectedItems.length && isOverflow && <span className={styles.ellipsis}>...</span>}
        </div>
      )}
    </div>
  );
};
