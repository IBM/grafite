'use client';

import { DismissibleTag, InlineLoading, OperationalTag, Popover, PopoverContent } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { TagBaseProps } from '@carbon/react/lib/components/Tag/Tag';
import LabelledItem from '@components/LabelledItem';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { useId, useState } from 'react';

import { NewTagModal } from './NewTagModal';
import styles from './TagSelector.module.scss';

type TagSelectorProps = {
  label?: string;
  direction?: 'horizontal' | 'vertical';
  listTagSize?: TagBaseProps['size'];
  appendable?: boolean;
  selectTag: (tag: string) => void;
  deselectTag: (tag: string) => void;
  getTags: () => Promise<string[]>;
  addNewTag?: (newValue: string) => Promise<unknown>;
  tags: string[];
};

export const TagSelector = ({
  deselectTag,
  selectTag,
  getTags,
  addNewTag,
  listTagSize = 'sm',
  tags,
  label = 'Test flags',
  direction = 'vertical',
  appendable,
}: TagSelectorProps) => {
  const [openTags, setOpenTags] = useState<boolean>(false);

  const { addToastMsg } = useToastMessageContext();

  const [availableTags, setAvailableTags] = useState<string[] | null>(null);
  const [availableTagsLoading, setAvailableTagsLoading] = useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const id = useId();

  const togglePopover = () => {
    if (!openTags) {
      setAvailableTagsLoading(true);
      setAvailableTags(null);

      getTags()
        .then((tags) => setAvailableTags([...tags].sort()))
        .catch((e) => addToastMsg(e.status, e.message, `Failed to get available ${label}`))
        .finally(() => {
          setAvailableTagsLoading(false);
        });
    }
    setOpenTags((prev) => !prev);
  };

  const validate = (newValue: string) => {
    if (!newValue) return false;
    return !availableTags?.includes(newValue);
  };

  const submit = (newValue: string) => {
    addNewTag?.(newValue)
      .then(() => selectTag(newValue))
      .catch((err) => addToastMsg(err.status, err.message, 'Failed to save tag'))
      .finally(() => {
        setOpenTags(false);
        close();
      });
  };

  return (
    <>
      <LabelledItem id={id} label={label}>
        <div className={`${styles.root} ${direction === 'horizontal' ? styles.horizontal : ''}`}>
          <div
            className={`${styles.popover} ${direction === 'vertical' ? styles.verticalTagBtnPopover : ''}`}
            aria-label={`Add ${label}`}
            role="group"
          >
            <Popover open={openTags} align={direction === 'vertical' ? 'bottom-right' : 'top-start'}>
              <OperationalTag type="blue" renderIcon={Add} onClick={togglePopover} className={styles.tagBtn} />
              <PopoverContent>
                {availableTagsLoading || !availableTags ? (
                  <InlineLoading description={`Loading ${label.toLowerCase()}...`} />
                ) : (
                  <div className={styles.tagWrapper}>
                    {availableTags.map((tag, i) => (
                      <OperationalTag
                        key={`${id}-test-tag-option-${i}`}
                        type="cool-gray"
                        size="sm"
                        text={tag}
                        onClick={() => {
                          selectTag(tag);
                          setOpenTags(false);
                        }}
                        disabled={tags.includes(tag)}
                      />
                    ))}
                    {appendable && (
                      <OperationalTag
                        type="blue"
                        size="md"
                        renderIcon={Add}
                        text="Add new"
                        className={styles.addNewBtn}
                        onClick={() => {
                          setIsModalOpen(true);
                        }}
                      />
                    )}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div
            aria-labelledby={id}
            className={`${styles.list} ${direction === 'horizontal' ? styles.horizontal : styles.vertical}`}
          >
            {tags && tags.length > 0 ? (
              tags.map((tag: string) => (
                <DismissibleTag
                  type="cool-gray"
                  size={listTagSize}
                  key={`${id}-test-tag-${tag.replace(' ', '')}`}
                  onClose={() => {
                    deselectTag(tag);
                  }}
                  text={tag}
                  title="Remove"
                />
              ))
            ) : (
              <span className={styles.empty}>No tag added</span>
            )}
          </div>
        </div>
      </LabelledItem>
      <NewTagModal
        open={isModalOpen}
        close={() => {
          setIsModalOpen(false);
        }}
        validate={validate}
        submit={submit}
        tagType={label}
      />
    </>
  );
};
