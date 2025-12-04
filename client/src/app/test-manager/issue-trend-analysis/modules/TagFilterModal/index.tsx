import { DismissibleTag, FormLabel, Modal, OnChangeData } from '@carbon/react';
import { Button } from '@carbon/react';
import { ComboBox } from '@carbon/react';
import { useEffect, useMemo, useState } from 'react';

import styles from './TagFilterModal.module.scss';

interface Props {
  tags: string[];
  defaultSelected: string[] | undefined;
  selectTags: (tags: string[]) => void;
  close: () => void;
  open: boolean;
}
const TagFilterModal = ({ tags, defaultSelected, selectTags, open, close }: Props) => {
  const [selectedTags, setSelectedTags] = useState<string[] | undefined>(undefined);
  const [controlComboBox, setControlComboBox] = useState<null | string>(null);

  const closeModal = () => {
    if (selectTags === undefined) selectAll();
    selectTags(selectedTags ?? tags);
    close();
  };

  const selectTag = (tag: string) => {
    if (tags.includes(tag)) setSelectedTags((prev) => [...(prev ?? []), tag]);
  };

  const selectAll = () => {
    setSelectedTags([...tags]);
  };

  const options = useMemo(() => tags ?? [], [tags]);

  useEffect(() => {
    if (defaultSelected) setSelectedTags(defaultSelected);
  }, [defaultSelected]);
  return (
    <Modal
      open={open}
      passiveModal
      modalHeading="Filter issue tags"
      onRequestClose={closeModal}
      preventCloseOnClickOutside
    >
      <div className={styles.root}>
        <div>
          <div className={styles.row}>
            <FormLabel>
              Selected tags ({selectedTags?.length ?? 0} / {tags.length})
            </FormLabel>
            <Button size="sm" kind="ghost" onClick={() => setSelectedTags([])}>
              Remove all
            </Button>
          </div>
          <div className={styles.tagList}>
            {(selectedTags ?? []).map((tag) => (
              <DismissibleTag
                size="md"
                color="cool-gray"
                text={tag}
                key={`selected-${tag}`}
                onClose={() => {
                  if (selectedTags === undefined) setSelectedTags([...tags]);
                  setSelectedTags((prev) => (prev ?? tags).filter((d) => d !== tag));
                }}
              />
            ))}
          </div>
        </div>

        <div className={styles.dropdown}>
          <ComboBox
            id="tag-filter-multiselect"
            titleText="Issue tags"
            selectedItem={controlComboBox}
            items={options}
            onChange={(data: OnChangeData<string | undefined>) => {
              const { selectedItem } = data;
              if (selectedItem) {
                selectTag(selectedItem);
                setControlComboBox(selectedItem);
                setTimeout(() => setControlComboBox(null), 0);
              }
            }}
            shouldFilterItem={({
              item: itemOriginal,
              inputValue: inputOriginal,
            }: {
              item: string;
              inputValue: string | null;
            }) => {
              const [item, inputValue] = [itemOriginal?.toLowerCase() ?? '', inputOriginal?.toLowerCase() ?? ''];

              if (selectedTags?.find((d) => item === d?.toLowerCase())) return false;
              if (!inputValue || inputValue.length < 3) return true;
              return item.includes(inputValue);
            }}
          />
          <div className={styles.selectAll}>
            <Button size="sm" kind="ghost" onClick={selectAll}>
              Select all
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TagFilterModal;
