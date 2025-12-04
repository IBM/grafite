'use client';

import '@carbon/charts-react/styles.css';

import { type ChartTabularData, DonutChart, DonutChartOptions } from '@carbon/charts-react';
import { useThemePreference } from '@components/ThemePreference';
import { useEffect, useRef } from 'react';

import styles from './Chart.module.scss';

type ChartProps = {
  data: ChartTabularData;
  loading?: boolean;
  centerLabel: string;
  options?: DonutChartOptions;
  filter?: (group: string) => void;
};

const Chart = ({ data, loading = false, centerLabel, filter, options }: ChartProps) => {
  const { theme } = useThemePreference();

  const chartRef = useRef<DonutChart | null>(null);

  const chartOnClick = ({ detail }: { detail: { datum: { data: { group: string } } } }) => {
    const { group } = detail.datum.data;

    if (filter) {
      filter(group);
    }
  };

  useEffect(() => {
    chartRef?.current?.chart?.services.events.addEventListener('pie-slice-click', chartOnClick);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      chartRef?.current?.chart?.services.events.removeEventListener('pie-slice-click', chartOnClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRef]);

  return (
    <div className={styles.wrapper}>
      <DonutChart
        ref={chartRef}
        data={data}
        options={{
          data: {
            loading,
          },
          legend: {
            enabled: false,
          },
          toolbar: {
            enabled: false,
          },
          tooltip: {
            customHTML(data) {
              return `${data[0].label}: ${data[0].value}`;
            },
          },
          title: '',
          resizable: false,
          donut: {
            center: {
              label: centerLabel,
            },
          },
          width: '230px',
          height: '200px',
          getFillColor(group, label, data, defaultFillColor) {
            switch (group) {
              case 'Failed':
                return theme === 'white' ? '#9f1853' : '#ff7eb6';
              case 'Passed':
                return theme === 'white' ? '#1192e8' : '#33b1ff';
              default:
                return defaultFillColor || '#000';
            }
          },
          theme,
          ...(options ?? {}),
        }}
      />
    </div>
  );
};

export default Chart;
