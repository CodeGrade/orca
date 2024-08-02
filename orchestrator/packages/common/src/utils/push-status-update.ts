import { JobStatus } from "../types";

export const pushStatusUpdate = async (status: JobStatus, responseURL: string, key: string): Promise<void> => {
  // NOTE: This is meant to be 'fire-and-forget,' -- we don't care about errors
  // beyond logging.
  try {
    const body = JSON.stringify({ key, status });
    await fetch(responseURL, { body, method: 'POST', headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(`Could not POST status update to ${responseURL}; ${err instanceof Error ? err.message : err}`);
  }
};
