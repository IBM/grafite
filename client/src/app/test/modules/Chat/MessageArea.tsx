import { useState, KeyboardEvent, useRef, useEffect, RefObject, SyntheticEvent, Dispatch, SetStateAction } from 'react';
import { v1 as uuidv1 } from 'uuid';
import { useSession } from 'next-auth/react';
import { type Message } from '@types';
import styles from './Chat.module.scss';
import TextareaAutosize from 'react-textarea-autosize';
import { Button } from '@carbon/react';
import { Close, Erase, Send, StopFilled } from '@carbon/react/icons';
import { BotMessage, UserMessage } from './MessageBubble';
import DesiredOutput from '../DesiredOutput';
import { DEFAULT_PARAM } from '@utils/constants';
import { useToastMessageContext } from '@components/ToastMessageContext';
import GenerationLoading from '@components/GenerationLoading';
import LabelledItem from '@components/LabelledItem';
import { DesiredOutputSourceType } from '@api/dashboard/tests/utils';
import { useTestDataContext } from '../TestDataContext';
import { Session } from 'next-auth';

const MessageArea = ({
  inputRef,
  pageLoading,
  messages,
  updateData,
  setMessages,
}: {
  updateData: (value: string | Message[], label: string) => void;
  inputRef: RefObject<HTMLTextAreaElement>;
  pageLoading: boolean;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
}) => {
  const { addToastMsg } = useToastMessageContext();
  const snapperRef = useRef<HTMLSpanElement>(null);
  const curkey = useRef<string | null>(null);
  const aborter = useRef<AbortController | null>(null);

  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const testModel = process.env.NEXT_PUBLIC_TEST_DEFAULT_MODEL || '';

  //handlers to control enter + shift / enter
  const keyDownHandler = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && curkey.current !== 'Shift') {
      e.preventDefault(); //prevent adding new line to the sent prompt
    }

    if (e.code.includes('Shift')) curkey.current = 'Shift';
  };

  const keyUpHandler = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.code === 'Enter' && curkey.current !== 'Shift') {
      submit();
    }
    if (e.code.includes('Shift')) curkey.current = null;
    return;
  };

  const submit = () => {
    const inputBox = inputRef.current;
    if (inputBox) {
      const value = inputBox.value;
      inputBox.value = '';
      if (!value) inputBox.focus();
      else generate(value);
    } else addToastMsg('error', 'Please refresh', 'Something went wrong');
  };

  const stop = () => {
    aborter.current?.abort();
  };

  const regenerate = (index: number) => {
    const userIdx = index - 1;
    const message = messages[userIdx];
    generate(message!.content, userIdx);
  };

  const clearInput = () => {
    const inputBox = inputRef.current;
    if (inputBox) {
      inputBox.value = '';
      inputBox.focus();
    }
  };

  const clearAll = () => {
    setMessages((prev) => (prev[0]?.role === 'system' ? prev.slice(0, 1) : []));
    clearInput();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const afterAll = (generatedChunk: string) => {
    const id = uuidv1();

    setMessages((prev) => [...prev, { content: generatedChunk, role: 'assistant', id } as Message]);

    setIsLoading(false);
    setOutput('');
  };

  const generate = async (message: string, sliceIdx?: number) => {
    setIsLoading(true);
    const msgSlice = sliceIdx !== undefined ? messages.slice(0, sliceIdx) : messages;
    const newMessage = [...msgSlice, { role: 'user', content: message }];
    setMessages(newMessage as Message[]);

    const reqBody = {
      stream: true,
      model: testModel,
      options: {
        ...DEFAULT_PARAM,
      },
      messages: newMessage,
      // stop: modelsAll?.find((d) => d.name === selectedModel)?.stop_str,
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
      if (`${err}`.includes('AbortError')) {
        afterAll(generatedChunk);
      } else {
        setOutput('');
        const res = await fetch(`${process.env.NEXT_PUBLIC_OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessage,
            model: testModel,
            options: {
              ...DEFAULT_PARAM,
            },
            stream: false,
          }),
        });

        if (!res.ok) {
          addToastMsg(res.status || 500, res.statusText, 'Failed to generate');
          setIsLoading(false);
          return;
        }

        const data: { message: { content: string } } = await res.json();

        setMessages((prev) => [...prev, { role: 'assistant', content: data.message.content } as Message]);
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <MessageList
        messages={pageLoading ? [] : messages}
        isLoading={isLoading}
        output={output}
        snapperRef={snapperRef}
        regenerate={regenerate}
        updateData={updateData}
      />
      <div className={styles.gradient} />
      <div className={styles.inputArea}>
        <div className={styles.input}>
          <Button
            kind="ghost"
            hasIconOnly
            renderIcon={Erase}
            iconDescription="Delete all"
            size="md"
            tooltipAlignment="start"
            onClick={clearAll}
          />
          <div className={styles.inputWrapper}>
            <TextareaAutosize
              ref={inputRef}
              autoFocus={true}
              minRows={1}
              onKeyDown={keyDownHandler}
              onKeyUp={keyUpHandler}
              placeholder="Start your conversation..."
              id="text-area-input"
              className={styles.promptInput}
              disabled={isLoading}
            />
            <Button
              kind="ghost"
              hasIconOnly
              renderIcon={Close}
              iconDescription="Erase"
              size="md"
              onClick={clearInput}
            />
          </div>
          {isLoading ? (
            <Button kind="ghost" hasIconOnly renderIcon={StopFilled} iconDescription="Stop" size="md" onClick={stop} />
          ) : (
            <Button
              kind="ghost"
              hasIconOnly
              renderIcon={Send}
              iconDescription="Send"
              size="md"
              onClick={submit}
              tooltipAlignment="end"
            />
          )}
        </div>
      </div>
    </>
  );
};

const MessageList = ({
  messages,
  isLoading,
  output,
  snapperRef,
  regenerate,
  updateData,
}: {
  messages: Message[];
  isLoading: boolean;
  output: string | null;
  snapperRef: RefObject<HTMLSpanElement>;
  regenerate: (index: number) => void;
  updateData: (value: string | Message[], label: string) => void;
}) => {
  const { data } = useSession();
  const { testInfo, updateTest } = useTestDataContext();
  const userName = ((data: Session | null) => {
    const userData = data?.user?.name;
    if (userData) {
      const userNameParts = userData.split(' ');
      if (userNameParts.length > 1) {
        return userNameParts[0][0] + userNameParts?.pop()?.[0] || '';
      }
      return userData.slice(0, 2);
    } else return 'AU'; // anonymous user?
  })(data);

  const [viewDesiredOutput, setViewDesiredOutput] = useState<boolean>(true);
  const botMsgHeightRef = useRef<number>(0);

  const scrollToBottom = () => {
    const wrapper = snapperRef.current?.parentNode?.parentNode as HTMLDivElement;
    if (wrapper) {
      wrapper.scroll({ top: wrapper.scrollHeight });
    }
  };

  const toggleDesiredOutput = () => {
    setViewDesiredOutput((prev) => !prev);
    setTimeout(() => scrollToBottom(), 10);
  };

  useEffect(() => {
    if (output !== null) {
      const wrapper = snapperRef.current?.parentNode?.parentNode as HTMLDivElement;
      const lastMsg = snapperRef.current?.previousSibling as HTMLDivElement;

      //run it only when bot message height changes
      if (wrapper && lastMsg && lastMsg.clientHeight !== botMsgHeightRef.current) {
        if (wrapper.scrollHeight - wrapper.scrollTop > Math.min(wrapper.clientHeight / 2, lastMsg.clientHeight)) {
          wrapper.scroll({ top: wrapper.scrollHeight });
          botMsgHeightRef.current = lastMsg.clientHeight;
        } else {
          botMsgHeightRef.current = 0;
        }
      }
    }
  }, [output]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  return (
    <div className={styles.messages}>
      <div className={styles.overflowWrapper}>
        {messages
          .map((message: Message, idx: number) => ({ ...message, id: `${idx}` }))
          .filter((d) => d.role !== 'system')
          .map((message: Message, idx: number, arr: Message[]) => {
            // while generating, flag the last assistant message except the generating one
            const flagged = isLoading
              ? arr.slice(0, -1).findLastIndex((d) => d.role === 'assistant') === idx
              : arr.length - 1 === idx && message.role === 'assistant';

            return (
              <div
                key={`message_${idx}`}
                className={`${styles.messageWrapper} ${flagged && viewDesiredOutput ? styles.wide : ''} ${flagged ? styles.flagged : ''}`}
              >
                {message.role === 'user' && <UserMessage message={message} userName={userName} />}
                {message.role === 'assistant' && (
                  <BotMessage
                    message={message}
                    flagged={flagged}
                    toggleDesiredOutput={toggleDesiredOutput}
                    viewDesiredOutput={viewDesiredOutput}
                    regenerate={() => regenerate(Number(message.id))}
                  />
                )}
                {flagged && (
                  <div
                    className={`${styles.desired} ${!viewDesiredOutput ? styles.hidden : ''} ${isLoading ? styles.invisible : ''}`}
                  >
                    <LabelledItem id="desired-output" label="Desired output">
                      <DesiredOutput
                        blurHandler={(e: SyntheticEvent<HTMLTextAreaElement>) =>
                          updateData((e.target as HTMLTextAreaElement)?.value || '', 'desiredOutput')
                        }
                        messages={messages}
                        defaultValue={testInfo.desiredOutput ?? ''}
                        defaultLabel={testInfo.desiredOutputSource as DesiredOutputSourceType}
                        updateLabel={(value: DesiredOutputSourceType) => {
                          updateTest('desiredOutputSource', value);
                        }}
                      />
                    </LabelledItem>
                  </div>
                )}
              </div>
            );
          })}
        {isLoading && (
          <div className={styles.messageWrapper}>
            <div>
              {!!output ? (
                <BotMessage message={{ role: 'assistant', content: output }} />
              ) : (
                <>
                  <BotMessage
                    message={{
                      role: 'assistant',
                      content: '',
                    }}
                  />
                  <div className={styles.loaderWrapper}>
                    <GenerationLoading />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <span ref={snapperRef} className={styles.scrollSnapper} />
      </div>
    </div>
  );
};

export default MessageArea;
