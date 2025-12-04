import { DismissibleTag } from '@carbon/react';
import { Fragment } from 'react';
import styles from './TableFilterPanel.module.scss';
import { Button } from '@carbon/react';

interface Props {
  filters: string[];
  clear: () => void;
  remove: (filter: string) => void;
}
const TableFilterPanel = ({ filters, clear, remove }: Props) => {
  return (
    <>
      {!!filters.length && (
        <div className={styles.root}>
          {filters.map((filter) => (
            <Fragment key={`table-by-test-filter-${filter.replaceAll(' ', '')}`}>
              <DismissibleTag
                text={filter}
                onClose={() => {
                  remove(filter);
                }}
                type="high-contrast"
                title={filter}
              />
            </Fragment>
          ))}
          <Button kind="ghost" size="sm" onClick={clear}>
            Clear filters
          </Button>
        </div>
      )}
    </>
  );
};

export default TableFilterPanel;
