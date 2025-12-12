import os
from pathlib import Path
import json
from contextlib import asynccontextmanager
import argparse
import uvicorn
from fastapi import FastAPI
from starlette.requests import Request

from fastapi.middleware.cors import CORSMiddleware
from grafite.middlewares.loggerMiddleware import LoggerMiddleware
from starlette.middleware.sessions import SessionMiddleware
from bson.objectid import ObjectId

from grafite.routers import (
    feedback,
    issue,
    run,
    test,
    result,
    settings,
    log
)
from grafite.db.mongodb import Mongo

db = Mongo()

API_PREFIX = "/api"


def seed_db():
    issue_coll_is_empty = db.issue.count_documents() == 0
    tests_coll_is_empty = db.test.count_documents() == 0
    runs_coll_is_empty = db.run.count_documents() == 0
    settings_coll_is_empty = db.settings.count_documents() == 0

    needs_seed = issue_coll_is_empty or tests_coll_is_empty or settings_coll_is_empty or runs_coll_is_empty
    
    if needs_seed:
        print('Seeding database...')

        seed_dir = os.getenv("SEED_PATH")

        if seed_dir is None:
            raise Exception('"SEED_PATH" environment variable is required')

        files = os.listdir(seed_dir)

        for file in files:
            coll_name = file.split('.json')[0]

            with open(f"{seed_dir}/{file}") as f:
                data = json.load(f)

                for index, value in enumerate(data):
                    if "$oid" in value["_id"] and ObjectId.is_valid(value["_id"]["$oid"]):
                        data[index]["_id"] = ObjectId(value["_id"]["$oid"])

                coll = db._get_interface_instance(coll_name)

                coll.save_new_collection(coll_name, data)


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_db()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(SessionMiddleware, secret_key="!secret")
app.add_middleware(CORSMiddleware,
                   allow_origins=["*"],
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"]
                   )
app.add_middleware(LoggerMiddleware, db=db)


@app.get('/')
def home(request: Request):
    return {"hey": "you"}


app.include_router(feedback.router, prefix=API_PREFIX, tags=["Feedback"])
app.include_router(issue.router, prefix=API_PREFIX, tags=["Issue"])
app.include_router(test.router, prefix=API_PREFIX, tags=["Test"])
app.include_router(run.router, prefix=API_PREFIX, tags=["Test Runner"])
app.include_router(result.router, prefix=API_PREFIX, tags=["Result"])
app.include_router(settings.router, prefix=API_PREFIX, tags=["Setting"])
app.include_router(log.router, prefix=API_PREFIX, tags=["Log"])

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", type=str, default="localhost")
    parser.add_argument("--port", type=int, default=21001)

    args = parser.parse_args()
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")
