import React from "react";

const SortableHeaderItem = ({
  label,
  active,
  order,
}: {
  label: string;
  active: boolean;
  order: number;
}) => {
  return (
    <div>
      <span>{label}</span>
      <span className={`ms-1 ${active ? "d-inline" : "d-none"}`}>
        <span>{order === 1 ? "v" : "^"}</span>
      </span>
    </div>
  );
};
export default SortableHeaderItem;
