import { ToolbarControlTypes } from '@carbon/charts-react';
import { Loading } from '@carbon/react';
import Chart from '@components/DonutChart';
import { useThemePreference } from '@components/ThemePreference';
import { comparScores } from '@test-manager/issue-trend-analysis/utils';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import getChartColors from '@utils/getChartColors';
import { parseBinaryJudgeScore } from '@utils/parseJudgeScore';
import { useMemo } from 'react';

const ChartByScore = ({ selectedReports }: { selectedReports: SelectedReport[] }) => {
  const { theme } = useThemePreference();
  const mode = selectedReports.length > 1 ? 1 : 0;
  const data: { group: string; value: number }[] | null = useMemo(() => {
    if (!selectedReports?.length) return null;
    if (selectedReports.length === 1)
      return [
        {
          group: 'Passed',
          value: selectedReports[0].results?.filter((d) => !!parseBinaryJudgeScore(d))?.length ?? 0,
        },
        {
          group: 'Failed',
          value: selectedReports[0].results?.filter((d) => !parseBinaryJudgeScore(d))?.length ?? 0,
        },
      ];
    return comparScores(selectedReports);
  }, [selectedReports]);

  return data ? (
    <Chart
      data={data || []}
      loading={!data}
      centerLabel={'tests'}
      options={{
        title: mode ? 'Score comparison\n(B against A)' : 'Passed / failed',
        width: '300px',
        height: '350px',
        legend: {
          enabled: true,
          order: ['Passed', 'Failed'],
        },
        pie: { sortFunction: (a, _b) => (a.group === 'Passed' ? 1 : -1) },
        getFillColor(group, _label, _data, _defaultFillColor) {
          return getChartColors(group, theme);
        },
        toolbar: {
          enabled: true,
          numberOfIcons: 3,
          controls: [
            {
              type: ToolbarControlTypes.MAKE_FULLSCREEN,
            },
            {
              type: ToolbarControlTypes.EXPORT_PNG,
            },
          ],
        },
      }}
    />
  ) : (
    <Loading withOverlay={false} />
  );
};

export default ChartByScore;
