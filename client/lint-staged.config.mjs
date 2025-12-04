export default {
  "*.{js,ts,tsx}": [
    "prettier --write",
    "eslint",
    "npm run fix:imports",
  ],
  "*.{css,scss}": [
    "stylelint",
  ],
};