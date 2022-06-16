import React from "react";

const Navbar = () => {
  return (
    <nav className="navbar navbar-dark bg-primary">
      <div className="container-fluid">
        <a href="#" className="navbar-brand">
          Orca
        </a>
        <ul className="navbar-nav">
          <li className="nav-item active">
            <a href="#" className="nav-link">
              Dashboard
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};
export default Navbar;
