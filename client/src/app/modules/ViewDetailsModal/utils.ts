export const isTestEditable = (isAdmin: boolean, userEmail: string, testAuthor: string) => {
  return isAdmin || userEmail === testAuthor;
};
