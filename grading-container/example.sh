docker run -p 6379:6379 -d redis:7
python3 tests/scripts/seed_test_db.py tests/fixtures/files/live-URL-student-only.json
docker build . -t orca-grading-container
docker run orca-grading-container
# TODO: Figure out how to connect the network
# TODO: kill Redis container. Ideally, orca-grading-container is dead after completing its task.
