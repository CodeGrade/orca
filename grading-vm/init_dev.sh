if [ -d ".venv" ]; then
  echo "Creating virtual environment..."
  python -m venv .venv
  echo "Created."
fi
source .venv/bin/activate
python -m pip install -r requirements.txt

if [ ! -f ".env" ]; then
  echo "Creating .env from .default.env..."
  cp .default.env .env
  echo "Created."
fi
echo "Please change make any desired environment variable changes in .env." 

docker build -t orca-grader-base -f images/orca-grader-base.Dockerfile .
docker build -t orca-java-grader -f images/java-grader.Dockerfile .
docker save orca-java-grader -o images/testing/simple-server/files/images/orca-java-grader.tgz
docker build -t simple-server -f images/testing/simple-server/Dockerfile images/testing/simple-server