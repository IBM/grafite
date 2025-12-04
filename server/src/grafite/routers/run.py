from fastapi import APIRouter, HTTPException, Response
from starlette.requests import Request
from grafite.db.mongodb import Mongo

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()
db = Mongo()


@router.get("/run")
async def get_all_runs(request: Request):
    try:
        projection = { "task":False }
        results = db.run.get_all(projection=projection)
        for result in results:
            if isinstance(result.get("config"), str):
                del result['config']
            
        return results
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/run/{run_id}")
async def get_run(request: Request, run_id: str):
    try:
        # get by run name
        run = db.run.match({"run_id": run_id})
        if len(run) > 0:
            return run[0]

        run = db.run.get_by_id(id=run_id)
        return run
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.delete('/run/{run_id}')
async def delete_report(request: Request, run_id: str):
    try:
        deleted_count = db.run.delete_one({"run_id": run_id})

        if deleted_count == 0:
            raise HTTPException(status_code=404, detail='Report not found')
            
        return Response(status_code=204)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# @router.get("/run/{creator}")
# async def get_user_runs(request: Request, creator: str):
#     try:
#         run = db.run.match({"creator": creator})
#         return run
#     except Exception as e:
#         raise HTTPException(status_code=404, detail=str(e))


# @router.get("/run/{creator}/{run_id}")
# async def get_user_run(request: Request, creator: str, run_id:str):
#     try:
#         run = db.run.match({"creator": creator, "run_id": run_id})
#         if len(run) > 0:
#             return run[0]

#         run = db.run.get_by_id(id=run_id)
#         return run
#     except Exception as e:
#         raise HTTPException(status_code=404, detail=str(e))
