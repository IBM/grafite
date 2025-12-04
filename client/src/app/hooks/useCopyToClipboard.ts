import { RefObject, useState } from 'react';

export const useCopyToClipboard = (target: RefObject<HTMLElement>) => {
  const [result, setResult] = useState<null | { state: 'success' } | { state: 'error'; message: string }>(null);

  const copy = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        //in case of http
        const box = target.current;
        if (!box) throw new Error('Copy not available due to the target missing');

        const textArea = document.createElement('textarea');
        textArea.value = text;
        box.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setResult({ state: 'success' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setResult({ state: 'error', message: e.message });
      throw e;
    } finally {
      setTimeout(() => {
        setResult(null);
      }, 2000);
    }
  };

  return [copy, result] as const;
};
