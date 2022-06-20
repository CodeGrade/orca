import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import gradingJobReducer from "./reducers/grading-job-reducer";
import Navbar from "./navbar/navbar";
import Dashboard from "./dashboard/dashboard";

// const reducer = {
//   grading_jobs: gradingJobReducer,
// };
const reducer = gradingJobReducer;

const store = configureStore({ reducer });

const Orca = () => {
  return (
    <Provider store={store}>
      <Navbar />
      <Dashboard />
    </Provider>
  );
};
export default Orca;
