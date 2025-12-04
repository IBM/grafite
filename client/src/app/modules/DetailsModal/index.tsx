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
import { getDashboardFeedback } from '@utils/getFunctions/getDashboardFeedbacks';
import { getDashboardIssue } from '@utils/getFunctions/getDashboardIssues';
import { getDashboardTest } from '@utils/getFunctions/getDashboardTests';
import { mapFeedbackModalData, mapIssueModalData, mapTestModalData } from '@utils/mapModalData';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const DetailsModal = ({
  id,
  type,
  closeModal,
}: {
  id: string | undefined;
  type: 'test' | 'issue' | 'feedback' | undefined;
  closeModal: () => void;
}) => {
  const isAdmin = useIsAdmin();
  const { data } = useSession();

  const email = data?.user?.email ?? undefined;

  const [modalData, setModalData] = useState<ConnectedModalRendererData | undefined>(undefined);

  function getData(id: string, type: string) {
    addModalData();
    switch (type) {
      case 'test':
        getDashboardTest(id).then((res) => {
          const modalData = mapTestModalData(res, addModalData) as DetailsModalRendererData[];
          return addModalData(modalData);
        });
        return;
      case 'issue':
        getDashboardIssue(id).then((res) => {
          const modalData = mapIssueModalData(res, addModalData) as DetailsModalRendererData[];
          return addModalData(modalData);
        });
        return;
      case 'feedback':
        getDashboardFeedback(id).then((res) => {
          const modalData = mapFeedbackModalData(res) as DetailsModalRendererData[];
          return addModalData(modalData);
        });
        return;
      default:
        return undefined;
    }
  }

  function addModalData(data?: DetailsModalRendererData[]) {
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
  }

  useEffect(() => {
    if (id && type) setModalData(getData(id, type));
  }, [id]);

  return <ConnectedModalRenderer modalProps={modalData} open={!!id} close={closeModal} />;
};
export default DetailsModal;
