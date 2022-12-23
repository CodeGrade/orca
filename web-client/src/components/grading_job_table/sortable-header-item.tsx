import React from "react";

interface SortableHeaderItemProps {
  label: string;
  active: boolean;
  order: number;
}

const SortableHeaderItem = ({
  label,
  active,
  order,
}: SortableHeaderItemProps) => {
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
