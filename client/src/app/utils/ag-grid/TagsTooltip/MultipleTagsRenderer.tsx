import { DismissibleTag, Tag } from '@carbon/react';
import OperationalIdTag from '@components/OperationalIdTag';
import ShortIdTag from '@components/ShortIdTag';
import gridStyles from '@utils/ag-grid/ag-grid.module.scss';
import { Fragment, useId } from 'react';

export const MultipleTagsRenderer = ({
  values,
  onDelete = () => {},
  deleteBtn = false,
  isId = false,
  kind,
  selectId,
}: {
  values?: string[] | null;
  deleteBtn?: boolean;
  onDelete?: (val: string) => void;
  isId?: boolean;
  kind?: 'test' | 'feedback';
  selectId?: (id: string) => void;
}) => {
  const domId = useId();

  return (
    <>
      {values?.map((val) => {
        if (isId)
          return (
            <Fragment key={`${domId}-${val}`}>
              {!kind ? (
                <ShortIdTag
                  id={val}
                  className={gridStyles.tag}
                  dismissible={deleteBtn}
                  size="sm"
                  onDismiss={() => onDelete(val)}
                />
              ) : (
                <OperationalIdTag
                  id={val}
                  wrapperClassName={gridStyles.tag}
                  size="sm"
                  onClick={() => {
                    selectId?.(val);
                  }}
                />
              )}
            </Fragment>
          );

        if (deleteBtn)
          return (
            <DismissibleTag
              size="md"
              color="cool-gray"
              className={gridStyles.tag}
              text={val}
              key={`${domId}-${val}`}
              onClose={() => onDelete(val)}
            />
          );

        return (
          <Tag key={`${domId}-${val}`} size="sm" type="cool-gray" className={gridStyles.tag}>
            {val}
          </Tag>
        );
      })}
    </>
  );
};
