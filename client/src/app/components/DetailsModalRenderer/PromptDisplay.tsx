import { Button } from '@carbon/react';
import ExpandableText from '@components/ExpandableText';
import LabelledItem from '@components/LabelledItem';
import MarkdownBox from '@components/MarkdownBox';
import { Message } from '@types';
import { useCallback, useId, useMemo, useState } from 'react';
import { JSONTree, LabelRenderer, ValueRenderer } from 'react-json-tree';

import styles from './PromptDisplay.module.scss';
import { dataIsFields, DetailsModalRendererData, Fields } from './utils';

interface Props {
  data: DetailsModalRendererData[];
  currentData: Fields;
}
const PromptDisplay = ({ data, currentData }: Props) => {
  const id = useId();
  //@ts-expect-error typescript glitch with array filter
  const promptData: Fields[] = useMemo(() => data.filter((d) => dataIsFields(d) && d.isPromptElement), [data]);
  const prompt = useMemo(() => promptData.find((d) => d.label !== 'Messages'), [promptData]);
  const messages = useMemo(() => promptData.find((d) => d.label === 'Messages'), [promptData]);

  const messageExist = !!(messages?.content as Message[])?.length;
  const [displayMessages, setDisplayMessages] = useState<boolean>(messageExist);

  if (prompt && currentData?.label === 'Messages') return null; //avoid double renderinig

  if (!prompt?.content && !messageExist) return <LabelledItem id={id} label="Messages" />; //no prompt data exist at all

  if (displayMessages)
    return (
      <div className={styles.root}>
        <Messages messages={messages?.content as Message[]} />
        {!!prompt && (
          <Button size="sm" kind="ghost" onClick={() => setDisplayMessages(false)} className={styles.displayModeButton}>
            View as raw prompt
          </Button>
        )}
      </div>
    );

  return (
    <div className={`${styles.root} ${styles.promptText}`}>
      <LabelledItem id={id} label={prompt?.label ?? 'Raw prompt'} previewMarkdown expandable>
        <>{prompt?.content}</>
      </LabelledItem>
      {messageExist && (
        <Button size="sm" kind="ghost" onClick={() => setDisplayMessages(true)} className={styles.displayModeButton}>
          View as messages
        </Button>
      )}
    </div>
  );
};

const Messages = ({ messages }: { messages: Message[] }) => {
  const id = useId();
  const [isMarkdown, setIsMarkdown] = useState<boolean>(false);

  const formattedForTreeView = useMemo(() => messages?.map(({ role, content }) => ({ [role]: content })), [messages]);
  const valueRenderer: ValueRenderer = useCallback(
    (_displayed, value) =>
      isMarkdown ? (
        <MarkdownBox className={styles.content}>{value as string}</MarkdownBox>
      ) : (
        <p className={styles.content}>{value as string}</p>
      ),
    [isMarkdown],
  );

  const labelRenderer: LabelRenderer = useCallback(
    (keyPath) => {
      const [key, parent] = keyPath;

      //display the role instead of the index
      if (typeof key === 'number' && parent === undefined) {
        return <span>{messages[key]?.role}</span>;
      }

      return <span className={styles.emptyLabel} />;
    },
    [messages],
  );

  const treeTheme = {
    base00: 'transparent',
    base01: 'transparent',
    base02: 'transparent',
    base03: 'transparent',
    base04: 'var(--cds-text-primary)',
    base05: 'var(--cds-text-primary)',
    base06: 'var(--cds-text-primary)',
    base07: 'var(--cds-text-primary)',
    base08: 'var(--cds-text-primary)',
    base09: 'var(--cds-text-primary)',
    base0A: 'var(--cds-text-primary)',
    base0B: 'var(--cds-text-primary)',
    base0C: 'var(--cds-text-primary)',
    base0D: 'var(--cds-text-secondary)',
    base0E: 'var(--cds-text-primary)',
    base0F: 'var(--cds-text-primary)',
  };

  return (
    <div>
      <div className={styles.header}>
        <label id={id}>Messages</label>
        <div className={styles.action} role="tablist">
          <button onClick={() => setIsMarkdown(false)} className={!isMarkdown ? styles.selected : ''}>
            Raw String
          </button>
          <button onClick={() => setIsMarkdown(true)} className={isMarkdown ? styles.selected : ''}>
            Formatted
          </button>
        </div>
      </div>
      <div className={styles.message}>
        <ExpandableText>
          <JSONTree
            hideRoot
            theme={treeTheme}
            data={formattedForTreeView}
            shouldExpandNodeInitially={() => true}
            labelRenderer={labelRenderer}
            valueRenderer={valueRenderer}
          ></JSONTree>
        </ExpandableText>
      </div>
    </div>
  );
};

export default PromptDisplay;
