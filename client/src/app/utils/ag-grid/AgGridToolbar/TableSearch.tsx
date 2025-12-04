import { ExpandableSearch } from '@carbon/react';
import { ChangeEvent, memo, useCallback } from 'react';

const TableSearch = memo(function TableSearch({ search }: { search: (keyword: string) => void }) {
  const handleInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target?.value || '';
      search(value.length > 3 ? value : '');
    },
    [search],
  );

  return (
    <ExpandableSearch
      size="lg"
      labelText="Search table"
      closeButtonLabelText="Clear search input"
      id="ag-grid-search-expandable"
      onChange={handleInput}
    />
  );
});

export default TableSearch;
