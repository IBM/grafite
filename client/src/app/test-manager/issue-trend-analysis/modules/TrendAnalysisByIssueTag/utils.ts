export const filterByTag = (selectedTags: string[], issueTags: string[]) => {
  return (selectedTags.includes('No tag') && !issueTags.length) || !!issueTags.find((d) => selectedTags?.includes(d));
};
