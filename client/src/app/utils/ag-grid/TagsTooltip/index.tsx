import { ITooltipParams } from 'ag-grid-community';

import styles from '../ag-grid.module.scss';
import { MultipleTagsRenderer } from './MultipleTagsRenderer';

const TagsTooltip = (
  props: ITooltipParams<unknown> & {
    isId?: boolean;
  },
) => {
  if (!props?.value?.length) return null;

  return (
    <div className={styles.tooltip}>
      <MultipleTagsRenderer isId={!!props.isId} values={props.value} />
    </div>
  );
};

export default TagsTooltip;
