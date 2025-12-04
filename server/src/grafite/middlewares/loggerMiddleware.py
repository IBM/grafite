import json
import re 

from datetime import datetime, timezone
from grafite.schemas.log import Log

from starlette.concurrency import iterate_in_threadpool
from starlette.middleware.base import BaseHTTPMiddleware



class LoggerMiddleware(BaseHTTPMiddleware):
    
    def __init__(self, app, db, dispatch = None):
        self.db = db
        super().__init__(app, dispatch)
    
    
    async def dispatch(self, request, call_next):
        if request.method == 'GET':
            response = await call_next(request)
            return response

        user_email = request.headers.get("x-user-email")
        
        if not user_email:
            # raise HTTPException(status_code=401, detail="Missing x-user-email header")
            print("Missing x-user-email header")
            user_email = "unknown"

        url_parts = request.url.path.split('/')

        try:
            table = url_parts[2]
        except Exception as e:
            print(str(e))
            table = ""

        body_str = (await request.body()).decode()

        body = json.loads(body_str) if body_str != '' else None
        
        # Hide credentials from logs 
        if table == 'user' and isinstance(body, dict):
            for key,value in body.items():
                if not isinstance(value, str):
                    value = json.dumps(value)

                body[key] = re.sub(r'.', "*", value)
        
        item_id = None if request.method == 'POST' else url_parts[-1]

        log = Log(
            item_id=item_id,
            method=request.method, 
            payload=body,
            table=table,
            timestamp=datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S'),
            target_url=request.url.path,
            user=user_email
        )

        response = await call_next(request)
        
        try:
            # If we are creating a new item, we need to grab the item_id from the response 
            # to save it to the logs
            
            if log.method == "POST" and not log.item_id:
                # 1. Read the entire response body
                response_body = [chunk async for chunk in response.body_iterator]

                if response_body:
                    item_id = response_body[0].decode()
                    log.item_id = item_id

                # 2. Re-create the body_iterator to allow the response to be sent to the client
                # This is crucial because iterating over body_iterator consumes it.
                response.body_iterator = iterate_in_threadpool(iter(response_body))
        
        except Exception as e:
            print(str(e))
        
        
        self.db.log.save([log])
        
        return response