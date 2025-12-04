export default function mapJudgeTemplate(name: string) {
  switch (name) {
    case 'Prompt template 3: output + judge guideline':
      return 'Model response';
    case 'Prompt template 2: output + ground truth + judge guideline':
      return 'Model response + ground truth';
    case 'Prompt template 1: input + output + ground truth + judge guideline':
      return 'Model response + ground truth + input';
    default:
      return name;
  }
}
