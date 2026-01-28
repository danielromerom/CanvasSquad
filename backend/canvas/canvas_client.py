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
