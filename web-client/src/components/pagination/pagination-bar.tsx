import React, { useContext } from "react";
import { OffsetContext } from "../dashboard/dashboard";
import { PageInfo, PaginationInfo } from "../grading_job_table/types";
import PaginationButton from "./pagination-button";

type PaginationBarProps = {
  paginationInfo: PaginationInfo;
};

const PaginationBar = ({ paginationInfo }: PaginationBarProps) => {
  const { setOffset } = useContext(OffsetContext);
  const handleChangePage = (changeTo: PageInfo | null) => {
    if (!changeTo) return;
    setOffset(changeTo.offset);
  };
  const { first, last, prev, next } = paginationInfo;

  return (
    <div className="d-flex justify-content-between">
      <div>
        <PaginationButton
          clickHandler={handleChangePage}
          changeTo={first}
          icon={"<<"}
        />
        <PaginationButton
          clickHandler={handleChangePage}
          changeTo={prev}
          icon={"<"}
        />
      </div>
      <div>
        <PaginationButton
          clickHandler={handleChangePage}
          changeTo={next}
          icon={">"}
        />
        <PaginationButton
          clickHandler={handleChangePage}
          changeTo={last}
          icon={">>"}
        />
      </div>
    </div>
  );
};
export default PaginationBar;
