from test_runner_service.schemas import ModelSource, Credentials
from test_runner_service.providers.provider import Provider
from test_runner_service.providers.watsonx import WatsonXProvider
from test_runner_service.providers.ollama import OllamaProvider

class ProviderFactory:
    @staticmethod
    def create(       
        source: ModelSource,
        credentials: Credentials
    ) -> Provider:
        if source == 'ollama':
            return OllamaProvider()
        elif source == 'watsonx':
            return WatsonXProvider(
                api_key=credentials.watsonx_api_key, 
                project_id=credentials.watsonx_project_id
            )
        else:
            raise Exception("Invalid 'source'")