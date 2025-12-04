import { InlineNotification } from '@carbon/react';
import DetailsModalRenderer from '@components/DetailsModalRenderer';
import { Feedback } from '@utils/getFunctions/getDashboardFeedbacks';
import { mapFeedbackModalData } from '@utils/mapModalData';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const FeedbackModal = ({
  feedback,
  open,
  close,
  actionable,
  action,
}: {
  feedback: Feedback | null;
  open: boolean;
  close: () => void;
  actionable?: boolean;
  action?: () => void;
}) => {
  const [clientReady, setClientReady] = useState<boolean>(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  return (
    <>
      {clientReady &&
        createPortal(
          <DetailsModalRenderer
            modalHeading="Feedback detail"
            passiveModal={!actionable}
            primaryButtonText="Use data for the test"
            primaryAction={() => {
              if (action) action();
              close();
            }}
            open={open}
            onClose={close}
            size="lg"
            data={mapFeedbackModalData(feedback) || []}
          >
            {feedback || !open ? undefined : (
              <InlineNotification lowContrast title="Cannot retrieve the feedback data" kind="error" />
            )}
          </DetailsModalRenderer>,
          document.body,
        )}
    </>
  );
};

export default FeedbackModal;
