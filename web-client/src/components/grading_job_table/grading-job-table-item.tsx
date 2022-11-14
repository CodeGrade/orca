import React, { useContext } from "react";
import GradingJobActions from "./grading-job-actions";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { ColumnInfo, GradingJob } from "./types";
import { TableContext } from "./grading-job-table";
import {
  formatWaitTimeFromTimestamp,
  getPropByString,
  getReleaseTimeDataFromTimestamp,
} from "../../utils/common";
import UpdatingPopover from "../common/updating-popover";

/**
 * Record in the grading job table that contains the information for a single grading job.
 */
const GradingJobTableItem = ({ gradingJob }: { gradingJob: GradingJob }) => {
  const { tableConfig } = useContext(TableContext);
  const { metadata_table: metadata } = gradingJob;

  // TODO: Can we assume that submitter is always here?
  const { submitter_name: submitter, usernames } = metadata;
  let studentNames: string[] = [submitter as string];
  if (usernames) studentNames = [submitter as string, usernames].flat(1);

  const now: number = new Date().getTime();
  const { release_at: releaseAt, created_at: createdAt } = gradingJob;
  const isReleased: boolean = releaseAt < now;

  /**
   * Create table data element using provided property string on a grading job.
   * @param prop - String of path to property within a GradingJob object
   * @param ind - Column index used as component key
   * @returns Table data element with data from given property
   */
  // TODO: Test for when data is missing
  const createTableData = (prop: string, ind: number) => {
    let data = getPropByString(gradingJob, prop) || null;
    let tooltip = null;
    if (prop === "created_at") data = formatWaitTimeFromTimestamp(data);
    else if (prop === "release_at") {
      const { timeUntilRelease, releaseTime } =
        getReleaseTimeDataFromTimestamp(data);
      tooltip = releaseTime;
      data = timeUntilRelease;
    } else if (prop.endsWith(".url")) data = <a href={`${data}`}>View</a>;
    else if (prop.endsWith(".submitter_name")) {
      // TODO: Decide how to handle this
      data = <div className="text-wrap">{studentNames}</div>;
    }
    return (
      <td data-toggle="tooltip" title={tooltip ? tooltip : undefined} key={ind}>
        {data}
      </td>
    );
  };

  // TODO: Add some effect for currently selected graidng job ??
  return (
    // TODO: Figure out better positioning - maybe use Overlay instead of Popover
    <OverlayTrigger
      trigger="click"
      placement="top"
      rootClose
      overlay={
        <UpdatingPopover
          title={"Actions"}
          // onClick={() => document.body.click()} // Used to close the actions popover when an action button is clicked
        >
          <GradingJobActions
            jobKey={gradingJob.key}
            collation={gradingJob.collation}
            nonce={gradingJob.nonce}
            released={isReleased}
          />
        </UpdatingPopover>
      }
    >
      <tr
        className={`grading-job-item text-wrap ${
          isReleased ? "table-success" : "table-primary"
        }`}
      >
        {tableConfig.map((colInfo: ColumnInfo, ind) => {
          const { prop } = colInfo;
          return createTableData(prop, ind);
        })}
      </tr>
    </OverlayTrigger>
  );
};
export default GradingJobTableItem;
