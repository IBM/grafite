import { DropdownSkeleton } from '@carbon/react';
import { ComboBox } from '@carbon/react';
import { ComboBoxProps } from '@carbon/react/lib/components/ComboBox/ComboBox';
import LabelledItem from '@components/LabelledItem';
import { type ReactElement, useId } from 'react';

import styles from './DetailedSearchModule.module.scss';

export type SearchModuleItem = { label: string; value: unknown; rawValue?: string; type?: string };

interface Props extends Omit<ComboBoxProps<{ [key: string]: unknown }>, 'items'> {
  label: string;
  items: null | SearchModuleItem[][];
}

export const DetailedSearchModule = ({ label, items, ...props }: Props) => {
  return (
    <div className={styles.root}>
      {!items ? (
        <DropdownSkeleton />
      ) : (
        <ComboBox
          {...props}
          //@ts-expect-error overriding combobox prop
          items={items}
          titleText={label}
          placeholder="Search item to select"
          itemToElement={(item: { [key: string]: unknown }) => (
            <DropdownItem item={Object.values(item) as SearchModuleItem[]} />
          )}
          size="md"
          helperText="Items displayed up to 10 items. Use search to find more items"
        />
      )}
    </div>
  );
};

const DropdownItem = ({ item }: { item: SearchModuleItem[] }) => {
  const id = useId();

  const title = item.find((d) => d.type === 'title');

  return (
    <div className={styles.dropdownItem} aria-labelledby={`${id}`}>
      {!!title && <label id={id}>{title.value as ReactElement}</label>}
      <div className={styles.row}>
        {item.map((i) => {
          const itemType = i.type;
          const valType = typeof i.value;

          if (itemType === 'title' || itemType === 'hidden') return null;
          const domKey = `id_${i.label.split(' ').join('_')}`;
          const getContent = (() => {
            if (i.value === null || i.value === undefined) return <>-</>;
            if (itemType === 'element') return i.value;
            if (valType === 'object') return <>{i.rawValue}</>;
            return <>{i.value}</>;
          })();

          return (
            <LabelledItem key={domKey} id={domKey} label={i.label} narrow>
              {getContent as ReactElement}
            </LabelledItem>
          );
        })}
      </div>
    </div>
  );
};
