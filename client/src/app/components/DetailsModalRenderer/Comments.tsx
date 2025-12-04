import { IconButton, InlineLoading } from '@carbon/react';
import { Send } from '@carbon/react/icons';
import Comment from '@components/Comment';
import { APICallError, UserComment } from '@types';
import { useSession } from 'next-auth/react';
import { FormEvent, Fragment, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import styles from './Comments.module.scss';

interface Props {
  comments: UserComment[];
  setCommentTotal?: (value: number) => void;
  action?: (comment: UserComment) => Promise<string>;
  dataId: string | undefined;
}
const Comments = ({ comments, setCommentTotal, action, dataId }: Props) => {
  const { data } = useSession();
  const userEmail = data?.user?.email;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const placeholder = !action ? 'Not supported for this data' : 'Leave a comment';
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = inputRef.current?.value;
    if (!input) {
      setErrorMsg('Comment cannot be empty');
      return;
    }

    if (dataId && userEmail && action) {
      const created_time = new Date().toISOString();

      const newValue = {
        text: input,
        created_time,
        last_updated_time: null,
        author: userEmail,
      };

      setIsLoading(true);
      action(newValue)
        .then(() => {
          comments.push(newValue);
          if (setCommentTotal) setCommentTotal(comments.length);
          if (inputRef.current) inputRef.current.value = '';
        })
        .catch((err: APICallError) => {
          console.error(err);
          setErrorMsg('Failed to post comment. Please try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setErrorMsg('Something went wrong. Please refresh the page.');
    }
  };

  return (
    <>
      <div className={styles.root}>
        <h3>Comments</h3>
        <div className={styles.contents}>
          {!comments.length && <span className={styles.empty}>No comment</span>}
          {comments.map((c) => (
            <Fragment key={c.created_time}>
              <Comment comment={c} textSize="md" />
            </Fragment>
          ))}
        </div>
        <form className={styles.input} onSubmit={submit}>
          <TextareaAutosize
            ref={inputRef}
            autoFocus={false}
            minRows={1}
            placeholder={placeholder}
            id="text-area-input"
            className={styles.input}
            disabled={!action || isLoading}
            onClick={() => {
              setErrorMsg(null);
            }}
          />
          <div className={styles.sendButton}>
            {isLoading ? (
              <div className={styles.inlineLoading}>
                <InlineLoading className={styles.inlineLoading} />
              </div>
            ) : (
              <IconButton kind="ghost" size="md" label="Send" type="submit" disabled={!action || isLoading}>
                <Send />
              </IconButton>
            )}
          </div>
          {errorMsg && <span className={styles.errorMsg}>{errorMsg}</span>}
        </form>
      </div>
    </>
  );
};

export default Comments;
