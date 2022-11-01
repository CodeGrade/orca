import React, { useState } from "react";
import { createOrUpdateXGradingJobs } from "../../services/grading-job-services";

const TestingPanel = () => {
  const [jobsInput, setJobsInput] = useState("");
  const handleCreateJobs = async () => {
    if (isNaN(Number(jobsInput))) return;
    const jobsToCreate = Number(jobsInput);
    if (!jobsToCreate) return;

    const startTime = performance.now();
    const responses = await createOrUpdateXGradingJobs(jobsToCreate);
    const endTime = performance.now();
    console.log(
      `Creating/Updating ${jobsToCreate} jobs took: ${endTime - startTime} ms`
    );
    setJobsInput("");
    window.location.reload();
  };
  return (
    <div>
      <hr />
      <h1>Testing</h1>
      <div className="input-group mb-3 w-50">
        <button
          className="btn btn-primary"
          type="button"
          onClick={async () => await handleCreateJobs()}
        >
          Create/Update Jobs
        </button>
        <input
          type="text"
          className="form-control border border-dark"
          value={jobsInput}
          onChange={(event) => setJobsInput(event.target.value)}
        />
      </div>
    </div>
  );
};
export default TestingPanel;
