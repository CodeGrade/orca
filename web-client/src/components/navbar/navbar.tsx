import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";

const OrcaNavbar = () => {
  return (
    <Navbar bg="primary" variant="dark" className="px-3">
      <Container fluid>
        <Navbar.Brand href="#">Orca</Navbar.Brand>
        <Nav>
          <Nav.Link href="#">Dashboard</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};
export default OrcaNavbar;
