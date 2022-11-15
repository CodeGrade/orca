docker run -p 6379:6379 --network=bridge --name="redis-test-db" -d redis:7
docker build --build-arg REDIS_URL=redis://host.docker.internal:6379 -t orca-grading-container -f container_test.Dockerfile .
docker run -e "REDIS_URL=redis://host.docker.internal:6379" --network=bridge --name grader orca-grading-container
docker kill redis-test-db && docker container rm redis-test-db grader
