#!/bin/bash
if [ ! -d ~/.nvm ]; then
  echo "Please ensure Node Version Manager (nvm) is installed on your machine."
  exit 1
fi
source ~/.nvm/nvm.sh
cd orchestrator
nvm use
./init_dev.sh
cd ../grading-vm
./init_dev.sh