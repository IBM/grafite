import { useId, useState, type ReactNode } from 'react';

import MarkdownBox from '@components/MarkdownBox';

import styles from './ViewDetailsModal.module.scss';

const Content = (props: {
  content: string | ReactNode | null | undefined;
  isMarkdown: boolean;
  formatted: boolean;
}) => {
  const { content, formatted, isMarkdown } = props;

  if (!content) return <span className={styles.empty}>-</span>;

  if (typeof content !== 'string') return content;

  if (isMarkdown && formatted) return <MarkdownBox>{content}</MarkdownBox>;

  return <p className={styles.content}>{content}</p>;
};

export const ContentWithTitle = ({
  width = '100%',
  content,
  title,
  isMarkdown = false,
}: {
  width?: string;
  content?: string | ReactNode | null;
  title: string;
  isMarkdown?: boolean;
}) => {
  const [formatted, setFormatted] = useState<boolean>(false);
  const id = useId();

  return (
    <div className={styles.contentWithTitle} style={{ width }} aria-labelledby={`#${id}`}>
      <div className={styles.title}>
        <label id={id}>{title}</label>
        {isMarkdown ? (
          <div className={styles.buttons}>
            <button onClick={() => setFormatted(false)} className={!formatted ? styles.selected : ''}>
              Raw String{' '}
            </button>
            |
            <button onClick={() => setFormatted(true)} className={formatted ? styles.selected : ''}>
              Formatted
            </button>
          </div>
        ) : null}
      </div>
      <Content content={content} isMarkdown={isMarkdown} formatted={formatted} />
    </div>
  );
};
