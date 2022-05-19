pipenv install
pipenv shell 
# TODO: We need to actually pass in the files to this script.
cat assets/test-script.json | python3 do_grading.py