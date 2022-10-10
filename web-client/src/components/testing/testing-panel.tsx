import React, { useState } from "react";
import { createOrUpdateXGradingJobs } from "../../services/grading-job-services";

const TestingPanel = () => {
  const [jobs_input, setJobsInput] = useState("");
  const handleCreateJobs = async () => {
    if (isNaN(Number(jobs_input))) return;
    const jobs_to_create = Number(jobs_input);
    if (!jobs_to_create) return;

    const start_time = performance.now();
    const responses = await createOrUpdateXGradingJobs(jobs_to_create);
    const end_time = performance.now();
    console.log(
      `Creating/Updating ${jobs_to_create} jobs took: ${
        end_time - start_time
      } ms`
    );
    setJobsInput("");

    // window.location.reload();
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
          value={jobs_input}
          onChange={(event) => setJobsInput(event.target.value)}
        />
      </div>
    </div>
  );
};
export default TestingPanel;
