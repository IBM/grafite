import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

export function remarkJsonTree(): ReturnType<Plugin<[], Root>> {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (node.lang === 'json') {
        node.data = {
          hName: 'jsonTree',
        };
      }
    });
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(tree, 'paragraph', (node: any) => {
      if (!node.children?.length) return;

      const text = (() => {
        const texts = [];
        for (const child of node.children) {
          if (['html', 'text', 'link'].includes(child.type)) {
            texts.push(child.value);
          } else break;
        }
        return texts.join('');
      })();

      if (!(text.startsWith('{') && text.endsWith('}')) && !(text.startsWith('[') && text.endsWith(']'))) return;

      try {
        JSON.parse(text);
      } catch (e) {
        console.log(e);
        return;
      }

      node.data = {
        hName: 'jsonTree',
      };
    });
  };
}
