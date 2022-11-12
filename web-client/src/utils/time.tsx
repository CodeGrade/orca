import { DateTime } from "luxon";

export const millisToDHHMMSS = (millis: number, written = false): string => {
  const seconds = millis / 1000;
  const d: number = Math.floor(seconds / (3600 * 24));
  const h: number = Math.floor((seconds % (3600 * 24)) / 3600);
  const m: number = Math.floor((seconds % 3600) / 60);
  const s: number = Math.floor(seconds % 60);

  let outStr = "";
  if (written) {
    const dStr = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
    const hStr = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mStr = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
    const sStr = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
    outStr = dStr + hStr + mStr + sStr;
  } else {
    const dStr = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
    const hStr = h > 0 ? (h < 10 ? `0${h}:` : `${h}:`) : "00:";
    const mStr = m > 0 ? (m < 10 ? `0${m}:` : `${m}:`) : "00:";
    const sStr = s > 0 ? (s < 10 ? `0${s}` : `${s}`) : "00";
    outStr = dStr + hStr + mStr + sStr;
  }
  return outStr;
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
  let relDay = "";
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
