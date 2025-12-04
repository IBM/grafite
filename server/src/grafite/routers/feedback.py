from fastapi import APIRouter, HTTPException, Response
from starlette.requests import Request

from grafite.schemas.feedback import Feedback
from grafite.db.mongodb import Mongo

router = APIRouter()
db = Mongo()

@router.get("/feedback")
async def get_all_feedbacks(request: Request):
    try:
        feedback_list = db.feedback.get_all()
        return feedback_list
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/feedback/{feedback_id}")
async def get_feedback(request: Request, feedback_id:str):
    try:
        feedback = db.feedback.get_by_id(id=feedback_id)
        return feedback
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/feedback")
async def save_feedback(request: Request, feedback: Feedback):
    try:
        id = db.feedback.save(elements=[feedback])
        return Response(status_code=200, content=str(id[0]))
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

