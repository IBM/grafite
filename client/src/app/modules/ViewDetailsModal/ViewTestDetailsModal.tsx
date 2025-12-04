import { InlineNotification } from '@carbon/react';
import {
  ConnectedModalRenderer,
  ConnectedModalRendererData,
} from '@components/DetailsModalRenderer/ConnectedModalRenderer';
import {
  buildConnectedModalProps,
  dataIsFields,
  DetailsModalRendererData,
  findData,
} from '@components/DetailsModalRenderer/utils';
import { useIsAdmin } from '@hooks/permissionHooks';
import { isTestEditable } from '@modules/ViewDetailsModal/utils';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import { mapTestModalData } from '@utils/mapModalData';
import { useSession } from 'next-auth/react';
import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react';

type ViewTestDetailsModalProps = {
  isModalOpen: boolean;
  setIsModalOpen?: Dispatch<SetStateAction<boolean>>;
  close?: () => void;
  test?: Test;
};

export const ViewTestDetailsModal = ({ isModalOpen, setIsModalOpen, close, test }: ViewTestDetailsModalProps) => {
  const { data } = useSession();

  const isAdmin = useIsAdmin();
  const email = data?.user?.email;

  const [modalData, setModalData] = useState<ConnectedModalRendererData | undefined>(undefined);

  const addModalData = useCallback(
    (data?: DetailsModalRendererData[]) => {
      if (data === undefined) return setModalData(undefined);

      const dataType = !!findData('Resolution', data) ? 'Issue' : !!findData('Author', data) ? 'Test' : 'Feedback';
      if (dataType === 'Test') {
        const author = (() => {
          const targetData = findData('Author', data);
          if (dataIsFields(targetData)) return targetData.content as string;
          return '';
        })();
        const isEditable = isTestEditable(!!isAdmin, email ?? '', author);

        const testId = (() => {
          const targetData = findData('ID', data);
          if (dataIsFields(targetData)) return targetData.content as string;
          return '';
        })();

        const modalProps = buildConnectedModalProps(data, isEditable);
        setModalData({
          ...modalProps,
          primaryLink: isEditable ? `/test?id=${testId}` : undefined,
        });
      } else if (dataType === 'Feedback') {
        const modalProps = buildConnectedModalProps(data);
        setModalData({
          ...modalProps,
        });
      } else {
        const issueId = (() => {
          const targetData = findData('ID', data);
          if (dataIsFields(targetData)) return targetData.content as string;
          return '';
        })();
        const isEditable = !!(issueId && isAdmin);
        const modalProps = buildConnectedModalProps(data, isEditable);

        setModalData({
          ...modalProps,
          primaryLink: isEditable ? `/issue?id=${issueId}` : undefined,
          primaryButtonText: isEditable ? 'Edit issue' : undefined,
        });
      }
    },
    [isAdmin, email],
  );

  useEffect(() => {
    if (test) {
      const modalData = mapTestModalData(test, addModalData);
      addModalData(modalData as DetailsModalRendererData[]);

      if (!test) {
        setModalData((prev: ConnectedModalRendererData | undefined) => ({
          ...prev,
          data: [],
          children: <InlineNotification lowContrast title="Cannot retrieve the test data" kind="error" />,
        }));
      }
    }
  }, [test, addModalData]);

  return (
    <ConnectedModalRenderer
      modalProps={modalData}
      open={isModalOpen}
      close={() => {
        close?.();
        setIsModalOpen?.(false);
      }}
    />
  );
};
