import { DismissibleTag, FormLabel, Modal, MultiSelect } from '@carbon/react';
import { useState } from 'react';

interface Props {
  tags: string[];
  selectTags: (tags: string[]) => void;
  close: () => void;
  open: boolean;
}
const TagFilterModal = ({ tags, selectTags, open, close }: Props) => {
  const [selectedTags, setSelectedTags] = useState<string[] | undefined>(undefined);

  const closeModal = () => {
    if (selectTags === undefined) setSelectedTags([...tags]);
    selectTags(selectedTags ?? tags);
    close();
  };

  const getItemId = (item: string) => {
    return item.replaceAll(' ', '-');
  };

  const getOptions = (items: string[]) => {
    return items.map((item) => ({ id: getItemId(item), text: item }));
  };
  return (
    <Modal
      open={open}
      passiveModal
      modalHeading="Filter issue tags"
      onRequestClose={closeModal}
      preventCloseOnClickOutside
    >
      <div>
        <MultiSelect
          id="tag-filter-multiselect"
          label=" "
          titleText="Issue tags"
          selectedItems={getOptions(selectedTags ?? tags)}
          items={getOptions(tags)}
          onChange={({ selectedItems }: { selectedItems: { id: string; text: string }[] }) => {
            setSelectedTags([...selectedItems.map((d) => d.text)]);
          }}
          itemToString={(item: { id: string; text: string }) => item.text}
        />

        <div>
          <FormLabel>Selected tags</FormLabel>
          <div>
            {(selectedTags ?? tags).map((tag) => (
              <DismissibleTag
                size="md"
                color="cool-gray"
                text={tag}
                key={tag}
                onClose={() => {
                  if (selectedTags === undefined) setSelectedTags([...tags]);
                  setSelectedTags((prev) => (prev ?? tags).filter((d) => d !== tag));
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TagFilterModal;
