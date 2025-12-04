import { useState } from 'react';
import styles from './Chat.module.scss';
import { Button } from '@carbon/react';
import MarkdownBox from '@components/MarkdownBox';
import { FlagFilled, PaintBrush, Raw, Repeat, View, ViewOff } from '@carbon/react/icons';
import { DefinitionTooltip } from '@carbon/react';

const UserIcon = ({ name }: { name: string }) => {
  return (
    <div className={styles.userIcon}>
      <span>{name}</span>
    </div>
  );
};

const UserMessage = ({ message, userName }: { message: { role: string; content: string }; userName: string }) => {
  const { role, content } = message;
  const [isMarkdown, setMarkdown] = useState<boolean>(true);

  return (
    <div className={styles.message}>
      <div className={styles.icon}>{role === 'user' && <UserIcon name={userName} />}</div>
      <div>
        <div className={styles.role}>
          <div>
            <label>
              {role[0].toUpperCase()}
              {role.substring(1)}
            </label>
          </div>

          <div className={styles.msgActions}>
            {isMarkdown ? (
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Raw}
                iconDescription="Remove formatting"
                hasIconOnly
                tooltipAlignment="end"
                onClick={() => setMarkdown(false)}
              />
            ) : (
              <Button
                kind="ghost"
                size="sm"
                renderIcon={PaintBrush}
                iconDescription="Apply formatting"
                hasIconOnly
                tooltipAlignment="end"
                onClick={() => setMarkdown(true)}
              />
            )}
          </div>
        </div>
        {isMarkdown ? <MarkdownBox>{content}</MarkdownBox> : <div className={styles.messageBody}>{content}</div>}
      </div>
    </div>
  );
};

const BotMessage = ({
  message,
  flagged,
  viewDesiredOutput,
  toggleDesiredOutput,
  regenerate,
}: {
  message: { role: string; content: string };
  flagged?: boolean;
  viewDesiredOutput?: boolean;
  toggleDesiredOutput?: () => void;
  regenerate?: () => void;
}) => {
  const testModelDisplay = (process.env.NEXT_PUBLIC_TEST_DEFAULT_MODEL_DISPLAY || '').split('/').pop();
  const { content } = message;
  const [isMarkdown, setMarkdown] = useState<boolean>(true);

  return (
    <div className={styles.message}>
      <div className={styles.icon}>
        <div className={styles.modelIcon}>
          <span>{testModelDisplay ? testModelDisplay[0].toUpperCase() : 'AI'}</span>
        </div>
      </div>
      <div>
        <div className={styles.role}>
          <div>
            <label>{testModelDisplay}</label>
            {flagged && (
              <DefinitionTooltip className={styles.flaggedLabel} align="top" definition="Model response" openOnHover>
                <FlagFilled size={14} />
              </DefinitionTooltip>
            )}
          </div>
          <div className={styles.msgActions}>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Repeat}
              hasIconOnly
              iconDescription="Regenerate"
              tooltipAlignment="end"
              onClick={regenerate}
            />
            {isMarkdown ? (
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Raw}
                iconDescription="Remove formatting"
                hasIconOnly
                tooltipAlignment="end"
                onClick={() => setMarkdown(false)}
              />
            ) : (
              <Button
                kind="ghost"
                size="sm"
                renderIcon={PaintBrush}
                iconDescription="Apply formatting"
                hasIconOnly
                tooltipAlignment="end"
                onClick={() => setMarkdown(true)}
              />
            )}

            {flagged && !!toggleDesiredOutput && (
              <>
                {viewDesiredOutput ? (
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={ViewOff}
                    iconDescription="Hide desired output"
                    hasIconOnly
                    tooltipAlignment="end"
                    onClick={toggleDesiredOutput}
                  />
                ) : (
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={View}
                    iconDescription="Display desired output"
                    hasIconOnly
                    tooltipAlignment="end"
                    onClick={toggleDesiredOutput}
                  />
                )}
              </>
            )}
          </div>
        </div>
        {isMarkdown ? <MarkdownBox>{content}</MarkdownBox> : <div className={styles.messageBody}>{content}</div>}
      </div>
    </div>
  );
};

export { BotMessage, UserMessage };
