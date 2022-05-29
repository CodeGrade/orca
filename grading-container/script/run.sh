python -m pipenv install
# TODO: We need to actually pass in the files to this script.
cat tests/fixtures/files/test-job.json | pipenv run python3 do_grading.py