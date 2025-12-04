export class APICallError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: unknown,
  ) {
    super(message);
  }
}
