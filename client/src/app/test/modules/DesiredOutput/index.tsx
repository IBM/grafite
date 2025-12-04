import { Message } from '@types';
import { MutableRefObject, SyntheticEvent, useEffect, useRef, useState } from 'react';
import { AILabel, AILabelContent } from '@carbon/react';
import { ChevronUp, StopFilled } from '@carbon/react/icons';
import { Tag, Button, TextArea } from '@carbon/react';
import styles from './DesiredOutput.module.scss';
import { DEFAULT_PARAM } from '@utils/constants';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { DesiredOutputSourceType } from '@api/dashboard/tests/utils';

const DesiredOutput = ({
  blurHandler,
  promptRef,
  messages,
  minRows,
  defaultValue,
  defaultLabel,
  updateLabel,
}: {
  blurHandler: (e: SyntheticEvent<HTMLTextAreaElement>, label: string) => void;
  promptRef?: MutableRefObject<HTMLTextAreaElement | { value: string } | null>;
  messages?: Message[];
  minRows?: number;
  defaultValue: string;
  defaultLabel: DesiredOutputSourceType;
  updateLabel: (value: DesiredOutputSourceType) => void;
}) => {
  const { addToastMsg } = useToastMessageContext();

  const textInputRef = useRef<HTMLTextAreaElement | null>(null);
  const isNew = useRef<boolean>(true); //whether edit has been made since initial load
  const aborter = useRef<AbortController | null>(null);

  const [isLoading, setLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');
  const [desiredActionOpen, setDesiredActionOpen] = useState<boolean>(defaultLabel === DesiredOutputSourceType.MODEL);
  const [isAi, setIsAi] = useState<boolean>(defaultLabel === DesiredOutputSourceType.MODEL);

  const model = process.env.NEXT_PUBLIC_DESIRED_OUTPUT_MODEL || '';

  // Update the value of textarea
  const updateInputVal = (completion: string) => {
    const textarea = textInputRef.current;
    if (textarea) {
      textarea.value = completion;
      textarea.focus();
    }
    if (!promptRef?.current) {
      //in case of chat, set the height based on the content
      const textArea = textInputRef.current;
      if (textArea) textArea.style.height = textArea.scrollHeight + 10 + 'px';
    }
  };

  const stop = () => {
    aborter.current?.abort();
    afterAll(output);
  };

  const afterAll = (generatedChunk: string) => {
    updateLabel(DesiredOutputSourceType.MODEL);
    setLoading(false);
    setTimeout(() => updateInputVal(generatedChunk), 10);
  };

  const generateChat = async (input: Message[]) => {
    const reqBody = {
      stream: true,
      model,
      options: {
        ...DEFAULT_PARAM,
      },
      messages: input,
    };
    aborter.current?.abort();
    aborter.current = new AbortController();
    let generatedChunk = '';

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
        signal: aborter.current.signal,
      });
      if (!res.ok || res.body === null)
        return addToastMsg(res.status.toString(), 'Empty output generated', 'Generation failed');
      const reader = res.body.getReader();
      const textDecoder = new TextDecoder();
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) {
          afterAll(generatedChunk);
          break;
        }
        const msgResponse = textDecoder
          .decode(chunk.value)
          .trim()
          .split('\n')
          .map((value) => JSON.parse(value) as { message: { content: string } })
          .reduce((prev, curr) => prev + curr.message.content, '');
        generatedChunk += msgResponse;
        setOutput((prev) => prev + msgResponse);
      }
    } catch (err) {
      console.error(err);
      if (!`${err}`.includes('AbortError')) addToastMsg('error', 'Please try again', 'Failed to generate');
    }
  };

  const generateFreeform = async (input: string) => {
    const reqBody = {
      stream: true,
      model: model,
      options: { ...DEFAULT_PARAM },
      prompt: input,
    };

    aborter.current?.abort();
    aborter.current = new AbortController();
    let generatedChunk = '';

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
        signal: aborter.current.signal,
      });

      if (!res.ok || res.body === null)
        return addToastMsg(res.status.toString(), 'Empty output generated', 'Generation failed');

      const reader = res.body.getReader();
      const textDecoder = new TextDecoder();

      while (true) {
        const chunk = await reader.read();
        if (chunk.done) {
          afterAll(generatedChunk);
          break;
        }

        const msgResponse = textDecoder
          .decode(chunk.value)
          .trim()
          .split('\n')
          .map((value) => JSON.parse(value) as { response: string })
          .reduce((prev, curr) => prev + curr.response, '');
        generatedChunk += msgResponse;
        setOutput((prev) => prev + msgResponse);
      }
    } catch (err) {
      console.error(err);
      if (!`${err}`.includes('AbortError')) addToastMsg('error', 'Please try again', 'Failed to generate');
    }
  };

  const generate = async () => {
    setLoading(true);
    setOutput('');

    if (!!messages) {
      const lastMessageIsAi = messages[messages.length - 1]?.role === 'assistant';
      await generateChat(lastMessageIsAi ? messages.slice(0, -1) : messages);
    } else {
      await generateFreeform(promptRef?.current?.value || '');
    }
  };

  // if any default value exist, it must be assistant's
  const getDefaultValue = () => {
    return (isNew.current ? defaultValue : output) || '';
  };

  useEffect(() => {
    if (!promptRef?.current) {
      //in case of chat, set the height based on the content
      const textArea = textInputRef.current;
      if (textArea && !!textArea.value) textArea.style.height = textArea.scrollHeight + 10 + 'px';
    }
  }, []);

  return (
    <div className={styles.ModelOutputHandler}>
      {isAi && (
        <AILabel size="mini" className={styles.aiLabel}>
          <AILabelContent>
            <div className={styles.info}>
              We collect data whether desired output is generated by AI for the training data quality purposes. This
              label indicates that the content is generated by the given model.
            </div>
          </AILabelContent>
        </AILabel>
      )}
      <button
        className={`${styles.useLLM} ${desiredActionOpen ? styles.open : ''}`}
        onClick={() => setDesiredActionOpen((prev) => !prev)}
      >
        <span>Leverage LLM</span>
        <ChevronUp />
      </button>
      <div className={`${styles.actionRow}  ${!desiredActionOpen ? styles.close : ''}`}>
        <Tag size="sm" type="gray">
          {model}
        </Tag>
        <div>
          {isLoading ? (
            <Button kind="ghost" size="sm" renderIcon={StopFilled} onClick={stop} iconDescription="Stop generation">
              Stop
            </Button>
          ) : (
            <Button kind="ghost" size="sm" onClick={generate}>
              Generate
            </Button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className={styles.completion}>
          <div>{output}</div>
        </div>
      ) : (
        <TextArea
          labelText={'Desired output'}
          hideLabel
          defaultValue={getDefaultValue()}
          rows={minRows ? 18 : undefined}
          onBlur={(e: SyntheticEvent<HTMLTextAreaElement>) => {
            blurHandler(e, 'desired_output');
          }}
          ref={textInputRef}
          onChange={() => {
            updateLabel(DesiredOutputSourceType.HUMAN); //remove ai label
            if (isAi) {
              setIsAi(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default DesiredOutput;
