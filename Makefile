ORCA_TESTING_NETWORK = $(shell docker network ls --format {{.Name}} | grep 'orca-testing')

all: build run

build:
	@if [ ! -d "web-server/files" ]; then \
		echo "Creating static file directory in web-server..."; \
		mkdir web-server/files; \
		echo "Created."; \
	fi
	@if [ ! $(ORCA_TESTING_NETWORK) ]; then \
		echo "Creating network orca-testing..."; \
		docker network create orca-testing > /dev/null; \
		echo "Created."; \
	fi
	@docker build -t orca-grader-base -f grading-vm/images/orca-grader-base.Dockerfile grading-vm/
	@docker build -t orca-java-grader -f grading-vm/images/java-grader.Dockerfile grading-vm/
	@docker save --output web-server/files/orca-java-grader.tgz orca-java-grader
	@docker build -t orca-web-server -f web-server/Dockerfile web-server/
	@docker build -t echo-server -f grading-vm/images/testing/echo-server/Dockerfile grading-vm/images/testing/echo-server/
	@docker build -t simple-server -f grading-vm/images/testing/simple-server/Dockerfile grading-vm/images/testing/simple-server



run:
	@docker compose up
