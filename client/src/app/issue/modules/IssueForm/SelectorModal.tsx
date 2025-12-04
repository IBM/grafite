'use client';

import { IconButton, Layer, Modal } from '@carbon/react';
import { Launch } from '@carbon/react/icons';
import { DetailedSearchModule, SearchModuleItem } from '@components/DetailedSearchModule/DetailedSearchModule';
import LabelledItem from '@components/LabelledItem';
import ShortIdTag from '@components/ShortIdTag';
import { type Feedback } from '@utils/getFunctions/getDashboardFeedbacks';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import { mapTestStatus } from '@utils/mapStatus';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './IssueForm.module.scss';

type SelectorModalProps = {
  type: 'test' | 'feedback';
  items: Record<string, unknown>[];
  selectedItems: Record<string, unknown>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedItems: Dispatch<SetStateAction<any[]>>;
};

export const SelectorModal = ({ type, items, selectedItems, setSelectedItems }: SelectorModalProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalSelectedItems, setModalSelectedItems] = useState<SearchModuleItem[][]>(
    mapItemsForSearchModule(selectedItems, type),
  );

  const isTest = type === 'test';

  const itemList: SearchModuleItem[][] = mapItemsForSearchModule(items, type);

  function mapItemsForSearchModule(items: Record<string, unknown>[], type: 'test' | 'feedback') {
    return items.map((i) => {
      switch (type) {
        case 'test':
          const { author, flags, id, prompt } = i as Test;
          const status = mapTestStatus(i as Test);
          return [
            {
              label: 'Status',
              value: status,
              rawValue: status,
            },
            {
              label: 'Author',
              value: author,
              rawValue: author,
            },
            {
              label: 'Flags',
              value: flags,
              rawValue: flags?.join(', ') ?? '',
            },
            {
              label: 'Title',
              value: (
                <>
                  <ShortIdTag size="sm" id={id} className={styles.detailedSearchModuleItemTag} /> {prompt}
                </>
              ),
              rawValue: prompt,
              type: 'title',
            },
            {
              label: 'ID',
              value: id,
              rawValue: id,
            },
          ];
        case 'feedback':
          const { userComment, id: feedback_id, source, tags, modelId } = i as Feedback;

          return [
            {
              label: 'Source',
              value: source,
              rawValue: source,
            },
            {
              label: 'Tags',
              value: tags,
              rawValue: tags?.join(', ') ?? '',
            },
            {
              label: 'Model ID',
              value: modelId,
              rawValue: modelId,
            },
            {
              label: 'Title',
              value: userComment ? (
                <>
                  <ShortIdTag size="sm" id={feedback_id} className={styles.detailedSearchModuleItemTag} /> {userComment}
                </>
              ) : (
                <ShortIdTag size="sm" id={feedback_id} className={styles.detailedSearchModuleItemTag} />
              ),
              type: 'title',
              rawValue: userComment ?? '',
            },
            {
              label: 'ID',
              value: (
                <div>
                  <div>{feedback_id}</div>
                </div>
              ),
              type: 'element',
              rawValue: feedback_id,
            },
          ];
      }
    });
  }

  const getId = (d: SearchModuleItem[]) => d.find((d) => d.label === 'ID')?.rawValue;

  const compareId = (a: SearchModuleItem[], b: SearchModuleItem[]) => {
    const aId = getId(a);
    const bId = getId(b);
    return aId && bId && aId === bId;
  };
  const submit = () => {
    const selectedItems = modalSelectedItems.map((item) => {
      const id = getId(item);
      return items.find((d) => d.id === id);
    });
    setSelectedItems([...selectedItems]);
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (isModalOpen) setModalSelectedItems(mapItemsForSearchModule(selectedItems, type));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);
  return (
    <>
      <IconButton
        kind="secondary"
        size="md"
        onClick={() => setIsModalOpen(true)}
        label="Search in modal"
        align="top-end"
      >
        <Launch />
      </IconButton>
      {typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        createPortal(
          <Modal
            open={isModalOpen}
            size="lg"
            modalHeading={`Search ${isTest ? 'QA test' : 'feedback'}`}
            primaryButtonText={`Connect ${isTest ? 'QA tests' : 'feedbacks'}`}
            onRequestClose={() => setIsModalOpen(false)}
            onRequestSubmit={submit}
          >
            <LabelledItem id={`connected-${type}-modal`} label={`Connected ${isTest ? 'QA tests' : 'feedbacks'}`}>
              {!modalSelectedItems.length ? (
                <span className={styles.empty}>No {type} selected</span>
              ) : (
                <div className={styles.tagList}>
                  {modalSelectedItems.map((i) => {
                    const id = getId(i);

                    return (
                      <ShortIdTag
                        key={`selected-${type}-${id}`}
                        id={id}
                        dismissible
                        onDismiss={() => setModalSelectedItems((prev) => prev.filter((item) => !compareId(item, i)))}
                      />
                    );
                  })}
                </div>
              )}
            </LabelledItem>
            <Layer level={1} className={styles.paddingBlockStart}>
              <DetailedSearchModule
                autoAlign
                id={`${type}-modal-selector`}
                items={itemList.filter((i) => !modalSelectedItems.find((selected) => compareId(selected, i)))}
                label=""
                onChange={({ selectedItem }) => {
                  if (selectedItem) {
                    const formatted = Object.values(selectedItem) as SearchModuleItem[];
                    setModalSelectedItems((prev) => [...prev, formatted]);
                  }
                }}
                shouldFilterItem={({
                  inputValue,
                  item,
                }: {
                  item: { [key: string]: unknown };
                  inputValue: string | null;
                }) => {
                  const formatted = Object.values(item) as SearchModuleItem[];
                  if (modalSelectedItems.find((d) => compareId(d, formatted))) return false;
                  if (!inputValue || inputValue.length < 3) return true;

                  const input = inputValue.toLowerCase();

                  if (
                    formatted
                      .map((d) => d.rawValue)
                      .join(' ')
                      .toLowerCase()
                      .includes(input)
                  )
                    return true;

                  return false;
                }}
              />
            </Layer>
          </Modal>,
          document.body,
        )}
    </>
  );
};
