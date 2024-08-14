const groupBy = <T, U>(arr: Array<T>, callbackFn: (arg0: T, arg1: number) => U): Map<U, Array<T>> => {
  const result: Map<U, Array<T>> = new Map();
  for (let i = 0; i < arr.length; ++i) {
    const v = arr[i];
    const key = callbackFn(v, i);
    if (result.has(key)) {
      result.get(key)!.push(v);
    } else {
      result.set(key, [v]);
    }
  }
  return result;
};

export default groupBy;
