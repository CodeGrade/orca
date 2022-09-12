import React from "react";

interface GradingJobSubmitter {
  user_names: string[];
}

const GradingJobSubmitter = ({ user_names }: GradingJobSubmitter) => {
  return (
    <div className="text-wrap">
      {user_names.map((user_name) => {
        // TODO: Get user id here
        return (
          <div key={user_name}>
            <a href={`https://handins.ccs.neu.edu/users/${user_name}`}>
              {user_name}
            </a>
          </div>
        );
      })}
    </div>
  );
};
export default GradingJobSubmitter;
