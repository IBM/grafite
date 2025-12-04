import { ICellRendererParams, ColDef, IRowNode, EditableCallbackParams } from 'ag-grid-community';

import styles from './BooleanCellRenderer.module.scss';

export type BooleanCellEditHandlerParams<T> = {
  data: T;
  colDef: ColDef<T>;
  newValue: boolean;
  node: IRowNode<T>;
  oldValue: boolean;
};

export const BooleanCellRenderer = <T,>(
  props: ICellRendererParams<T> & {
    editHandler: (event: BooleanCellEditHandlerParams<T>) => void;
  },
) => {
  const getDisabled = () => {
    if (typeof props.colDef?.editable === 'function') return !props.colDef.editable(props as EditableCallbackParams);
    else return !props.colDef?.editable;
  };
  return (
    <input
      className={styles.checkbox}
      type="checkbox"
      checked={!!props.value}
      disabled={getDisabled()}
      onChange={() => {
        if (props.colDef && props.data) {
          props.editHandler({
            colDef: props.colDef,
            data: props.data,
            newValue: !props.value,
            node: props.node,
            oldValue: props.value,
          });
        }
      }}
    />
  );
};
