import { DataTableCell, DataTableRow } from '@carbon/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapDataTableRowToObject = <T>(row: DataTableRow<any>): T => {
  const { id } = row;

  const obj: Record<string, unknown> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row.cells.forEach((cell: DataTableCell<any>) => {
    obj[cell.id.split(`${id}:`)[1]] = cell.value;
  });

  return obj as T;
};
