from fastapi import APIRouter, HTTPException, Response
from starlette.requests import Request

from grafite.schemas.test import CreateTest, UpdateTest
from grafite.schemas.common import SingleFieldBody
from grafite.db.mongodb import Mongo

router = APIRouter()
db = Mongo()

@router.get("/test")
async def get_all_tests(request: Request):
    try:
        test_list = db.test.get_all()
        return test_list
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/test/{test_id}")
async def get_test(request: Request, test_id:str):
    try:
        test = db.test.get_by_id(id=test_id)
        return test
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/test")
async def save_test(request: Request, test: CreateTest):
    try:
        id = db.test.save(elements=[test])
        return Response(status_code=200, content=str(id[0]))
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/test/{test_id}")
async def update_test(request: Request, test_id:str, test: UpdateTest):
    try:
        db.test.update_by_id(id=test_id, element=test)
        return Response(status_code=200, content="success")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/test/{test_id}")
async def update_test_field(request: Request, test_id:str, body: SingleFieldBody):
    try:
        db.test.update_by_id(id=test_id, element=body)
        return Response(status_code=200, content="success")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

