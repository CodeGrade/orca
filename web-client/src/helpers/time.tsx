export const formatReleaseTimestamp = (release_timestamp: number): string => {
  const release_date = new Date(release_timestamp * 1000);
  const date = release_date.toLocaleDateString();
  const time = release_date.toLocaleTimeString();
  const datetime = `${date} ${time}`;
  return datetime;
};

export const convertHHMMSS = (seconds_to_convert: number): string => {
  const hhmmss: string = new Date(seconds_to_convert * 1000)
    .toISOString()
    .substring(11, 19);
  return hhmmss;
};
