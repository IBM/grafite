import { AgGridReact } from 'ag-grid-react';

export function aggregateReportScores(
  reports: {
    runId: string;
    modelId: string;
    createdAt: string;
  }[],
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  gridRef: AgGridReact<any>,
) {
  const runs: {
    [runId: string]: {
      passed: number;
      failed: number;
      none: number;
      hasHumanEval: number;
      modelId: string;
      createdAt: string;
    };
  } = {};

  reports.forEach((r) => {
    runs[r.runId] = { passed: 0, failed: 0, none: 0, hasHumanEval: 0, modelId: r.modelId, createdAt: r.createdAt };
  });

  if (!gridRef?.api) return runs;

  const rowCount = gridRef.api.getDisplayedRowCount();

  for (let i = 0; i < rowCount; i++) {
    const rowNode = gridRef.api.getDisplayedRowAtIndex(i);

    if (!rowNode) continue;

    reports.forEach((r) => {
      const score = rowNode.data[r.runId]?.score;
      const hasHumanEval = rowNode.data[r.runId]?.hasHumanEval;

      if (hasHumanEval) runs[r.runId].hasHumanEval++;

      switch (true) {
        case score === undefined:
          runs[r.runId].none++;
          break;
        case score <= 0.5:
          runs[r.runId].failed++;
          break;
        case score > 0.5:
          runs[r.runId].passed++;
          break;
        default:
          runs[r.runId].none++;
          break;
      }
    });
  }

  return runs;
}
