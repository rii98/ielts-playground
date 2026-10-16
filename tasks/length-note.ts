/**
 * The line added to the user turn when a response is under the minimum word count
 * (same wording as the live app). Shared by every task; edit here to change it everywhere.
 */
export function lengthNote(task: 1 | 2, minWords: number, wordCount: number): string {
  if (wordCount >= minWords) return "";
  return (
    " " +
    [
      `This is ${minWords - wordCount} words UNDER the`,
      `${minWords}-word minimum for Task ${task}. Weigh this on Task`,
      `Achievement IN PROPORTION to the shortfall: a response only slightly short is only`,
      `slightly limited and can still reach a high band when its ideas are well developed;`,
      `a severely short response cannot develop the task and should be marked down`,
      `accordingly. Do NOT cap the band on length alone when the content is otherwise`,
      `strong.`,
    ].join(" ")
  );
}
