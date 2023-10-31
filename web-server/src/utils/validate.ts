const isString = (value: any): boolean => typeof value === "string";

// TODO: Implement filterType as FilterType
export const validateFilterRequest = (filterType: any, filterValue: any) => {
  return isString(filterType) && isString(filterValue);
};
