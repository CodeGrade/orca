import React from "react";
import Button from "react-bootstrap/Button";
import { PageInfo } from "../grading_job_table/types";

type PaginationButtonProps = {
  clickHandler: (changeTo: PageInfo | null) => void;
  changeTo: PageInfo | null;
  icon: string;
};

const PaginationButton = ({
  clickHandler,
  changeTo,
  icon,
}: PaginationButtonProps) => {
  return (
    <Button
      variant="primary"
      className={`${changeTo ? "visible" : "invisible"}`}
      onClick={() => clickHandler(changeTo)}
    >
      {icon}
    </Button>
  );
};
export default PaginationButton;
