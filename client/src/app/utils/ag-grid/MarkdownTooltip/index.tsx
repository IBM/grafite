import MarkdownBox from '@components/MarkdownBox';
import { ITooltipParams } from 'ag-grid-community';

import styles from '../ag-grid.module.scss';

interface Props {
  formatter?: (value: unknown) => string;
}
const MarkdownToolTip = ({ formatter, ...props }: ITooltipParams<unknown> & Props) => {
  const content: unknown = formatter ? formatter(props.value) : props.value;
  const contentIsString = typeof content === 'string';

  return (
    <div className={styles.tooltip}>
      <MarkdownBox>{contentIsString ? content : `${content}`}</MarkdownBox>
    </div>
  );
};

export default MarkdownToolTip;
