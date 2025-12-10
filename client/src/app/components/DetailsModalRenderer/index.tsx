import {
  Button,
  ComposedModal,
  ComposedModalProps,
  IconButton,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@carbon/react';
import { Chat, Launch } from '@carbon/react/icons';
import { UserComment } from '@types';
import { Fragment, ReactElement, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import Comments from './Comments';
import styles from './DetailsModalRenderer.module.scss';
import ModalItem from './ModalItem';
import { dataIsFields, DetailsModalRendererData, findData, getKey } from './utils';

export interface Props {
  data?: DetailsModalRendererData[];
  modalHeading?: string | ReactElement;
  onClose?: () => void;
  headerAction?: ReactElement;
  primaryLink?: string;
  primaryAction?: () => void;
  primaryButtonText?: string;
  passiveModal?: boolean;
}

const DetailsModalRenderer = ({
  data,
  primaryLink,
  primaryButtonText,
  passiveModal,
  primaryAction,
  onClose,
  modalHeading,
  headerAction,
  ...props
}: ComposedModalProps & Props) => {
  const id = useId();
  const [isClientReady, setClientReady] = useState<boolean>(false);
  const [displayComment, _setDisplayComment] = useState<boolean>(false);

  const comments = useMemo(() => (data ? findData('Comments', data) : undefined), [data]);
  const dataId = data ? (findData('ID', data)?.content as string) : '';

  const headerTags = useMemo(
    () => data?.flat().filter((d: DetailsModalRendererData) => dataIsFields(d) && d.displayedInHeader),
    [data],
  );

  const [commentTotal, _setCommentTotal] = useState<number>(0);
  const setCommentTotal = useCallback((value: number) => {
    _setCommentTotal(value);
  }, []);

  const setDisplayComments = useCallback(() => {
    _setDisplayComment((prev) => !prev);
  }, []);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    _setCommentTotal((comments?.content as UserComment[])?.length);
  }, [comments]);

  return (
    <>
      {isClientReady &&
        createPortal(
          <ComposedModal {...props} preventCloseOnClickOutside>
            <ModalHeader className={styles.header} buttonOnClick={onClose}>
              <div className={styles.row}>
                <h2 className="cds--modal-header__heading">{modalHeading}</h2>
                <ModalHeaderWTags
                  hasComment={!!comments}
                  setDisplayComment={setDisplayComments}
                  commentTotal={commentTotal}
                  displayComment={displayComment}
                  headerTags={headerTags}
                />
              </div>
              {headerAction}
            </ModalHeader>
            <ModalBody>
              {props.children ?? (
                <div className={styles.root}>
                  {!!comments && displayComment && (
                    <div className={styles.commentWrapper}>
                      <Comments
                        comments={comments?.content as UserComment[]}
                        setCommentTotal={setCommentTotal}
                        action={comments?.action as (comment: UserComment) => Promise<string>}
                        dataId={dataId}
                      />
                    </div>
                  )}
                  <div className={styles.contents}>
                    {data?.map((d: DetailsModalRendererData, i: number) => {
                      const key = `${id}-${getKey(d) ?? i}`;

                      return (
                        <Fragment key={key}>
                          <ModalItem rawData={data} index={i} />
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </ModalBody>
            {!passiveModal && (
              <ModalFooter>
                {primaryLink && (
                  <Button
                    href={primaryLink}
                    target="_blank"
                    rel="noreferrer"
                    renderIcon={Launch}
                    iconDescription="open in new tab"
                  >
                    {primaryButtonText}
                  </Button>
                )}
                {primaryAction && <Button onClick={primaryAction}>{primaryButtonText}</Button>}
              </ModalFooter>
            )}
          </ComposedModal>,
          document.body,
        )}
    </>
  );
};

const ModalHeaderWTags = ({
  hasComment,
  setDisplayComment,
  commentTotal,
  displayComment,
  headerTags,
}: {
  hasComment: boolean;
  setDisplayComment: () => void;
  commentTotal: number;
  displayComment: boolean;
  headerTags?: DetailsModalRendererData[];
}) => {
  return (
    <div className={styles.row}>
      {headerTags?.map((tag: DetailsModalRendererData, index: number) => {
        const key = dataIsFields(tag) ? tag.label : index;
        return (
          <Fragment key={`heading-${key}`}>
            <ModalItem rawData={headerTags} index={index} isHeaderItem />
          </Fragment>
        );
      })}
      {!!hasComment && (
        <div className={styles.commentButton}>
          <div className={`${styles.wrapper} ${displayComment ? styles.commentOn : ''}`}>
            <IconButton kind="ghost" label="Comments" align="bottom" onClick={setDisplayComment}>
              <Chat />
            </IconButton>
            <div className={styles.commentCount}>{commentTotal}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailsModalRenderer;
