import { Button, InlineLoading, ModalProps } from '@carbon/react';
import { ChevronLeft } from '@carbon/react/icons';
import shortenID from '@utils/shortenID';
import { useCallback, useEffect, useMemo, useState } from 'react';

import DetailsModalRenderer from '.';
import styles from './ConnectedModalRenderer.module.scss';
import { Props as DetailsModalRendererProps } from './index';
import { dataIsFields, DetailsModalRendererData, findData, findDataType } from './utils';

export type ConnectedModalRendererData = ModalProps & DetailsModalRendererProps;
interface Props {
  modalProps: ConnectedModalRendererData | undefined;
  close: () => void;
  open: boolean;
}

export const ConnectedModalRenderer = ({ modalProps, open, close }: Props) => {
  const [dataList, setDataList] = useState<ConnectedModalRendererData[]>([]);
  const [isDataLoading, setDataLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const closeLastModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setDataList((prev) => [...prev.slice(0, -1)]);
      setModalOpen(true);
    }, 300);
  };
  const closeAllModal = () => {
    close();
    setTimeout(() => {
      setDataList([]);
    }, 300);
  };

  useEffect(() => {
    if (!modalProps) {
      setDataLoading(true);
      return () => {
        setTimeout(() => setDataLoading(false), 300);
      };
    } else {
      setDataList((prev) => [...prev, modalProps]);
    }
  }, [modalProps]);

  useEffect(() => {
    setModalOpen(open);
  }, [open]);

  return (
    <DetailsModalRenderer
      size="lg"
      {...dataList[dataList.length - 1]}
      headerAction={
        <HeaderAction dataList={dataList} closeLastModal={closeLastModal} hasBreadcrumb={dataList.length > 1} />
      }
      onClose={closeAllModal}
      open={modalOpen}
      className={styles.root}
    >
      {isDataLoading ? (
        <div className={styles.space}>
          <InlineLoading description="Loading data" />
        </div>
      ) : undefined}
    </DetailsModalRenderer>
  );
};

const HeaderAction = ({
  dataList,
  closeLastModal,
  hasBreadcrumb,
}: {
  dataList: ConnectedModalRendererData[];
  closeLastModal: () => void;
  hasBreadcrumb: boolean;
}) => {
  const currentData = useMemo(() => dataList?.[dataList.length - 1]?.data, [dataList]);
  const dataHasComment = currentData ? !!findData('Comments', currentData) : false;

  const getContentId = useCallback((data: DetailsModalRendererData | undefined) => {
    if (dataIsFields(data)) return shortenID(data.content as string);
    return '';
  }, []);
  if (!dataList?.length) return null;

  const prevData = dataList[dataList.length - 2]?.data;
  const prevDataType = hasBreadcrumb && prevData ? findDataType(prevData) : '';
  const prevDataId = hasBreadcrumb && prevData ? getContentId(findData('ID', prevData)) : '';

  if (!currentData) return null;

  return (
    <div className={`${styles.row} ${dataHasComment ? styles.hasComment : ''}`}>
      {hasBreadcrumb && (
        <Button kind="ghost" className={styles.crumbButton} onClick={closeLastModal}>
          <ChevronLeft />{' '}
          <span>
            {prevDataType}: {prevDataId}
          </span>
        </Button>
      )}
    </div>
  );
};
