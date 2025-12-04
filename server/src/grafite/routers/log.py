from fastapi import APIRouter, HTTPException
from pymongo import DESCENDING

from grafite.db.mongodb import Mongo

router = APIRouter(prefix='/logs')
db = Mongo()

@router.get("")
async def get_logs(table: str | None = None, max_results: int | None = 100):
    try:
        match = {}

        if table is not None:
            match['table'] = table

        logs = db.log.get(match=match, limit=max_results, sort=("timestamp", DESCENDING))

        return logs
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{item_id}")
async def get_logs_from_item(item_id: str, table: str | None = None, max_results: int | None = 100):
    try:
        match = {
            "item_id": item_id
        }

        if table is not None:
            match['table'] = table

        logs = db.log.get(match=match, limit=max_results, sort=("timestamp", DESCENDING))

        return logs
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


