import { ChevronDown, ChevronUp } from '@carbon/react/icons';
import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';

import styles from './ExpandableText.module.scss';

const ExpandableText = ({ children }: { children: string | number | ReactElement }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isExpandable, setIsExpandable] = useState<boolean>(false);
  const hiddenRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef?.current?.parentElement;
    const box = hiddenRef?.current;
    if (!wrapper || !box || !children) return;

    const getHeight = () => {
      const boxHeight = box?.getBoundingClientRect().height;
      const wrapperHeight = wrapper?.getBoundingClientRect().height;
      const height = boxHeight || wrapperHeight || 0;
      setIsExpandable(height > 400);
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(getHeight);
    });

    observer.observe(wrapper);
    requestAnimationFrame(getHeight);

    return () => observer.disconnect();
  }, [children, wrapperRef, hiddenRef]);

  const Content = typeof children !== 'object' ? <p>{children}</p> : children;

  const toggleExpand = useCallback(() => {
    const isClosing = expanded;
    setExpanded((prev) => !prev);

    if (isClosing) {
      setTimeout(() => {
        const wrapper = wrapperRef?.current;

        if (wrapper) {
          //only scroll up if it's out of view
          const observer = new IntersectionObserver(([entry], observer) => {
            if (!entry.isIntersecting) wrapper.scrollIntoView({ behavior: 'smooth' });
            observer.disconnect();
          });
          observer.observe(wrapper);
        }
      }, 0);
    }
  }, [wrapperRef, expanded]);

  return (
    <>
      <div className={`${isExpandable ? styles.expandable : ''} ${expanded ? '' : styles.collapsed}`} ref={wrapperRef}>
        {Content}
        {isExpandable && (
          <button onClick={toggleExpand} className={styles.expandBtn}>
            <span>See {expanded ? 'less' : 'more'}</span>
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </button>
        )}
      </div>
      <div className={styles.hidden} ref={hiddenRef}>
        {Content}
      </div>
    </>
  );
};

export default ExpandableText;
