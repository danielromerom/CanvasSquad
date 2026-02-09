from django.shortcuts import render

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from .canvas_client import CanvasClient

from .services.assignment_service import normalize_assignments
from .services.llm_service import generate_task_suggestions
class CourseAssignmentsView(APIView):
    def get(self, request, course_id):
        client = CanvasClient(settings.CANVAS_BASE_URL, settings.CANVAS_ACCESS_TOKEN)
        data = client.list_assignments(course_id)

        raw_assignments = client.list_assignments(course_id)

        # clean the data from canvas into normalized assignments
        normalized_assignments = normalize_assignments(raw_assignments)

        # call the LLM to create task suggestions
        tasks = generate_task_suggestions(normalized_assignments)

        # response back to frontend
        return Response({
            "course_id": course_id,
            "assignment_count": len(normalized_assignments),
            "tasks": tasks
        })

       