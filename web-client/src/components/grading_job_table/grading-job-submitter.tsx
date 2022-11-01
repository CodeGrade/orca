import React from "react";

type GradingJobSubmitterProps = {
  usernames: string[];
};

const GradingJobSubmitter = ({ usernames }: GradingJobSubmitterProps) => {
  return (
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
    </div>
  );
};
export default GradingJobSubmitter;
