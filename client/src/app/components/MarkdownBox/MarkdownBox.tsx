import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';

import { components } from './components';
import styles from './markdownbox.module.scss';
import { remarkPlugins } from './remark';

interface Props {
  className?: string;
  children: string;
}
const MarkdownBox = ({ className, children }: Props) => {
  return (
    <div className={`${styles.markdownWrapper} ${className}`}>
      <ReactMarkdown
        className={styles.reactMarkdown}
        remarkPlugins={remarkPlugins}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownBox;
