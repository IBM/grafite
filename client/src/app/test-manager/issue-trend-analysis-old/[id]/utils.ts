import { type Result } from '@utils/getFunctions/getDashboardResult';
import { type TestRun } from '@utils/getFunctions/getDashboardRunningTests';

export type SelectedReport = {
  report: TestRun;
  results: Result[] | null;
};
