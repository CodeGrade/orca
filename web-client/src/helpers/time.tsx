import { DateTime } from "luxon";

export const formatReleaseTimestamp = (release_timestamp: number): string => {
  const release_date = new Date(release_timestamp * 1000); // milliseconds to seconds
  const date = release_date.toLocaleDateString();
  const time = release_date.toLocaleTimeString();
  const datetime = `${date} ${time}`;
  return datetime;
};

export const convertHHMMSS = (seconds_to_convert: number): string => {
  const hhmmss: string = new Date(seconds_to_convert * 1000) // milliseconds to seconds
    .toISOString()
    .substring(11, 19);
  return hhmmss;
};

const pluralize = (
  number: number,
  singular: string,
  plural: string
): string => {
  if (number === 0) {
    return `${number} ${plural}`;
  }
  if (Math.abs(number) === 1) {
    return `${number} ${singular}`;
  }
  return `${number} ${plural}`;
};

export const describeTime = (time: DateTime): string => {
  const remaining = DateTime.local().diff(time);
  const left = remaining
    .shiftTo("weeks", "days", "hours", "minutes", "seconds", "milliseconds")
    .normalize();
  if (left.weeks > 0) {
    return `${pluralize(left.weeks, "week", "weeks")}, ${pluralize(
      left.days,
      "day",
      "days"
    )} ago`;
  }
  if (left.days > 0) {
    return `${pluralize(left.days, "day", "days")}, ${pluralize(
      left.hours,
      "hour",
      "hours"
    )} ago`;
  }
  if (left.hours > 0) {
    return `${pluralize(left.hours, "hour", "hours")}, ${pluralize(
      left.minutes,
      "minute",
      "minutes"
    )} ago`;
  }
  if (left.minutes > 0) {
    return `${pluralize(left.minutes, "minute", "minutes")}, ${pluralize(
      left.seconds,
      "second",
      "seconds"
    )} ago`;
  }
  if (left.valueOf() > 0) {
    return `${pluralize(left.seconds, "second", "seconds")} ago`;
  }
  return time.toRelative()!;
};

export const makeReadableDate = (
  dd: DateTime,
  showTime: boolean,
  capitalize: boolean
): string => {
  const today = DateTime.local().startOf("day");
  const yesterday = today.minus({ days: 1 });
  const tomorrow = today.plus({ days: 1 });
  const twodays = tomorrow.plus({ days: 1 });
  let relDay: string = "";
  if (yesterday <= dd && dd < today) {
    relDay = capitalize ? "Yesterday" : "yesterday";
  } else if (today <= dd && dd < tomorrow) {
    relDay = capitalize ? "Today" : "today";
  } else if (tomorrow <= dd && dd < twodays) {
    relDay = capitalize ? "Tomorrow" : "tomorrow";
  }
  if (relDay !== "") {
    return `${relDay} at ${dd.toLocaleString(DateTime.TIME_WITH_SECONDS)}`;
  }
  if (showTime) {
    return dd.toLocaleString(DateTime.DATETIME_MED);
  }
  return dd.toLocaleString(DateTime.DATE_FULL);
};
