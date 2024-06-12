#!/bin/bash

activate_nvm() {
  if [ ! -d ~/.nvm ]; then
    echo "Please ensure Node Version Manager (nvm) is installed on your machine."
    exit 1
  fi
  source ~/.nvm/nvm.sh
}

init_docker_utils() {
  docker volume create db-data
}

init_dev_orchestrator() {
  cd orchestrator
  nvm use
  ./init_dev.sh
}

init_dev_worker() {
  cd ../grading-vm
  ./init_dev.sh
}

activate_nvm
init_docker_utils
init_dev_orchestrator
init_dev_worker
