import { Tag } from '@carbon/react';
import LabelledItem from '@components/LabelledItem';
import OperationalIdTag from '@components/OperationalIdTag';
import ShortIdTag from '@components/ShortIdTag';
import { CopiableTag } from '@components/ShortIdTag/ShortIdTag';
import StatusTag from '@components/StatusTag';
import { Fragment, ReactElement, useId } from 'react';

import styles from './ModalItem.module.scss';
import { dataIsFields, DetailsModalRendererData, getKey } from './utils';

interface Props {
  data: DetailsModalRendererData;
  isHeaderItem?: boolean;
}
const ModalItem = ({ data, isHeaderItem }: Props) => {
  const id = useId();

  if (Array.isArray(data))
    return (
      <div className={styles.row}>
        {data.map((d) => (
          <Fragment key={`${id}-${getKey(d)}`}>
            <ModalItem data={d} />
          </Fragment>
        ))}
      </div>
    );
  if (!dataIsFields(data)) return null;
  if (!isHeaderItem && data.displayedInHeader) return null;

  if (data.renderType === 'divider') return <hr className={styles.divider} />;

  const hasProp = (name: string) => !!renderProps?.includes(name);

  const returnWStyle = (content: ReactElement) =>
    data.span ? <div style={{ flex: data.span }}>{content}</div> : content;

  const returnWithLabel = (label: string, content: ReactElement | string, copiable?: boolean) =>
    isHeaderItem
      ? content
      : returnWStyle(
          <LabelledItem
            id={id}
            label={label}
            copiable={copiable}
            previewMarkdown={hasProp('previewMarkdown')}
            formatMarkdown={hasProp('formatMarkdown')}
            expandable={hasProp('expandable')}
            narrow={hasProp('narrow')}
          >
            {content}
          </LabelledItem>,
        );

  const { label, renderType, renderProps, action } = data;

  const isCopiable = !!renderProps?.includes('copiable');
  const isContentString = typeof data.content === 'string' || typeof data.content === 'number';

  const content = isContentString ? `${data.content}` : (data.content as ReactElement);

  if (!isContentString && !data.label) return returnWStyle(data.content as ReactElement);

  if (renderType === 'idTag') {
    if (!isContentString) return null;
    return returnWithLabel(
      label ?? '',
      action ? (
        <OperationalIdTag
          id={content as string}
          onClick={() => {
            action(content);
          }}
        />
      ) : data.renderProps?.includes('fullId') ? (
        <CopiableTag className={styles.tagWoBackground} domId={`id-copiable-${content}`}>
          {content}
        </CopiableTag>
      ) : (
        <ShortIdTag copiable={isCopiable} id={content as string} className={styles.idTag} />
      ),
    );
  }

  if (renderType === 'tag' || renderType === 'statusTag') {
    if (!isContentString) return null;
    const isStatusTag = renderType === 'statusTag';
    const Component = isStatusTag ? StatusTag : Tag;
    return returnWithLabel(
      label ?? '',
      <Component {...(isStatusTag ? {} : { type: 'cool-gray' })} className={styles.tag}>
        {content}
      </Component>,
    );
  }

  if (renderType === 'tagList' || renderType === 'idTagList') {
    if (!content || !Array.isArray(content)) return null;
    return returnWithLabel(
      label ?? '',
      !!content.length ? (
        <div aria-labelledby={id} className={styles.tagList}>
          {content.map((d: string | ReactElement) => {
            //issue - sources
            if (typeof d !== 'string') return d;

            if (renderType !== 'tagList') {
              return action ? (
                <OperationalIdTag
                  key={d}
                  id={d}
                  onClick={() => {
                    action(d);
                  }}
                />
              ) : (
                <ShortIdTag key={d} id={d} />
              );
            } else
              return (
                <Tag type="cool-gray" key={d}>
                  {d}
                </Tag>
              );
          })}
        </div>
      ) : (
        ''
      ),
    );
  }

  return returnWithLabel(label ?? '', content ?? '', isCopiable);
};

export default ModalItem;
