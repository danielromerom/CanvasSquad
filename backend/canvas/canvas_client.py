import requests
import re # regex module
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
    
    def get_assignment(self, course_id, assignment_id):
        url = urljoin(self.base_url, f"/api/v1/courses/{course_id}/assignments/{assignment_id}")
        r = self.session.get(url)
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
    
    # added this so i can get the course name when syncing a course
    def get_course(self, course_id):
        url = urljoin(self.base_url, f"/api/v1/courses/{course_id}")
        r = self.session.get(url)
        r.raise_for_status()
        return r.json()


    def extract_file_ids_from_assignment_description(self, description_html: str) -> list[int]:
        if not description_html:
            return []

        # look for /files/<id>
        ids = re.findall(r"/files/(\d+)", description_html)
        seen = set()
        out = []
        for s in ids:
            i = int(s)
            if i not in seen:
                seen.add(i)
                out.append(i)
        return out

    def get_file_metadata(self, file_id: int):
        url = urljoin(self.base_url, f"/api/v1/files/{file_id}")
        r = self.session.get(url)
        r.raise_for_status()
        return r.json()

    def download_file_bytes(self, download_url: str) -> bytes:
        r = self.session.get(download_url, stream=True, timeout=30)
        r.raise_for_status()
        return r.content

    def list_assignment_pdfs(self, course_id: int, assignment_id: int) -> list[dict]:
        assignment = self.get_assignment(course_id, assignment_id)
        description = assignment.get("description", "")

        file_ids = self.extract_file_ids_from_assignment_description(description)
        if not file_ids:
            return []

        pdfs = []
        for file_id in file_ids:
            meta = self.get_file_metadata(file_id)

            filename = (meta.get("filename") or "").lower()
            content_type = (meta.get("content-type") or meta.get("content_type") or "").lower()

            is_pdf = (content_type == "application/pdf") or filename.endswith(".pdf")
            if not is_pdf:
                continue

            pdfs.append({
                "file_id": meta.get("id", file_id),
                "filename": meta.get("filename"),
                "content_type": meta.get("content-type") or meta.get("content_type"),
                "size": meta.get("size"),
                "download_url": meta.get("url"),
                "display_name": meta.get("display_name"),
            })

        return pdfs