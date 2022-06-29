import React from "react";

const WaitTimes = (): JSX.Element => {
  return (
    <div className="d-flex justify-content-center mt-3">
      <ul className="list-group list-group-horizontal text-center">
        <li className="list-group-item list-group-item-success">
          <div className="border-bottom border-success">Min Wait Time</div>
          <div>HH:MM:SS</div>
        </li>
        <li className="list-group-item list-group-item-info">
          <div className="border-bottom border-info">Avg Wait Time</div>
          <div>HH:MM:SS</div>
        </li>
        <li className="list-group-item list-group-item-danger">
          <div className="border-bottom border-danger">Max Wait Time</div>
          <div>HH:MM:SS</div>
        </li>
      </ul>
    </div>
  );
};
export default WaitTimes;
