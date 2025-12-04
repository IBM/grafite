import { ToastNotification } from '@carbon/react';
import { createContext, Fragment, ReactElement, useCallback, useContext, useState } from 'react';
import { v1 as uuidv1 } from 'uuid';

import styles from './ToastMessageContext.module.scss';
import { formatMsgToToast, ToastMessageDetail } from './utils';

type ToastMessageContextProps = {
  addToastMsg: (newCode: string | number, detail?: string, title?: string) => void;
  addToastComponent: (toast: ReactElement, id?: string) => void;
  removeToastfromQueue: (id: string) => void;
  toastMessages?: { id: string; component: ReactElement }[];
};

const ToastMessageContext = createContext<ToastMessageContextProps>({
  addToastMsg: (_newCode: string | number, _detail?: string, _title?: string) => {},
  addToastComponent: (_toast: ReactElement, _id?: string) => {},
  removeToastfromQueue: (_id: string) => {},
  toastMessages: [],
});

export const useToastMessageContext = () => useContext(ToastMessageContext);

const ToastMessageContextProvider = ({ children }: { children: ReactElement }) => {
  const [toastMessages, setToastMessages] = useState<{ id: string; component: ReactElement }[]>([]);

  const addToastMsg = useCallback((newCode: string | number, detail?: string, title?: string): void => {
    const id = uuidv1();
    const newMsg: ToastMessageDetail = { statusCode: newCode };
    if (detail) newMsg.detail = detail;
    if (title) newMsg.title = title;
    const params = formatMsgToToast(newMsg);

    const component = <ToastNotification {...params} hideCloseButton role="status" timeout={5000} lowContrast />;
    setToastMessages((prev) => [...prev, { id, component }]);
  }, []);

  const addToastComponent = useCallback((toast: ReactElement, id?: string) => {
    const uniqueID = id ?? uuidv1();
    setToastMessages((prev) => [...prev, { id: uniqueID, component: toast }]);
  }, []);

  const removeToastfromQueue = useCallback((id: string) => {
    setToastMessages((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return (
    <ToastMessageContext.Provider value={{ addToastMsg, addToastComponent, removeToastfromQueue, toastMessages }}>
      {children}
      <section className={styles.root}>
        {toastMessages.map(({ id, component }) => (
          <Fragment key={`toast_${id}`}>{component}</Fragment>
        ))}
      </section>
    </ToastMessageContext.Provider>
  );
};

export default ToastMessageContextProvider;
