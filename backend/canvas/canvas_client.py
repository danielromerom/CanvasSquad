import requests
from urllib.parse import urljoin

class CanvasClient:
    def __init__(self, base_url, token):
        self.base_url = base_url.rstrip("/") + "/"
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {token}"
        })

    def list_assignments(self, course_id):
        url = urljoin(self.base_url, f"/api/v1/courses/{course_id}/assignments")
        r = self.session.get(url, params={"per_page": 100})
        r.raise_for_status()
        return r.json()

    def list_courses(self):
        url = urljoin(self.base_url, "/api/v1/courses")
        r = self.session.get(
            url,
            params={
                "per_page": 100,
                "enrollment_state": "active"
            }
        )
        r.raise_for_status()
        return r.json()

    def list_modules(self, course_id):
        url = urljoin(self.base_url, f"/api/v1/courses/{course_id}/modules")
        r = self.session.get(
            url,
            params={
                "per_page": 100
            }
        )
        r.raise_for_status()
        return r.json()

''' http://127.0.0.1:8000/api/canvas/courses/255/assignments/ is the endpoint we use to get assignments for a course,
it calls the list_assignments method in this client to fetch the data from canvas.'''