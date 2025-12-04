import { ModalSize } from '@carbon/react/lib/components/Modal/Modal';
import { Message, UserComment } from '@types';
import { ReactElement } from 'react';
import { v1 as uuid } from 'uuid';

export enum FieldRenderType {
  IDTAG = 'idTag',
  TAG = 'tag',
  STATUSTAG = 'statusTag',
  TAGLIST = 'tagList',
  DIVIDER = 'divider',
}

export type Fields = {
  label?: string;
  content?: string | number | ReactElement | string[] | Message[] | UserComment[] | null;
  renderType?: FieldRenderType;
  renderProps?: string[];
  action?: (param: unknown) => void;
  span?: number;
  displayedInHeader?: boolean;
  isPromptElement?: boolean;
};
export type DetailsModalData = Fields | ReactElement;
export type DetailsModalRendererData = DetailsModalData | DetailsModalData[];

export const dataIsFields = (data: unknown): data is Fields => {
  const dataIsObj = typeof data === 'object';
  if (!data || !dataIsObj) return false;

  const keys = Object.keys(data as object);
  return keys.includes('content') || keys.includes('renderType');
};

export const getKey = (data: DetailsModalRendererData | DetailsModalRendererData[]): string | undefined => {
  if (Array.isArray(data)) return getKey(data[0]);
  return uuid();
};

export const findData = (label: string, data: DetailsModalRendererData[]): Fields =>
  data?.flat().find((d) => dataIsFields(d) && d.label === label) as Fields;

export const findDataType = (data: DetailsModalRendererData[]) =>
  !!findData('Resolution', data) ? 'Issue' : !!findData('Author', data) ? 'Test' : 'Feedback';

export const buildConnectedModalProps = (data: DetailsModalRendererData[], isEditable?: boolean) => {
  const dataType = !!findData('Resolution', data) ? 'Issue' : !!findData('Author', data) ? 'Test' : 'Feedback';
  if (dataType === 'Test') {
    return {
      data: data,
      size: 'lg' as ModalSize,
      modalHeading: `${dataType} detail`,
      passiveModal: !isEditable,
      primaryButtonText: isEditable ? 'Edit test' : undefined,
    };
  } else if (dataType === 'Feedback') {
    return {
      data: data,
      size: 'lg' as ModalSize,
      modalHeading: `${dataType} detail`,
      passiveModal: true,
    };
  } else {
    return {
      data: data,
      size: 'lg' as ModalSize,
      modalHeading: `${dataType} detail`,
      passiveModal: !isEditable,
      primaryButtonText: isEditable ? 'Edit issue' : undefined,
    };
  }
};
