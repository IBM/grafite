import { Components } from 'react-markdown';

import Code from './Code';
import { JsonTree } from './JsonTree';
import { Table } from './Table';

export const components: typeof Components = {
  table: Table,
  code: Code,
  jsonTree: JsonTree,
};
