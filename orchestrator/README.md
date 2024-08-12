# Orca Web Server

Orca's web server is designed to receive grading jobs from Bottlenose and push them onto the grading queue accordingly.

## API Key Scripts

Users running the orchestator can run the following scripts for interacting with API keys:
* `yarn generate-api-key -h <hostname>`
* `yarn list-api-keys -h <hostname>`
* `yarn delete-api-key -h <hostname> -k <apikey>`

**NOTE:** The `POSTGRES_URL` envirnoment variable _must be set_ in order to run these scripts.
