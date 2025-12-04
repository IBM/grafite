import { createContext, ReactElement, useCallback, useContext, useEffect, useState } from 'react';

import { useToastMessageContext } from '@components/ToastMessageContext';
import { getDashboardFeedbacks, type Feedback } from '@utils/getFunctions/getDashboardFeedbacks';

type FeedbackContextType = {
  feedbacks: Feedback[] | null;
  updateFeedbacks: (feedbacks: Feedback[]) => void;
  reset: () => void;
  fetchFeedbacks: () => void;
};

const FeedbackContext = createContext<FeedbackContextType>({
  feedbacks: null,
  updateFeedbacks: (_feedbacks: Feedback[]) => {},
  reset: () => {},
  fetchFeedbacks: () => {},
});

export const useFeedbackContext = () => useContext(FeedbackContext);

export const FeedbackContextProvider = ({ children }: { children: ReactElement }) => {
  const { addToastMsg } = useToastMessageContext();
  const [feedbacks, setFeedbacks] = useState<Feedback[] | null>(null);

  const updateFeedbacks = (Feedbacks: Feedback[]) => {
    setFeedbacks(Feedbacks);
  };

  const reset = () => {
    setFeedbacks(null);
  };

  const fetchFeedbacks = useCallback(() => {
    setFeedbacks(null);
    getDashboardFeedbacks()
      .then((Feedbacks) => {
        setFeedbacks(Feedbacks);
      })
      .catch((e) => {
        console.error(e);
        addToastMsg('error', e.toString(), 'Failed to fetch feedbacks');
      });
  }, [getDashboardFeedbacks, addToastMsg]);

  useEffect(() => {
    fetchFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FeedbackContext.Provider value={{ feedbacks, updateFeedbacks, reset, fetchFeedbacks }}>
      {children}
    </FeedbackContext.Provider>
  );
};
