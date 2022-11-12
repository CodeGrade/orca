import React, { useContext } from "react";
import GradingJobActions from "./grading-job-actions";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { ColumnInfo, GradingJob } from "./types";
import { TableContext } from "./grading-job-table";
import {
  formatWaitTimeFromTimestamp,
  getPropByString,
  getReleaseTimeDataFromTimestamp,
} from "../../utils/common";
import UpdatingPopover from "../common/updating-popover";

const GradingJobTableItem = ({ gradingJob }: { gradingJob: GradingJob }) => {
  const { tableConfig } = useContext(TableContext);
  const { metadata_table: metadata } = gradingJob;

  // TODO: Enforced that submitter is always here?
  const { submitter_name: submitter, usernames } = metadata;
  let studentNames: string[] = [submitter as string];
  if (usernames) studentNames = [submitter as string, usernames].flat(1);

  const now: number = new Date().getTime();
  const { release_at: releaseAt, created_at: createdAt } = gradingJob;
  const isReleased: boolean = releaseAt < now;

  const actionsPopover = (
    <Popover className="text-center">
      <Popover.Header>Actions</Popover.Header>
      <Popover.Body>
        <GradingJobActions
          jobKey={gradingJob.key}
          collation={gradingJob.collation}
          nonce={createdAt.toString()}
          released={isReleased}
        />
      </Popover.Body>
    </Popover>
  );

  const actionsRef = React.createRef<HTMLDivElement>();

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

  return (
    // TODO: Figure out better positioning - maybe use Overlay instead of Popover
    <OverlayTrigger
      trigger="click"
      placement="top"
      rootClose
      overlay={
        <UpdatingPopover
          ref={actionsRef}
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
        className={`text-wrap ${
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
