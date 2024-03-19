import validations from "./validations";

export * from "./grading-jobs";
export * from "./types";
export * from "./config";
export { validations };

export const toMilliseconds = (seconds: number) => seconds * 1_000;
