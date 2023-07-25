export class JobNonexistentError extends Error {
  public constructor(key: string) {
    super(`There is no job in the queue with the key ${key}.`);
  }
}

export class NonImmediateJobRemovalError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

export class AssertionError extends Error {
  public constructor(message: string) {
    super(message);
  }
}
