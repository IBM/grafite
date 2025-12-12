import logging
import os

# load environment
from dotenv import load_dotenv, find_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from bson.objectid import ObjectId
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv(find_dotenv())


class MongoInterface:
    def __init__(self, uri:str = None) -> None:
        mongo_uri = uri or os.getenv("MONGO_URI")
        self.mongo = MongoClient(mongo_uri)
        self.db = self.mongo['grafite']
        
        self.collection:Collection = None

    def _convert_to_document_list(self, elements: list[BaseModel] | list[dict]):
        if len(elements) > 0 and isinstance(elements[0], BaseModel):
            elements = [el.model_dump() for el in elements]    
        return elements
    
    def _stringify_objectid(self, elements: list[dict] | dict | None):
        def f(x):
            if x is None:
                return x

            if "_id" in x:
                x["_id"] = str(x["_id"]) 
            return x
        
        if isinstance(elements, list):
            return [f(el) for el in elements]
        
        return f(elements)

    # # # GET # # # # # # # # # # # # # 
    def get_all(self, projection={}):
        ls = list(self.collection.find(
            filter={}, 
            projection=projection
        )) 
        return self._stringify_objectid(ls)

    def get(self, match:dict, fields:dict={}, limit: int | None = None, sort: tuple[str, int] | None = None):
        cursor = self.collection.find(match, fields)

        if sort is not None:
            field, direction = sort
            cursor = cursor.sort(field, direction)

        if limit is not None:
            cursor = cursor.limit(limit=limit)

        return self._stringify_objectid(list(cursor))   

    def get_by_id(self, id: str, id_as_object: bool = True):
        processed_id = ObjectId(id) if id_as_object else id
        
        refs = self.collection.find_one({"_id": processed_id})
        return self._stringify_objectid(refs)

    # # # MATCH # # # # # # # # # # # # # 
    def match(self, match:dict):
        refs = list(self.collection.find(match))
        return self._stringify_objectid(refs)
    
 
    # # # SAVE # # # # # # # # # # # # # 
    def save(self, elements: list[dict] | list[BaseModel]):
        logger.info(elements)
        
        elements = self._convert_to_document_list(elements)
        if len(elements) > 0:
            result = self.collection.insert_many(elements)
            return result.inserted_ids
        return []
    
    # # # UPDATE # # # # # # # # # # # # # 
    def update(self, filter:dict, element: dict | BaseModel):
        logger.info(filter)
        logger.info(element)
        
        if not isinstance(element, dict):
            element = element.model_dump()

        return self.collection.find_one_and_update(
            filter=filter,
            update={"$set": element}
        )

    def update_by_id(self, id:str, element: dict | BaseModel):        
        if not isinstance(element, dict):
            element = element.model_dump(exclude_defaults=True)
        return self.update(filter={"_id": ObjectId(id)}, element=element)
    

    def save_new_collection(self, name: str, values: list[dict]):
        if name not in self.db.list_collection_names():
            self.collection = self.db.create_collection(name)
            result = self.collection.insert_many(values)
            return result.inserted_ids
        return ""

    # # # DELETE # # # # # # # # # # # # # 
    def delete_one(self, filter: dict):
        elements = self.match(match=filter)
        
        if len(elements) > 1:
            raise Exception('More than one instance found, expected a single result')

        result = self.collection.delete_one(filter=filter)

        return result.deleted_count 
    
    def delete_collection(self, collection_name: str):
        return self.db.drop_collection(collection_name)
    
    def count_documents(self, filter: dict = {}) -> int:
        return self.collection.count_documents(filter=filter)

