import { useThemePreference } from '@components/ThemePreference';
import { PropsWithChildren } from 'react';
import { JSONTree } from 'react-json-tree';

import styles from './JsonTree.module.scss';

interface Props {
  shouldExpandNodeInitially?: boolean;
}
export function JsonTree({ children, shouldExpandNodeInitially = true }: PropsWithChildren<Props>) {
  const { theme } = useThemePreference();

  const treeTheme =
    theme === 'white'
      ? {
          base00: '#ffffff',
          base01: '#95957eff',
          base02: '#96937fff',
          base03: '#8b8772ff',
          base04: '#75715eff',
          base05: '#050505ff',
          base06: '#0b0b0aff',
          base07: '#050505ff',
          base08: '#490b22ff',
          base09: '#7c4506ff',
          base0A: '#2a2114ff',
          base0B: 'rgb(203 75 23)',
          base0C: '#273a37ff',
          base0D: 'rgb(41 75 84)',
          base0E: '#161021ff',
          base0F: '#4f2713ff',
        }
      : {
          base00: '#0a0a0a',
          base01: '#4d3874ff',
          base02: '#6d5b5bff',
          base03: '#908274ff',
          base04: '#504d3fff',
          base05: '#d4d0b8',
          base06: '#e8e4cc',
          base07: '#f5f1e0',
          base08: '#e8355f',
          base09: '#dfbdb1ff',
          base0A: '#c9a865',
          base0B: '#f69767ff',
          base0C: '#7cdcceff',
          base0D: '#80c7e1ff',
          base0E: '#9d6b9f',
          base0F: '#b8673d',
        };
  const content = (() => {
    try {
      return JSON.parse(children as string);
    } catch {
      return children;
    }
  })();

  return (
    <div className={styles.root}>
      <JSONTree
        data={content}
        theme={treeTheme}
        shouldExpandNodeInitially={shouldExpandNodeInitially ? () => true : undefined}
      />
    </div>
  );
}
