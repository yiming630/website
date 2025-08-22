# SeekHub_Demo
Demo Product

running commands to set up the repo:
git clone ......

python3 -m venv .venv && source .venv/bin/activate

pip install -r requirements.txt


# 2-C  run locally
export GEMINI_API_KEY="XXX"
uvicorn translator.main:app --reload
# Test:
curl -X POST http://127.0.0.1:8000/translate \
     -H "Content-Type: application/json" \
     -d '{"text":"Hello world!"}'

