import { MutableRefObject, SyntheticEvent, useRef, useState } from 'react';
import { Button, TextArea, Tag } from '@carbon/react';
import { StopFilled } from '@carbon/react/icons';
import styles from '../new-test.module.scss';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { DEFAULT_PARAM } from '@utils/constants';

const FlaggedOutput = ({
  blurHandler,
  defaultValue,
  promptRef,
  stale,
  staleHandler,
}: {
  blurHandler: (e: SyntheticEvent<HTMLTextAreaElement>, label: string) => void;
  defaultValue: string;
  promptRef: MutableRefObject<HTMLTextAreaElement | null>;
  stale?: boolean;
  staleHandler?: () => void;
}) => {
  return (
    <GenerationHandler
      blurHandler={blurHandler}
      defaultValue={defaultValue}
      promptRef={promptRef}
      stale={stale}
      staleHandler={staleHandler}
    />
  );
};

const GenerationHandler = ({
  blurHandler,
  defaultValue,
  promptRef,
  stale,
  staleHandler,
}: {
  blurHandler: (e: SyntheticEvent<HTMLTextAreaElement>, label: string) => void;
  defaultValue: string;
  promptRef: MutableRefObject<HTMLTextAreaElement | null>;
  isDesiredOutput?: boolean;
  stale?: boolean;
  staleHandler?: () => void;
}) => {
  const { addToastMsg } = useToastMessageContext();
  // const { isWxModel } = useWxModelContext()
  const [isLoading, setLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');

  const textInputRef = useRef<HTMLTextAreaElement | null>(null);
  const aborter = useRef<AbortController | null>(null);

  const inputId = 'input_model_output';
  const inputLabel = 'Model response';
  const model = process.env.NEXT_PUBLIC_TEST_DEFAULT_MODEL || '';
  const testModelDisplay = (process.env.NEXT_PUBLIC_TEST_DEFAULT_MODEL_DISPLAY || '').split('/').pop();

  // Update the value of textarea
  const updateInputVal = (completion: string) => {
    const textarea = textInputRef.current;
    if (textarea) {
      textarea.value = completion;
      textarea.focus();
    }
  };

  const generate = () => {
    if (staleHandler) staleHandler();
    const prompt = promptRef?.current?.value || '';
    generateFreeform(prompt);
  };

  const stop = () => {
    aborter.current?.abort();
    afterAll(output);
  };

  const afterAll = (generatedChunk: string) => {
    setLoading(false);
    setTimeout(() => updateInputVal(generatedChunk), 10);
  };

  const generateFreeform = async (prompt: string) => {
    setLoading(true);
    setOutput('');

    const reqBody = {
      stream: true,
      model: model,
      options: {
        ...DEFAULT_PARAM,
      },
      prompt,
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

  return (
    <div className={styles.ModelOutputHandler}>
      <div className={`${styles.row} ${styles.actionRow}`}>
        <Tag size="sm" type="gray">
          {testModelDisplay}
        </Tag>
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
      {isLoading ? (
        <div className={styles.completion}>
          <div>{output}</div>
        </div>
      ) : (
        <TextArea
          className={stale ? styles.stale : ''}
          id={inputId}
          labelText={inputLabel}
          hideLabel
          defaultValue={output ? output : defaultValue}
          rows={18}
          onBlur={(e: SyntheticEvent<HTMLTextAreaElement>) => {
            blurHandler(e, 'model_output');
          }}
          ref={textInputRef}
          helperText={stale ? 'The output might not be generated from the current prompt' : ''}
        />
      )}
    </div>
  );
};
export default FlaggedOutput;
