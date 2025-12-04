# Generative AI Field Tests - Running Client Locally

## Installation

To set up and run the application for local development, follow these steps after configuring the [server](../server/README.md) and [database](#database):

```bash
npm i
npm run dev
```

Before committing, run `npm run fix` to apply quick styling corrections. For other linting scripts, please check [package.json](./package.json)

## Database

The current app uses MongoDB as the database. For detailed information on setting up and managing the database, please refer to the [server README](../server/README.md).

## Model Endpoints

There are two places in the app where the model endpoints are used. To enable these features, ensure that the appropriate environment variables are set.

1. **QA Test Creation:** We support Ollama for model inferencing to create QA tests 
2. **Test Run Pipeline:** Although test run pipeline is handled by the server, in case you use WatsonX AI, you can select the model to evaluate from GUI dropdown by setting up the environment variables.  

The models used by the application can be specified through the following environment variables:

- `NEXT_PUBLIC_JUDGE_MODEL`: Model used for the LLM judge validation. Default model is `llama3.3` (`llama3.3:70b`).
- `NEXT_PUBLIC_DESIRED_OUTPUT_MODEL`: Model for desired ouptut. Default model is `mistral-small3.1` (`mistral-small3.1:24b`).
- `NEXT_PUBLIC_TEST_DEFAULT_MODEL`: Model for regression tests issue validation. Default model is `granite4:small-h`
- `NEXT_PUBLIC_TEST_DEFAULT_MODEL_DISPLAY`: The same model as the above but a name to be displayed on the UI. Default value is `granite4:small-h`

If you use Ollama for inference, **please make sure that you have the model available on your machine.**

## Constant Values

Default inference parameters are on `utils/constants.ts`

## Auth

By default, the app bypasses the authorization configured through NextAuth. To enable authorization, modify [auth.ts](./src/app/auth.ts) file.