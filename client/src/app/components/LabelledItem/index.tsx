import { Button } from '@carbon/react';
import { Checkmark, Close, Copy } from '@carbon/react/icons';
import ExpandableText from '@components/ExpandableText';
import MarkdownBox from '@components/MarkdownBox';
import { useCopyToClipboard } from '@hooks/useCopyToClipboard';
import { parseReactElementContent } from '@utils/parseReactElemenContent';
import { ReactElement, useRef, useState } from 'react';

import styles from './LabelledItem.module.scss';

const LabelledItem = ({
  id,
  label,
  children,
  expandable,
  copiable,
  previewMarkdown,
  formatMarkdown,
  narrow,
}: {
  id: string;
  label: string;
  children?: ReactElement | string | number;
  expandable?: boolean;
  copiable?: boolean;
  previewMarkdown?: boolean;
  formatMarkdown?: boolean;
  narrow?: boolean;
}) => {
  const [formatted, setFormatted] = useState<boolean>(false);
  const hasContent = !!children;

  const getContent = () => {
    if (!hasContent) return '';
    if (typeof children === 'string' || typeof children === 'number') return `${children}`;
    return parseReactElementContent(children);
  };

  const getContentElement = () =>
    formatted || formatMarkdown ? (
      <MarkdownBox>{getContent()}</MarkdownBox>
    ) : hasContent ? (
      children
    ) : (
      <span className={styles.empty}>-</span>
    );

  return (
    <div className={`${styles.wrapper} ${!!copiable ? styles.copiable : ''} ${narrow ? styles.narrow : ''}`}>
      <div className={styles.header}>
        <label id={id}>{label}</label>
        {previewMarkdown && hasContent && (
          <div className={styles.action} role="tablist">
            <button onClick={() => setFormatted(false)} className={!formatted ? styles.selected : ''}>
              Raw String
            </button>
            <button onClick={() => setFormatted(true)} className={formatted ? styles.selected : ''}>
              Formatted
            </button>
          </div>
        )}
      </div>
      <div aria-labelledby={id} className={styles.content}>
        {expandable ? <ExpandableText>{getContentElement()}</ExpandableText> : getContentElement()}
      </div>
      {copiable && <CopyBtn copiable={getContent()} />}
    </div>
  );
};

const CopyBtn = ({ copiable }: { copiable: string }) => {
  const box = useRef<HTMLDivElement>(null); //to enable copying on HTTP by allowing textarea selection
  const [copy, status] = useCopyToClipboard(box);

  return (
    <div className={styles.copyBtn} ref={box}>
      <Button
        kind="ghost"
        size="sm"
        renderIcon={status ? (status.state === 'success' ? Checkmark : Close) : Copy}
        iconDescription={status ? (status.state === 'success' ? 'Copied' : 'Failed') : 'Copy'}
        hasIconOnly
        tooltipAlignment="end"
        onClick={() => copy(copiable)}
      />
    </div>
  );
};
export default LabelledItem;
