pipenv install > /dev/null
# TODO: We need to actually pass in the files to this script.
cat assets/test-script.json | pipenv run python3 do_grading.py