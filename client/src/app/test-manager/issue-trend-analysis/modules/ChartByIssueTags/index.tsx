import '@carbon/charts/styles.css';

import { ScaleTypes, StackedBarChart, StackedBarChartOptions, ToolbarControlTypes } from '@carbon/charts-react';
import { Loading } from '@carbon/react';
import { useThemePreference } from '@components/ThemePreference';
import { ResultByIssueTag } from '@test-manager/issue-trend-analysis/utils';
import getChartColors from '@utils/getChartColors';

import HeatmapByIssueTags from '../HeatmapByIssueTags';

interface Props {
  mode: 1 | 0;
  selectedTags: string[] | undefined;
  data: ResultByIssueTag[] | undefined;
  isStacked: boolean;
}
const ChartByIssueTags = ({ mode, selectedTags, data, isStacked }: Props) => {
  const { theme } = useThemePreference();

  const getTitle = () => {
    if (isStacked) return mode ? 'Distribution chart (B against A)' : 'Passed / Failed per issue tag';
    return 'Pass rate per issue tag';
  };

  const options: StackedBarChartOptions = {
    theme,
    title: getTitle(),
    axes: {
      left: {
        stacked: true,
        title: 'Same / Worse / Better (#)',
      },
      bottom: {
        scaleType: ScaleTypes.LABELS,
        mapsTo: 'key',
        title: 'Issue tag',
      },
    },
    width: '100%',
    height: '500px',
    getFillColor(group) {
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
  };

  const filteredData = data?.filter((d) => selectedTags?.includes(d.key) ?? true);

  return (
    <div>
      {filteredData ? (
        isStacked ? (
          <StackedBarChart data={filteredData} options={options} />
        ) : (
          <HeatmapByIssueTags title={getTitle()} data={filteredData} isDark={theme === 'g100'} />
        )
      ) : (
        <Loading withOverlay={false} />
      )}
    </div>
  );
};

export default ChartByIssueTags;
