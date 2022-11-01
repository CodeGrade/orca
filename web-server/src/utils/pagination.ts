import {
  GradingJob,
  PaginationData,
  PaginationInfo,
} from "../grading-queue/types";

export const validateOffsetAndLimit = (offset, limit): boolean => {
  if (isNaN(limit) || isNaN(offset)) return false;
  const offsetNum: number = parseInt(offset);
  const limitNum: number = parseInt(limit);
  return offsetNum >= 0 && limitNum > 0 && limitNum <= 50;
};

export const formatOffsetAndLimit = (offset, limit): [number, number] => {
  return [parseInt(offset), parseInt(limit)];
};

const findLastPageOffset = (limit: number, numGradingJobs: number) => {
  let offset = numGradingJobs - 1;
  while (offset % limit !== 0 && offset !== 0) {
    offset--;
  }
  return offset;
};

export const getPageFromGradingQueue = (
  gradingJobs: GradingJob[],
  offset: number,
  limit: number,
): PaginationData => {
  let prev: PaginationInfo | null,
    next: PaginationInfo | null,
    first: PaginationInfo | null,
    last: PaginationInfo | null;
  if (offset == 0) {
    prev = null;
    first = null; // already on first page
  } else {
    prev = { offset: offset - limit, limit };
    first = { offset: 0, limit };
  }

  if (offset + limit >= gradingJobs.length) {
    next = null;
    last = null; // already on last page
  } else {
    next = { offset: offset + limit, limit };
    last = { offset: findLastPageOffset(limit, gradingJobs.length), limit };
  }

  const startInd = offset;
  const endIndFromOffset = offset + limit;
  const endInd = gradingJobs.length;
  const data = gradingJobs.slice(startInd, Math.min(endIndFromOffset, endInd));
  return { first, prev, next, last, data };
};
