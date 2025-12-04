import { useThemePreference } from '@components/ThemePreference';
import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';

import styles from '../markdownbox.module.scss';
import { Button } from '@carbon/react';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Checkmark, Close } from '@carbon/react/icons';
import TextButtons from '../TextButtons';
import { useCopyToClipboard } from '@hooks/useCopyToClipboard';

type Props = {
  inline: boolean;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any;
};

function Code(props: PropsWithChildren<Props>) {
  const { theme } = useThemePreference();

  //below states use the code block starting line(=line_{num}) as key
  const [isRawString, setIsRawString] = useState<{ [key: string]: boolean }>({});

  const [copyResults, setCopyResults] = useState<{ [key: string]: string | null }>({});
  const copyTargetRef = useRef<string[]>([]); //track copy action targets
  const box = useRef<HTMLDivElement>(null); //to enable copying on HTTP by allowing textarea selection

  const timerRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  function handleCopy(inputText: string, targetLine: string) {
    copyToClipboard(inputText);
    copyTargetRef.current.push(targetLine);
  }

  const callbackFunction = useCallback((boolState: boolean, key: string) => {
    setIsRawString((prev) => ({ ...prev, [key]: boolState }));
  }, []);

  const [copyToClipboard, copyResult] = useCopyToClipboard(box);

  useEffect(() => {
    //timeout cleanup
    let timers: { [key: string]: ReturnType<typeof setTimeout> } | null = null;
    if (timerRef.current) timers = timerRef.current;

    return () => {
      if (timers) Object.values(timers).map((timeout) => clearTimeout(timeout));
    };
  }, []);
  useEffect(() => {
    if (copyResult !== null && copyTargetRef.current) {
      const line = `${copyTargetRef.current[0]}`;
      setCopyResults((prev) => ({ ...prev, [line]: copyResult.state }));
      copyTargetRef.current = copyTargetRef.current.slice(1);

      //timer to reset the copy state
      if (timerRef.current[line]) clearTimeout(timerRef.current[line]);

      const timer = setTimeout(() => {
        setCopyResults((prev) => ({ ...prev, [line]: null }));
      }, 2000);
      timerRef.current[line] = timer;
    }
  }, [copyResult]);

  const { children, className, node, ...rest } = props;
  const match = /language-(\w+)/.exec(className || '');
  const startLine = `line_${node?.position?.start?.line}`;

  return match ? (
    <div className={styles.codeWrapper} ref={box}>
      <TextButtons callbackFunction={(boolState) => callbackFunction(boolState, startLine)} />
      {!isRawString[startLine] ? (
        <>
          <SyntaxHighlighter
            PreTag="div"
            // eslint-disable-next-line react/no-children-prop
            children={String(children ?? '').replace(/\n$/, '')}
            language={match[1]}
            style={theme === 'white' ? oneLight : oneDark}
            className={styles.codeBlock}
          />
          <div className={styles.copyBtn}>
            <Button
              size="sm"
              kind="ghost"
              iconDescription={
                !copyResults[startLine]
                  ? 'Copy code'
                  : copyResults[startLine] === 'success'
                    ? 'Copied'
                    : 'Failed to copy'
              }
              tooltipAlignment="end"
              hasIconOnly
              renderIcon={!copyResults[startLine] ? Copy : copyResults[startLine] === 'success' ? Checkmark : Close}
              onClick={() => {
                if (typeof children === 'string') {
                  handleCopy(children, startLine);
                }
              }}
            />
          </div>
        </>
      ) : (
        `\`\`\`${className?.replace('language-', '')}\n${children ?? ''}\`\`\``
      )}
    </div>
  ) : (
    <code {...rest} className={className}>
      {children}
    </code>
  );
}

export default Code;
