import { ToastNotificationProps } from '@carbon/react';

export type ToastMessageDetail = {
  statusCode: string | number;
  title?: string;
  detail?: string;
};

export const getMsgType = (status: ToastMessageDetail['statusCode']): ToastNotificationProps['kind'] => {
  switch (status) {
    case 'submitted':
    case 200:
      return 'success';
    case 'fetchErrorSettings':
    case 'warning':
      return 'warning';
    default:
      return 'error';
  }
};
export const formatMsgToToast = (msgDetail: ToastMessageDetail) => {
  const type = msgDetail.statusCode;
  const params: { kind: ToastNotificationProps['kind']; title: string; subtitle: string } = {
    kind: getMsgType(type),
    title: '',
    subtitle: '',
  };
  switch (type) {
    case 200:
      params.title = msgDetail.title || '';
      params.subtitle = msgDetail.detail || '';
      break;
    case 204:
      params.title = msgDetail.title || 'No Content';
      params.subtitle = msgDetail.detail || '';
      break;
    case 409:
      params.title = msgDetail.title || 'Conflict';
      params.subtitle = msgDetail.detail || 'An error occured.';
      break;
    case 500:
      params.title = 'Service Unavailable';
      params.subtitle = 'Please check your connection';
      break;
    case 'error':
    default:
      params.title = msgDetail.title || '';
      params.subtitle = msgDetail.detail
        ? msgDetail.detail
        : 'If the issue persists, please contact us via the feedbacks button on the top';
  }
  return params;
};
