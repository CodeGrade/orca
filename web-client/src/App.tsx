import React from "react";
import "./App.css";
import "./vendors/bootswatch/lux/bootstrap.min.css";
import { Provider } from "react-redux";
import OrcaNavbar from "./components/navbar/navbar";
import Dashboard from "./components/dashboard/dashboard";
import gradingJobReducer from "./components/reducers/grading-job-reducer";
import { configureStore } from "@reduxjs/toolkit";

const reducer = gradingJobReducer;
const store = configureStore({ reducer });

const App = () => {
  return (
    <Provider store={store}>
      <OrcaNavbar />
      <Dashboard />
    </Provider>
  );
};

export default App;
