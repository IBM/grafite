import { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const parseReactElementContent = (dom: ReactElement) => {
  const htmlStr = renderToStaticMarkup(<>{dom} </>);
  const tempWrapper = document.createElement('div');
  tempWrapper.innerHTML = htmlStr;
  return tempWrapper.textContent || '-';
};
