import { ActionableNotification } from '@carbon/react';
import shortenID from '@utils/shortenID';

export const getEditActionToast = ({
  dataType,
  newValue,
  dataId,
  updateData,
  cancel,
}: {
  dataType: 'issue' | 'test';
  newValue: string;
  dataId: string;
  updateData: ({ newValue, dataId }: { newValue: string; dataId: string }) => void;
  cancel: (id: string) => void;
}) => {
  return (
    <ActionableNotification
      title={`Update ${dataType} #${shortenID(dataId)}`}
      kind="warning"
      subtitle={
        <>
          Are you sure you want to set {dataType} status as <strong>{newValue}</strong>?
        </>
      }
      lowContrast
      aria-label={`Change ${dataType} status`}
      actionButtonLabel="Update"
      onActionButtonClick={() => {
        updateData({ dataId: dataId || '', newValue });
      }}
      onCloseButtonClick={() => cancel(dataId)}
    />
  );
};
