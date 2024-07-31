import { DateTime } from 'luxon';

export const filterNull = (arr: any[]): any[] => {
  return arr.filter((x) => x);
};

export const reservationWaitingOnRelease = (releaseAt: Date): boolean => {
  return releaseAt.getTime() - new Date().getTime() > 0;
}

export const describeReleaseTiming = (releaseAt: Date) => {
  const luxonReleaseAt = DateTime.fromJSDate(releaseAt);
  return `This job will be released ${luxonReleaseAt.toRelative()}.`;
}
