import { DateTime } from "luxon";
import { describeTime, makeReadableDate } from "./time";

/**
 * Dynamically access properties of a given object.
 * Ex: obj = {a: { b: { c: 1, d: 2}}}, propStr = "a.b.c" => 1
 * @param obj - Object to search for prop in.
 * @param propStr - String path to property in object
 * @returns The value of the property or undefined
 */
export const getPropByString = (obj: any, propStr: string) => {
  if (!propStr) return;
  const props = propStr.split(".");
  for (let prop of props) {
    const candidate = obj[prop];
    if (candidate !== undefined) obj = candidate;
    else return;
  }
  return obj;
};

/**
 * Helper for displaying wait time info that describes time of timestamp without trailing 'ago'
 * @param timestamp - Timestamp in ms being described
 * @returns String describing given timestamp
 */
export const formatWaitTimeFromTimestamp = (timestamp: number): string => {
  const waitTimeDT: DateTime = DateTime.fromMillis(timestamp);
  // Remove 'ago' from described time
  return describeTime(waitTimeDT).slice(0, -4);
};

/**
 * Helper for displaying release time info that provides the time until release and the release datetime.
 * @param timestamp - Timestamp in ms
 * @returns Object containing properties for time until release and release time.
 */
export const getReleaseTimeDataFromTimestamp = (
  timestamp: number
): { timeUntilRelease: string; releaseTime: string } => {
  const releaseTimeDT: DateTime = DateTime.fromMillis(timestamp);
  return {
    timeUntilRelease: describeTime(releaseTimeDT),
    releaseTime: makeReadableDate(releaseTimeDT, true, true),
  };
};

// TODO: Use this in grading-job-table-item -- Need to get the IDs
export const formatStudentUsernames = (usernames: string[]) => {
  <div className="text-wrap">
    {usernames.map((username) => {
      // TODO: Get user id here
      return (
        <div key={username}>
          <a href={`https://handins.ccs.neu.edu/users/${username}`}>
            {username}
          </a>
        </div>
      );
    })}
  </div>;
};
