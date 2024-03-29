import React from "react";
import Button from "react-bootstrap/Button";
import { PaginationInfo } from "../grading_job_table/types";

interface PaginationButtonProps {
  clickHandler: (changeTo?: PaginationInfo) => void;
  changeTo?: PaginationInfo;
  icon: string;
}

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
