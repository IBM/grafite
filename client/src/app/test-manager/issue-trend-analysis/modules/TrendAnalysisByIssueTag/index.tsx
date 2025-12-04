import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import ChartByIssueTags from '../ChartByIssueTags';
import TrendGrid from '../TrendGrid';
import TagFilterModal from '../TagFilterModal';
import styles from './TrendAnalysisByIssueTag.module.scss';
import { useEffect, useMemo, useState } from 'react';
import { DismissibleTag } from '@carbon/react';
import { Button } from '@carbon/react';
import { Filter } from '@carbon/react/icons';
import ScoreModeToggle from '../ScoreModeToggle';
import { useIssuesContext } from '@modules/IssuesContext';
import {
  compareIssueTagResults,
  groupScoreResultByIssueTag,
  groupPassResultByIssueTag,
} from '@test-manager/issue-trend-analysis/utils';

interface Props {
  selectedReports: SelectedReport[];
}
const TrendAnalysisByIssueTag = ({ selectedReports }: Props) => {
  const { issues, loading } = useIssuesContext();
  const [selectedTags, setSelectedTags] = useState<string[] | undefined>(undefined);
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<0 | 1>(0); //individual / compare

  const chartData = useMemo(() => {
    if (!issues || !selectedReports?.length) return undefined;
    return selectedReports.length === 1
      ? [{ mode: 0, data: groupScoreResultByIssueTag(issues || [], selectedReports[0].results || []) }]
      : [
          { mode: 0, data: groupPassResultByIssueTag(issues, selectedReports) },
          { mode: 1, data: compareIssueTagResults(issues, selectedReports) },
        ];
  }, [selectedReports, issues, loading]);

  const tags = useMemo(() => {
    const tags =
      chartData
        ?.map((d) => d.data.map((k) => k.key))
        .flat()
        .filter((d, i, arr) => !!d && arr.indexOf(d) === i) || [];
    if (!selectedTags) setSelectedTags(tags);
    else setSelectedTags((prev) => prev?.filter((tag) => tags.includes(tag)));
    return tags;
  }, [chartData]);

  useEffect(() => {
    setMode(selectedReports.length !== 2 ? 0 : 1);
  }, [selectedReports]);

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <h3>Trend analysis by issue tag</h3>
        <div className={styles.row}>
          <div className={styles.filter}>
            {!!selectedTags?.length && (
              <DismissibleTag
                text={selectedTags.length}
                type="high-contrast"
                onClose={() => {
                  setSelectedTags([...tags]);
                }}
              />
            )}
            <Button
              kind="ghost"
              renderIcon={Filter}
              iconDescription="Filter tag"
              size="sm"
              onClick={() => setFilterModalOpen(true)}
            >
              Filter tag
            </Button>
          </div>
          <ScoreModeToggle
            mode={mode}
            changeMode={(mode: 0 | 1) => {
              setMode(mode);
            }}
            disabled={!(selectedReports.length === 2)}
          />
        </div>
      </div>
      <div className={styles.chartWrapper}>
        <ChartByIssueTags
          data={loading || !chartData ? [] : chartData?.find((d) => d.mode === mode)?.data}
          mode={mode}
          selectedTags={selectedTags}
          isStacked={selectedReports.length === 1 || !!mode}
        />
      </div>
      <div className={styles.gridArea}>
        <div className={styles.gridWrapper}>
          <TrendGrid selectedReports={selectedReports} selectedTags={selectedTags} />
        </div>
      </div>
      <TagFilterModal
        open={filterModalOpen}
        tags={tags}
        defaultSelected={selectedTags}
        close={() => {
          setFilterModalOpen(false);
        }}
        selectTags={(tags: string[]) => {
          setSelectedTags([...tags]);
        }}
      />
    </section>
  );
};

export default TrendAnalysisByIssueTag;
