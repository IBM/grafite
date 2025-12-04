import '@carbon/charts/styles.css';

import {
  GroupedBarChart,
  ScaleTypes,
  StackedBarChart,
  StackedBarChartOptions,
  ToolbarControlTypes,
} from '@carbon/charts-react';
import { Loading } from '@carbon/react';
import { useThemePreference } from '@components/ThemePreference';
import { ResultByIssueTag } from '@test-manager/issue-trend-analysis/utils';
import getChartColors from '@utils/getChartColors';

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
        ...(isStacked
          ? {
              title: 'Same / Worse / Better (#)',
            }
          : {
              domain: [0, 100],
              title: 'Pass rate (%)',
              percentage: true,
              ticks: {
                max: 100,
                formatter: (number: number | Date, _i: number) => `${number}%`,
              },
            }),
      },
      bottom: {
        scaleType: ScaleTypes.LABELS,
        mapsTo: 'key',
        title: 'Issue tag',
      },
    },
    width: '100%',
    height: '500px',
    ...(isStacked
      ? {
          getFillColor(group) {
            return getChartColors(group, theme);
          },
        }
      : {}),
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

  return (
    <div>
      {data ? (
        <>
          {isStacked ? (
            <StackedBarChart data={data.filter((d) => selectedTags?.includes(d.key) ?? true)} options={options} />
          ) : (
            <GroupedBarChart data={data.filter((d) => selectedTags?.includes(d.key) ?? true)} options={options} />
          )}
        </>
      ) : (
        <Loading withOverlay={false} />
      )}
    </div>
  );
};

export default ChartByIssueTags;
