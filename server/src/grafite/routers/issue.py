from fastapi import APIRouter, HTTPException, Response
from starlette.requests import Request

from grafite.schemas.issue import CreateIssue, UpdateIssue
from grafite.schemas.common import SingleFieldBody
from grafite.db.mongodb import Mongo

router = APIRouter()
db = Mongo()

@router.get("/issue")
async def get_all_issues(request: Request):
    try:
        issue_list = db.issue.get_all()
        return issue_list
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/issue/{issue_id}")
async def get_issue(request: Request, issue_id:str):
    try:
        issue = db.issue.get_by_id(id=issue_id)
        return issue
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/issue")
async def save_issue(request: Request, issue: CreateIssue):
    try:
        id = db.issue.save(elements=[issue])
        return Response(status_code=200, content=str(id[0]))
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/issue/{issue_id}")
async def update_issue(request: Request, issue_id:str, issue: UpdateIssue):
    try:
        db.issue.update_by_id(id=issue_id, element=issue)
        return Response(status_code=200, content="success")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    

@router.patch("/issue/{issue_id}")
async def update_issue_field(request: Request, issue_id:str, body: SingleFieldBody):
    try:
        db.issue.update_by_id(id=issue_id, element=body)
        return Response(status_code=200, content="success")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

