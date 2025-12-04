import { type Message } from '@types';
import { Button, Tag } from '@carbon/react';
import { SettingsEdit } from '@carbon/react/icons';
import { Test } from '@utils/getFunctions/getDashboardTests';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { useTestDataContext } from '../TestDataContext';
import styles from './Chat.module.scss';
import MessageArea from './MessageArea';
import SystemPromptModal from './SystemPromptModal';

export type ChatTestSchema = {
  messages: Message[];
  sampleOutput: string;
};

const buildMessageList = (chatData: RefObject<ChatTestSchema>) => {
  let prompt: Message[] = [];
  if (chatData.current?.messages) {
    prompt = [...chatData.current.messages];
  }
  if (chatData.current?.sampleOutput) {
    prompt.push({ role: 'assistant', content: chatData.current.sampleOutput } as Message);
  }

  return prompt;
};

const Chat = ({ chatData }: { chatData: RefObject<ChatTestSchema> }) => {
  const { updateTest } = useTestDataContext();
  const [messages, setMessages] = useState<Message[]>(buildMessageList(chatData));
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const model = (process.env.NEXT_PUBLIC_TEST_DEFAULT_MODEL_DISPLAY || '').split('/').pop();

  const updateData = useCallback(
    (value: string | Message[], label: string) => {
      //@ts-expect-error handling multiple types at once
      if (chatData.current) chatData.current[label as keyof ChatTestSchema] = value;
      updateTest(label as keyof Test, value);
    },
    [updateTest, chatData],
  );

  const updateSystemPrompt = (value: string) => {
    const isSystemExist = messages[0]?.role === 'system';
    const inputs = isSystemExist ? messages.slice(1) : messages;

    if (typeof value === 'string') {
      setMessages(() => [{ role: 'system', content: value } as Message, ...inputs]);
    } else setMessages(() => [...inputs]); //remove custom system prompt if empty value is given
  };

  useEffect(() => {
    //update test context when messages change
    const lastMessage = messages[messages.length - 1];
    const isLastMsgsModel = lastMessage?.role === 'assistant';

    const promptText = isLastMsgsModel ? messages.slice(0, -1) : messages;
    const sampleOutput = isLastMsgsModel ? lastMessage.content : '';

    updateData(promptText, 'messages');
    updateData(sampleOutput, 'sampleOutput');
  }, [messages, updateData]);

  useEffect(() => {
    if (chatData.current?.messages) {
      const messages = [...chatData.current?.messages];
      if (chatData.current.sampleOutput)
        messages.push({ role: 'assistant', content: chatData.current.sampleOutput } as Message);
      setMessages(() => [...messages]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={styles.wrapper}>
      <div className={styles.inferenceArea}>
        <div className={styles.chatBox}>
          <div className={styles.actions}>
            <Tag size="md" className={styles.modelTag}>
              {model}
            </Tag>
            <div className={styles.maxWidthWrapper}>
              <div>
                <Button
                  kind="ghost"
                  hasIconOnly
                  renderIcon={SettingsEdit}
                  iconDescription="Custom system prompt"
                  size="sm"
                  tooltipAlignment="end"
                  tooltipPosition="bottom"
                  onClick={() => setModalOpen(true)}
                />
              </div>
            </div>
          </div>
          <MessageArea
            updateData={updateData}
            inputRef={inputRef}
            pageLoading={false}
            messages={messages}
            setMessages={setMessages}
          />
        </div>
      </div>
      <SystemPromptModal
        open={isModalOpen}
        close={() => {
          setModalOpen(false);
        }}
        isEditable={!messages.filter((d) => d.role !== 'system').length}
        defaultValue={messages.find((d) => d.role === 'system')?.content || ''}
        updateSystemPrompt={updateSystemPrompt}
      />
    </section>
  );
};

export default Chat;
