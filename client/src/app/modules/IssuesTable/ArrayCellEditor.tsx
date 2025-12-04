'use client';

import { useRef, useState, useEffect } from 'react';
import { ICellEditorParams } from 'ag-grid-community';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';

export const ArrayCellEditor = (props: ICellEditorParams<Issue, string[]>) => {
  const [value, setValue] = useState(props.value ? props.value.join(', ') : '');

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <input
      type="text"
      ref={inputRef}
      className="ag-input-field-input ag-text-field-input"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      onKeyDownCapture={(e) => {
        if (e.key === 'Enter') {
          props.stopEditing(true);
          props.node.setDataValue(
            props.colDef.field || '',
            value
              .split(', ')
              .map((v) => v.trim())
              .filter((v) => v !== ''),
          );
        }
      }}
    />
  );
};
