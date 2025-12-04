from typing import Literal

from fastapi import APIRouter, HTTPException, Response
from starlette.requests import Request

from grafite.db.mongodb import Mongo
from grafite.schemas.settings import SettingLabels

router = APIRouter(prefix="/settings")
db = Mongo()

def _get_settings_labels() -> SettingLabels:
    try:
        res = db.settings.get_by_id('labels', id_as_object=False)
        return SettingLabels(**res)
    except Exception as e:
        raise e
    
def update_array(type: Literal['issue', 'test'], field: Literal['tag', 'resolution'], new_value: str):
    setting:SettingLabels = _get_settings_labels()
    current: list[str] = setting.model_dump()[type][field]

    if not new_value in current:
        current.append(new_value)
        db.settings.update(filter={ '_id': 'labels' }, element={ f'{type}.{field}': current })



@router.get("/issue/tag")
async def get_available_issue_tags(request: Request):
    try:
        setting = _get_settings_labels()
        return setting.issue.tag
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/issue/resolution")
async def get_available_issue_resolutions(request: Request):
    try:
        setting = _get_settings_labels()
        return setting.issue.resolution
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/test/tag")
async def get_available_test_tags(request: Request):
    try:
        setting = _get_settings_labels()
        return setting.test.tag
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/issue/tag")
async def add_issue_tag(request: Request, label: str):
    try:
        update_array('issue', 'tag', label)
        
        return Response(status_code=200, content="labels")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/issue/resolution")
async def add_issue_resolution(request: Request, label: str):
    try:
        update_array('issue', 'resolution', label)
        
        return Response(status_code=200, content="labels")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/test/tag")
async def add_test_tag(request: Request, label: str):
    try:
        update_array('test', 'tag', label)

        return Response(status_code=200, content="labels")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
