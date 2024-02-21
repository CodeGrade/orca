import validations from "./validations";

export * from "./grading-jobs";
export * from "./redis";
export * from "./grading-queue";
export * from "./types";
export * from "./config";
export * from "./logger";
export { validations };

export const toMilliseconds = (seconds: number) => seconds * 1_000;
