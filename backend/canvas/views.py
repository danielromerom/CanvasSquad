from django.shortcuts import render

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from .canvas_client import CanvasClient
from rest_framework import status
from .services.assignment_service import normalize_assignments
from .services.llm_service import generate_task_suggestions

def get_canvas_token_or_401(request):
    token = request.session.get("canvas_access_token")
    token_type = request.session.get("canvas_token_type", "Bearer")
    if not token:
        return None, None
    return token, token_type

class CoursesView(APIView):
    def get(self, request):
        token, _ = get_canvas_token_or_401(request)
        if not token:
            return Response({"detail": "Not authenticated with Canvas"}, status=status.HTTP_401_UNAUTHORIZED)

        client = CanvasClient(settings.CANVAS_BASE_URL, token)
        courses_raw = client.list_courses()

        return Response({"courses": courses_raw})

class CourseAssignmentsView(APIView):
    def get(self, request, course_id):
        token, _ = get_canvas_token_or_401(request)
        if not token:
            return Response({"detail": "Not authenticated with Canvas"}, status=status.HTTP_401_UNAUTHORIZED)

        client = CanvasClient(settings.CANVAS_BASE_URL, token)

        raw_assignments = client.list_assignments(course_id)

        normalized_assignments = normalize_assignments(raw_assignments)

        tasks = generate_task_suggestions(normalized_assignments)

        return Response({
            "course_id": course_id,
            "assignment_count": len(normalized_assignments),
            "tasks": tasks
        })

       