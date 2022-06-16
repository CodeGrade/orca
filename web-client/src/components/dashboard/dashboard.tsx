import React from "react";
import WaitTimes from "../wait-times/wait-times";
import Queue from "../queue/queue";

const Dashboard = () => {
  return (
    <div className="row">
      <WaitTimes />
      <div className="mt-2">
        <Queue />
      </div>
    </div>
  );
};
export default Dashboard;
