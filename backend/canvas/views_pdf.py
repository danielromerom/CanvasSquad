# FILE ONLY FOR TESTING PDF ENDPOINTS - TEMPORARY

import io
import zipfile

from django.conf import settings
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_GET

from canvas.canvas_client import CanvasClient


@require_GET
def download_assignment_pdfs_zip(request, course_id: int, assignment_id: int):
    client = CanvasClient(settings.CANVAS_BASE_URL, settings.CANVAS_ACCESS_TOKEN)

    pdfs = client.list_assignment_pdfs(course_id, assignment_id)
    if not pdfs:
        return JsonResponse({"ok": False, "reason": "no PDFs found in assignment description"}, status=404)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for i, pdf in enumerate(pdfs, start=1):
            url = pdf.get("download_url")
            if not url:
                continue

            data = client.download_file_bytes(url)
            name = pdf.get("filename") or f"assignment_{assignment_id}_file_{i}.pdf"
            if not name.lower().endswith(".pdf"):
                name = name + ".pdf"

            zf.writestr(name, data)

    buf.seek(0)
    resp = HttpResponse(buf.getvalue(), content_type="application/zip")
    resp["Content-Disposition"] = f'attachment; filename="assignment_{assignment_id}_pdfs.zip"'
    return resp