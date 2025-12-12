# Generative AI Field Tests - Running Server Locally

## Installation

To set up and run the server for local development, follow these steps after configuring the [database and RabbitMQ](#mongodb-and-rabbitmq-setup):

```
<create and activate virtual environment>

pip install -e .

```

Configure environment variables using `.env.template`.

## Running services locally

### 1. MongoDB and RabbitMQ Setup

If you want to contribute and run the app in development mode, run the [compose.yaml](../compose.yaml) using `infra` profile:

```bash
docker compose --profile infra up
```

This will run `docker compose` using only MongoDB and RabbitMQ services.

If you don't have the database ready, the app will create the database and collections with the sample data in `server/seed` folder.

**Note:** If you already have MongoDB running locally on port 27017, stop it first. Then run `docker compose` to mount the database which you can access on port 27017.

### 2. Server

```bash
sh init.sh
```

This script starts the server and makes all API endpoints available.

### 3. Test Run Pipeline

If you are running the app in development mode, start the test run pipeline after you have followed the above steps:

```bash
python src/grafite/services/digit_listener.py
```

Once running, you can access the RabbitMQ dashboard UI at `http://localhost:15672/` or via the port mentioned on the [compose.yaml](../compose.yaml)

**Note:** If you stop this service during message consumption, the most recent job will automatically be re-queued and processed again upon restart.