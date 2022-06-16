import "./vendors/bootstrap.min.css";
import Navbar from "./components/navbar/navbar";
import Dashboard from "./components/dashboard/dashboard";

const App = () => {
  return (
    <div>
      <Navbar />
      <div className="container">
        <Dashboard />
      </div>
    </div>
  );
};

export default App;
