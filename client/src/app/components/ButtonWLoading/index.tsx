import React from 'react';
import { Button, Loading } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import styles from './ButtonWLoading.module.scss';

const buttonLoading = () => {
  return <Loading small withOverlay={false} className={`${styles.btnLoading} cds--btn__icon`} />;
};

const ButtonWLoading: React.FC<{
  isLoading: boolean;
  children: string | React.ReactNode;
}> = ({ isLoading, children, ...args }) => {
  return (
    <Button
      {...args}
      renderIcon={isLoading ? buttonLoading : ArrowRight}
      className={isLoading ? styles.btnLoading : undefined}
      disabled={isLoading}
    >
      {children}
    </Button>
  );
};

export default ButtonWLoading;
