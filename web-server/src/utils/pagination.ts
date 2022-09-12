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

export const getPageFromGradingQueue = (
  grading_queue: GradingJob[],
  offset: number,
  limit: number
): PaginationData => {
  let prev: PaginationInfo | null, next: PaginationInfo | null;
  if (offset == 0) {
    prev = null;
  } else {
    prev = { offset: offset - limit, limit };
  }

  if (offset + limit >= grading_queue.length) {
    next = null;
  } else {
    next = { offset: offset + limit, limit };
  }

  const start_index = offset;
  const end_index_based_on_offset = offset + limit;
  const end_index_of_list = grading_queue.length;
  const data = grading_queue.slice(
    start_index,
    Math.min(end_index_based_on_offset, end_index_of_list)
  );
  return { prev, next, data };
};
