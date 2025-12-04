from fastapi import APIRouter, HTTPException, Response
from starlette.requests import Request
from grafite.db.mongodb import Mongo
from grafite.schemas.result import AddAnnotation

router = APIRouter()
db = Mongo()


@router.get("/result/{run_id}")
async def get_results(request: Request, run_id: str):
    try:
        run_db = db._get_interface_instance(run_id)
        results = run_db.get_all()
        return results
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.delete('/result/{run_id}')
async def delete_report_results(request: Request, run_id: str):
    try:       
        deleted = db.delete_collection(run_id)

        if not deleted:
            raise HTTPException(status_code=404, detail='Report results not found')

        return Response(status_code=204)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/result/{run_id}/annotation")
async def add_annotation(request: Request, body: AddAnnotation, run_id: str):
    try:
        user_email = request.headers.get("x-user-email")

        if not user_email:
            print("Missing x-user-email header")
            user_email = "unknown"

        run_db = db._get_interface_instance(run_id)

        results = run_db.match(match={ "test_id": body.test_id })

        if len(results) == 0:
            raise HTTPException(status_code=404, detail="Result not found")

        result = results[0]

        value = { "model_id": user_email, "test_justification": body.annotation, "test_score": body.score, "type": "human"}

        judgments = result.get('judge_results')

        if judgments:
            human_annotation = False

            for i, d in enumerate(judgments):
                if d.get("type") == "human":
                    judgments[i] = value
                    human_annotation = True
                    break

            if not human_annotation:
                judgments = judgments + [value]

            judge_results = judgments
        else:
            judge_results = [value]

        run_db.update_by_id(result["_id"], { "judge_results": judge_results })

        return { "judge_results": judge_results }
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))