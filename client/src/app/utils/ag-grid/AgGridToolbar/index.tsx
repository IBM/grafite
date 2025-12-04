'use client';

import { Button } from '@carbon/react';
import { InlineLoading } from '@carbon/react';
import { Renew } from '@carbon/react/icons';
import { memo, ReactElement } from 'react';

import styles from './AgGridToolbar.module.scss';
import TableSearch from './TableSearch';

interface Props {
  title?: ReactElement;
  actions?: ReactElement[];
  search?: (keyword: string) => void;
  refresh?: () => void;
  loading?: boolean;
}
const AgGridToolbar = ({ title, actions, search, refresh, loading = false }: Props) => {
  return (
    <div className={styles.toolbar}>
      {loading && (
        <div className={styles.loading}>
          <InlineLoading description="Fetching the latest data..." />
        </div>
      )}
      {title ?? ''}
      <div>
        <SearchBar search={search} />
        {refresh && <Button kind="ghost" renderIcon={Renew} iconDescription="Refresh" hasIconOnly onClick={refresh} />}
        {...actions ?? []}
      </div>
    </div>
  );
};

const SearchBar = memo(function SearchBar({ search }: { search?: (keyword: string) => void }) {
  if (search) return <TableSearch search={search} />;
  return null;
});
export default AgGridToolbar;
