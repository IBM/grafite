'use client';

import { Checkmark, Close, Copy } from '@carbon/react/icons';
import { TagBaseProps } from '@carbon/react/lib/components/Tag/Tag';
import { useCopyToClipboard } from '@hooks/useCopyToClipboard';
import shortenID from '@utils/shortenID';
import { PropsWithChildren, RefObject, useId, useRef } from 'react';

import styles from './ShortIdTag.module.scss';

export type ShortIdProps = {
  copiable?: boolean;
  dismissible?: boolean;
  onDismiss?: (id: string) => void;
  id?: string | null;
  tooltipLabel?: string;
  size?: TagBaseProps['size'];
  className?: string;
  color?: TagBaseProps['type'];
};

export const ShortIdTag = ({
  id,
  tooltipLabel,
  copiable,
  size,
  dismissible,
  onDismiss,
  className,
  color,
}: ShortIdProps) => {
  const shortenedId = shortenID(id);
  const domId = useId();

  if (!id || !shortenedId) return null;

  const BaseTag = (
    <span title={`${id}${tooltipLabel ? `:\n${tooltipLabel}` : ''}`} className="cds--tag__label" dir="auto">
      {shortenedId}
    </span>
  );

  if (copiable)
    return (
      <CopiableTag copiableContent={id} domId={domId} size={size} className={className}>
        {BaseTag}
      </CopiableTag>
    );

  if (dismissible) {
    return (
      <DismissibleTag id={id} domId={domId} size={size} onDismiss={onDismiss} className={className}>
        {BaseTag}
      </DismissibleTag>
    );
  }

  return (
    <div
      className={`${className} cds--tag ${size === 'sm' ? 'cds--tag--sm cds--layout--size-sm' : ''} ${color && `cds--tag--${color}`} ${size === 'lg' ? 'cds--tag--lg cds--layout--size-lg' : ''}`}
    >
      {BaseTag}
    </div>
  );
};

export const CopiableTag = ({
  domId,
  copiableContent,
  size,
  children,
  className,
  color,
}: PropsWithChildren<Omit<ShortIdProps, 'id'> & { domId: string; copiableContent?: string }>) => {
  const box = useRef<HTMLElement>(null);
  const [copy, status] = useCopyToClipboard(box);

  return (
    <button
      ref={box as RefObject<HTMLButtonElement>}
      className={`cds--tag cds--tag--operational ${styles.operationalTag} cds--tag--blue ${size === 'sm' ? 'cds--tag--sm cds--layout--size-sm' : ''} ${size === 'lg' ? 'cds--tag--lg cds--layout--size-lg' : ''} ${color && `cds--tag--${color}`} ${className}`}
      id={domId}
      type="button"
      title={copiableContent || (children as string)}
      onClick={() => copy(copiableContent || (children as string))}
    >
      <div className="cds--tag__custom-icon">
        {status?.state === 'success' ? <Checkmark /> : status?.state === 'error' ? <Close /> : <Copy />}
      </div>
      <span dir="auto">{children}</span>
    </button>
  );
};

const DismissibleTag = ({
  domId,
  id,
  size,
  children,
  onDismiss,
  className,
  color,
}: PropsWithChildren<ShortIdProps & { domId: string; onDismiss?: (id: string) => void }>) => {
  return (
    <div
      className={`cds--tag cds--tag--filter ${size === 'sm' ? 'cds--tag--sm cds--layout--size-sm' : ''} ${size === 'lg' ? 'cds--tag--lg cds--layout--size-lg' : ''} ${color && `cds--tag--${color}`} ${className}`}
      id={domId}
    >
      <span dir="auto">{children}</span>
      <button
        type="button"
        className="cds--tag__close-icon"
        aria-label="Dismiss tag"
        onClick={() => onDismiss && onDismiss(id!)}
      >
        <Close />
      </button>
    </div>
  );
};
