# Orca: A Computer Science Grading Service

Orca is a grading job ecosystem to be used in tandem with Bottlenose, a web application used to host computer science courses.

| Directory   | Description                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| docs/       | Documentation, design specs, and diagrams to provide developers with the proper knowledge to contribute to Orca. |
| grading-vm/ | Contains the logic for grading a submission with a given `GradingJob`.                                           |
| web-client/ | React application logic for allowing professors and admins to manage the grading queue.                          |
| web-server/ | Express API/back end for queue management.                                                                       |

## Stack

Orca expects the following tools with these versions:

- Redis 7.0 (Grading Queue)
- Node 16.15.0 (Web Server and Client)
- Python 3.8.10 (Grading VM)

## Local Development

All local development is expected to be done in an environment running on **Ubuntu 20.04**.

This can either be done with a machine directly running the OS or with a Windows machine running WSL2.

For instructions about how to set up Ubuntu through WSL2 and Windows Terminal, [visit this page](https://ubuntu.com/tutorials/install-ubuntu-on-wsl2-on-windows-10#1-overview). For a more "aesthetic" and informative bash experience, developers can also set up [Starship](https://starship.rs/). Make sure to also add VSCode integration with the WSL2 terminal.

Orca also uses Docker for local development and as a feature in the Grading VM. Docker should be on the host machine, either with Docker Desktop or Docker Community Edition installed in the shell.

### TypeScript Tools

Orca uses `yarn` as its package manager over `npm`. It also implements `eslint` and `prettier` across its TypeScript components.

### VSCode Extensions

The following VSCode extensions are expected to be installed for the best development experience:

- **WSL** - allows direct access to code with Ubuntu (bash) terminal.
- **Prettier** - used for enforcing code style and formatting files.
- **ESLinter** - used for enforcing TypeScript code guidelines and error detection.
- **Python** - used for IDE linting of Python code.
