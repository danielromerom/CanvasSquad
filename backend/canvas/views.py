from django.shortcuts import render

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from .canvas_client import CanvasClient

class CourseAssignmentsView(APIView):
    def get(self, request, course_id):
        client = CanvasClient(settings.CANVAS_BASE_URL, settings.CANVAS_ACCESS_TOKEN)
        data = client.list_assignments(course_id)

        # this is to clean up the data we send back to the frontend
        clean = [{
            "id": a.get("id"),
            "name": a.get("name"),
            "due_at": a.get("due_at"),
            "points_possible": a.get("points_possible"),
            "published": a.get("published"),
            "html_url": a.get("html_url"),
            "description": a.get("description"),
        } for a in data]

        return Response({
            "course_id": course_id,
            "count": len(clean),
            "assignments": clean
        })

