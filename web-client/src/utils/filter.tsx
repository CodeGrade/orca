import React from "react";

export const createDefaultFilterOption = () => {
  return (
    <option key={-1} value={""} /*disabled hidden*/>
      None
    </option>
  );
};

export const createOptionsFromArr = (arr: any[]): JSX.Element[] => {
  // Elements are their own value
  const options = arr.map((el, ind) => {
    return (
      <option key={ind} value={el}>
        {el}
      </option>
    );
  });
  return [createDefaultFilterOption(), ...options];
};

export const getActiveOptions = (
  filter: string,
  values: any[]
): JSX.Element[] => {
  if (filter === "none") return [];
  return createOptionsFromArr(values);
};
