import { Debug, TestTool } from '@carbon/react/icons';

export const NO_SIDENAV = ['/test', '/auth/signin', '/issue'];
export const TEST_MANAGER_PATH = '/test-manager';
export const TEST_MANAGER_PATHS = [
  { label: 'All QA tests', link: '/qa-tests' },
  { label: 'Test reports', link: '/reports' },
  { label: 'Trend analysis', link: '/issue-trend-analysis' },
];
export const TEST_FEEDBACK_PATH = process.env.NEXT_PUBLIC_FEEDBACKS_URL
  ? {
      label: 'Feedbacks',
      link: process.env.NEXT_PUBLIC_FEEDBACKS_URL,
    }
  : null;
export const TEST_CREATION_PATHS = [
  { label: 'Issues', link: '/issues', icon: Debug },
  { label: 'My QA tests', link: '/my-qa-tests', icon: TestTool },
];
