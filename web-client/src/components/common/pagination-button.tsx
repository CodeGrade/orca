import React from "react";
import { PaginationInfo } from "../grading_job_table/types";

type PaginationButtonProps = {
  clickHandler: (changeTo: PaginationInfo | null) => void;
  changeTo: PaginationInfo | null;
  icon: string;
};

const PaginationButton = ({
  clickHandler,
  changeTo,
  icon,
}: PaginationButtonProps) => {
  return (
    <button
      type="button"
      className={`btn btn-primary ${changeTo ? "visible" : "invisible"}`}
      onClick={() => clickHandler(changeTo)}
    >
      {icon}
    </button>
  );
};
export default PaginationButton;
