python -m uvicorn grafite.serve.controller:app --reload --host 0.0.0.0 --port 9001

# static server (ex dockerfile) python -m grafite.serve.controller --host 0.0.0.0 --port 9001