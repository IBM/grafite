import { isValidElement, ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const parseReactElementContent = (dom: ReactElement) => {
  if (!isValidElement(dom)) return '';
  const htmlStr = renderToStaticMarkup(<>{dom} </>);
  const tempWrapper = document.createElement('div');
  tempWrapper.innerHTML = htmlStr;
  return tempWrapper.textContent || '-';
};
