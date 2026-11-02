from datetime import datetime, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from grafite.routers import result

app = FastAPI()
app.include_router(result.router, prefix="/api")
client = TestClient(app)


def make_run_id(date: datetime) -> str:
    # Same format as TestRunnerWrapper.run_id
    return f"run_{date.strftime('%Y%m%d%H%M%S')}"


NOW_RUN_ID = make_run_id(datetime.now(timezone.utc))


@pytest.mark.parametrize("name", [
    "settings", "issue", "test", "run", "user", "logs",
    NOW_RUN_ID[:-1],          # timestamp missing a digit
    NOW_RUN_ID + "0",         # timestamp with an extra digit
    NOW_RUN_ID + "x",
    NOW_RUN_ID + "%0A",       # trailing newline
])
def test_rejects_non_run_collections(name):
    assert client.get(f"/api/result/{name}").status_code == 422
    assert client.delete(f"/api/result/{name}").status_code == 422
    resp = client.post(f"/api/result/{name}/annotation", json={"test_id": "t0", "annotation": "x", "score": 1})
    assert resp.status_code == 422


@pytest.mark.parametrize("run_id", [
    NOW_RUN_ID,
    make_run_id(datetime(2025, 12, 19, 20, 37, 20)),
    make_run_id(datetime(2031, 1, 1, 0, 0, 0)),
])
def test_accepts_run_id(mocker, run_id):
    db = mocker.patch.object(result, "db")
    db._get_interface_instance.return_value.get_all.return_value = [{"test_id": "t0"}]

    resp = client.get(f"/api/result/{run_id}")

    assert resp.status_code == 200
    assert resp.json() == [{"test_id": "t0"}]
    db._get_interface_instance.assert_called_once_with(run_id)
