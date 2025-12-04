from grafite.db._mongodb_interface import MongoInterface
from bson.objectid import ObjectId

class Mongo:
    def __init__(self, uri:str=None) -> None:
        self.uri = uri

        self.feedback = self._get_interface_instance('feedback')
        self.issue = self._get_interface_instance('issue')
        self.test = self._get_interface_instance('test')
        self.run = self._get_interface_instance("run")
        self.settings = self._get_interface_instance("settings")
        self.log = self._get_interface_instance("logs")
        self.user = self._get_interface_instance("user")
    
    
    def _get_interface_instance(self, name:str):
        m = MongoInterface(self.uri)
        m.collection = m.db.get_collection(name)
        return m
    
    def save_new_collection(self, name: str, values: list[dict]):
        MongoInterface(self.uri).save_new_collection(name=name, values=values)

    def convert_to_objectid(self, to_convert:str | list[str]):
        if isinstance(to_convert, str):
            return ObjectId(to_convert)
        
        if isinstance(to_convert, list):
            return [ObjectId(i) for i in to_convert]

    def delete_collection(self, collection_name: str):
        result = MongoInterface(self.uri).delete_collection(collection_name)

        # If the collection was deleted, ns attribute exists
        return result.get('ns') is not None

