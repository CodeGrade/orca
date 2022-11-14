import {
  GradingJob,
  PaginationData,
  PaginationInfo,
} from "../grading-queue/types";

export const validateOffsetAndLimit = (offset, limit): boolean => {
  if (isNaN(limit) || isNaN(offset)) return false;
  const offset_num: number = parseInt(offset);
  const limit_num: number = parseInt(limit);
  return offset_num >= 0 && limit_num > 0 && limit_num <= 50;
};

export const formatOffsetAndLimit = (offset, limit): [number, number] => {
  return [parseInt(offset), parseInt(limit)];
};

const findLastPageOffset = (limit: number, grading_queue_length: number) => {
  let offset = grading_queue_length - 1;
  while (offset % limit !== 0 && offset !== 0) {
    offset--;
  }
  return offset;
};

export const getPageFromGradingQueue = (
  grading_queue: GradingJob[],
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

  if (offset + limit >= grading_queue.length) {
    next = null;
    last = null; // already on last page
  } else {
    next = { offset: offset + limit, limit };
    last = { offset: findLastPageOffset(limit, grading_queue.length), limit };
  }

  const start_index = offset;
  const end_index_based_on_offset = offset + limit;
  const end_index_of_list = grading_queue.length;
  const data = grading_queue.slice(
    start_index,
    Math.min(end_index_based_on_offset, end_index_of_list),
  );
  return { first, prev, next, last, data };
};
