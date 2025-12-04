'use client';
import ShortIdTag from '@components/ShortIdTag';
import type { ShortIdProps } from '@components/ShortIdTag/ShortIdTag';

import styles from './OperationalIdTag.module.scss';

type OperationalIdTagProps = {
  onClick?: () => void;
  wrapperClassName?: string;
} & Pick<ShortIdProps, 'color' | 'className' | 'size' | 'id'>;

const OperationalIdTag = ({ id, onClick, wrapperClassName, className, color, size }: OperationalIdTagProps) => {
  if (!id) return null;
  return (
    <>
      <button
        className={`cds--tag cds--tag--operational cds--tag--${size} cds--layout--size-${size} ${styles.tagWrapper} ${wrapperClassName}`}
        aria-label={`open ${id}`}
        onClick={() => {
          if (onClick) {
            onClick();
            return;
          }
        }}
      >
        <ShortIdTag
          id={id}
          color={color || 'blue'}
          size={size}
          className={`${styles.tag} cds--tag--operational ${className}`}
        />
      </button>
    </>
  );
};

export default OperationalIdTag;
