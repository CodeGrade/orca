import React from "react";
import { PageInfo, PaginationInfo } from "../grading_job_table/types";
import PaginationButton from "./pagination-button";

type PaginationBarProps = {
  paginationInfo: PaginationInfo;
  clickHandler: (changeTo: PageInfo | null) => void;
};

const PaginationBar = ({
  paginationInfo,
  clickHandler,
}: PaginationBarProps) => {
  const { first, last, prev, next } = paginationInfo;
  return (
    <div className="d-flex justify-content-between">
      <div>
        <PaginationButton
          clickHandler={clickHandler}
          changeTo={first}
          icon={"<<"}
        />
        <PaginationButton
          clickHandler={clickHandler}
          changeTo={prev}
          icon={"<"}
        />
      </div>
      <div>
        <PaginationButton
          clickHandler={clickHandler}
          changeTo={next}
          icon={">"}
        />
        <PaginationButton
          clickHandler={clickHandler}
          changeTo={last}
          icon={">>"}
        />
      </div>
    </div>
  );
};
export default PaginationBar;
