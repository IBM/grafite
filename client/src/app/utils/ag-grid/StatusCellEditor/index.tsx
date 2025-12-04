'use client';

import { Dropdown } from '@carbon/react';
import StatusTag from '@components/StatusTag';
import { mapIssueStatus, mapTestStatus } from '@utils/mapStatus';
import { ColDef, ICellEditorParams, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { useState } from 'react';

import styles from './StatusCellEditor.module.scss';

const statusMap = {
  issue: mapIssueStatus,
  test: mapTestStatus,
};

const statusMapValues = {
  issue: ['Draft', 'Ready for review', 'Approved', 'Resolved', 'Deprecated'],
  test: ['Draft', 'Ready for review', 'Approved', 'Deprecated'],
};

export type OnStatusChangeParams = {
  id: string;
  newValue: string;
};

type StatusCellEditorProps = ICellEditorParams & {
  values: { text: string }[];
  type: 'test' | 'issue';
  onStatusChange: (params: OnStatusChangeParams) => void;
};

function StatusCellEditor(props: StatusCellEditorProps) {
  const [selectedValue, setSelectedValue] = useState<{ text: string }>({
    text: props.value,
  });

  if (!props.data) return null;

  return (
    <Dropdown
      id={`issue-${props.data.id}-status-dropdown`}
      items={props.values}
      selectedItem={selectedValue}
      onChange={(i) => {
        if (i.selectedItem) {
          setSelectedValue(i.selectedItem);

          props.onStatusChange({ id: props.data.id, newValue: i.selectedItem.text });
        }
      }}
      label="Select Status"
      titleText={null}
      itemToElement={(i) => (
        <div className={styles.dropdownItem}>
          <StatusTag>{i.text}</StatusTag>
        </div>
      )}
      renderSelectedItem={(i) => <StatusTag>{i.text}</StatusTag>}
    />
  );
}

export default function getStatusColDef<T>({
  editable,
  type,
  onStatusChange,
}: {
  editable: boolean;
  type: 'test' | 'issue';
  onStatusChange: (params: OnStatusChangeParams) => void;
}): ColDef<T> {
  return {
    colId: 'status',
    headerName: 'Status',
    cellRenderer: (props: ICellRendererParams) => props.data && <StatusTag>{statusMap[type](props.data)}</StatusTag>,
    editable,
    cellEditor: (props: ICellEditorParams) => (
      <StatusCellEditor
        {...props}
        type={type}
        values={statusMapValues[type].map((i) => ({ text: i }))}
        onStatusChange={onStatusChange}
      />
    ),
    width: 160,
    cellEditorPopup: true,
    valueGetter: (params: ValueGetterParams) => statusMap[type](params.data),
  };
}
