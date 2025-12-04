import React from 'react';
import styles from './markdownbox.module.scss';

const TextButtons = ({ callbackFunction }: { callbackFunction: (boolState: boolean) => void }) => {
  return (
    <div className={styles.optionsWrapper}>
      <button onClick={() => callbackFunction(true)}>Raw String</button>
      <span className={styles.separator}></span>
      <button onClick={() => callbackFunction(false)}>Formatted</button>
    </div>
  );
};

export default TextButtons;
