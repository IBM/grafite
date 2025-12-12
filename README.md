# Generative AI Field Tests

Generative AI Field Tests (GraFiTe) is an application for continuous large language model (LLM) evaluation.

## Features

- **Model Problem Repository:** Establish a repository for model issues along with quality assurance (QA) tests.
- **LLM Assessment Pipeline:** Run a pipeline that evaluates LLMs against these identified issues using both LLM-as-a-judge techniques and human intervention.
- **Comparative Model Analysis:** Enable side-by-side assessments of multiple LLMs across different versions, facilitating comparisons over time to track performance improvements or regressions.
- **Visualization Dashboard:** Conduct a streamlined assessment through an intuitive visualization dashboard that presents evaluation results clearly and effectively.


## Getting Started

### Run the application locally using docker

1. Create Environment Configuration Files

    Create .env.container in both the `client` and `server` directories using the provided `.env.container.template` files in each folder as a reference.
2. Configure Models for Client Dockerfile

    Modify the models you want to use by editing the Dockerfile located in the client directory. For further details, please check out [client README](./client/README.md). 
    
    GraFiTe supports Ollama (client, server) and WatsonX AI (server) for model inference. If you use Ollama, **please make sure that you have the model available on your machine.**
```
...
ENV NEXT_PUBLIC_JUDGE_MODEL=<<model_id>>

# Use three models for ensemble judge mode
ENV NEXT_PUBLIC_ENSEMBLE_JUDGE_MODELS=<<model_id_1,model_id_2,model_id_3>>
ENV NEXT_PUBLIC_DESIRED_OUTPUT_MODEL=<<model_id>>
ENV NEXT_PUBLIC_TEST_DEFAULT_MODEL=<<model_id>>
ENV NEXT_PUBLIC_TEST_DEFAULT_MODEL_DISPLAY=<<model_display_name>>
...
```

3. Start the Application

    This command will build and start the application using docker compose, utilizing the configuration defined in the `.env.container` files. You can view the app at http://localhost:3000.

    If you don't have the database ready, the app will create the database and collections with the sample data in `server/seed` folder.

```bash
docker compose --profile app up
```


### Local Development
For local development, please refer to the Server and Client READMEs below for detailed instructions:

- [Server](./server/README.md)
- [Client](./client/README.md)