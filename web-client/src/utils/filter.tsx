import React from "react";

export const createDefaultFilterOptionElem = (): JSX.Element => {
  return (
    <option key={-1} value={""} /*disabled hidden*/>
      None
    </option>
  );
};

export const createOptionElemsFromArr = (arr: string[]): JSX.Element[] => {
  // Elements are their own value
  const options = arr.map((el, ind) => {
    return (
      <option key={ind} value={el}>
        {el}
      </option>
    );
  });
  return [createDefaultFilterOptionElem(), ...options];
};

export const getFilterValueOptionElems = (
  filter: string,
  values: string[]
): JSX.Element[] => {
  if (filter === "none") return [];
  return createOptionElemsFromArr(values);
};
