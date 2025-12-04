import { GridOptions, themeQuartz } from 'ag-grid-community';
import { Loading } from '@carbon/react';

// to use myTheme in an application, pass it to the theme grid option
export const carbonTheme = themeQuartz.withParams({
  wrapperBorderRadius: 0,
  browserColorScheme: 'light',
  cellTextColor: 'var(--cds-text-primary)',
  headerFontFamily: 'inherit',
  headerFontSize: 14,
  headerTextColor: 'var(--cds-text-primary)',
  headerFontWeight: 'bold',
  headerBackgroundColor: 'var(--cds-layer-hover-01)',
  oddRowBackgroundColor: 'var(--cds-layer-01)',
  backgroundColor: 'var(--cds-layer-02)',
  borderRadius: 0,
  accentColor: 'var(--cds-interactive)',
  tooltipTextColor: 'var(--cds-text-primary)',
});

export const gridOptions: GridOptions<unknown> = {
  loadingCellRenderer: Loading,
};
