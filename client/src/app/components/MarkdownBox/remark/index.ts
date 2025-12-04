import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { remarkJsonTree } from './remarkJsonTree';

export const remarkPlugins = [remarkGfm, [remarkMath, { singleDollarTextMath: false }], remarkJsonTree];
