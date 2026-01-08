import pytest
from copy import deepcopy
from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)
_initial_state = deepcopy(activities)


@pytest.fixture(autouse=True)
def reset_state():
    """Reset in-memory data before each test to keep cases isolated."""
    activities.clear()
    activities.update(deepcopy(_initial_state))


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_for_activity_success():
    email = "newstudent@mergington.edu"
    response = client.post(
        "/activities/Basketball/signup",
        params={"email": email},
    )
    assert response.status_code == 200
    assert email in activities["Basketball"]["participants"]


def test_signup_for_activity_duplicate():
    email = _initial_state["Chess Club"]["participants"][0]
    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": email},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_for_activity_full():
    max_slots = _initial_state["Tennis Club"]["max_participants"]
    activities["Tennis Club"]["participants"] = [
        f"player{i}@mergington.edu" for i in range(max_slots)
    ]

    response = client.post(
        "/activities/Tennis Club/signup",
        params={"email": "extra@mergington.edu"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"


def test_remove_participant_success():
    email = _initial_state["Drama Club"]["participants"][0]
    response = client.delete(
        "/activities/Drama Club/participants",
        params={"email": email},
    )
    assert response.status_code == 200
    assert email not in activities["Drama Club"]["participants"]


def test_remove_participant_not_found():
    response = client.delete(
        "/activities/Tennis Club/participants",
        params={"email": "nobody@mergington.edu"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Student not registered for this activity"
