import type { TableHTMLAttributes } from 'react';
import classes from './Table.module.scss';
import { ExtraProps } from 'react-markdown';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Table({ node, ...props }: TableHTMLAttributes<HTMLTableElement> & typeof ExtraProps) {
  return (
    <div className={classes.root}>
      <table {...props} className={classes.table} />
    </div>
  );
}
