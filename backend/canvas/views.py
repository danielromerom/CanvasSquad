from http import client
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.conf import settings
from requests import request
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .canvas_client import CanvasClient
from .models import Course, Assignment, TaskGeneration, Task
from .services.canvas_sync_services import generate_and_store_tasks, sync_assignments


class CoursesView(APIView):
    def get(self, request):
        client = CanvasClient(
            settings.CANVAS_BASE_URL,
            settings.CANVAS_ACCESS_TOKEN
        )

        courses_raw = client.list_courses()
        saved_courses = []

        for c in courses_raw:
            course, _ = Course.objects.update_or_create(
                canvas_course_id=c["id"],
                    defaults={
                        "name": c.get("name"),
                        "course_code": c.get("course_code", "")
                    }
                )
            saved_courses.append(course)

            return Response({
                "count": len(saved_courses),
                "courses": courses_raw
            })

class CourseAssignmentsView(APIView):
    """
    GET: Return all assignments for a course from the database. Does not call Canvas or LLM.
    """
    def get(self, request, course_id):
        try:
            course = Course.objects.get(canvas_course_id=str(course_id))
        except Course.DoesNotExist:
            return Response(
                {"error": f"Course with canvas_course_id {course_id} not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        assignments = course.assignments.all().values(
            "id",
            "canvas_assignment_id",
            "title",
            "description",
            "due_at",
            "points_possible"
        )

        return Response({
            "course_id": course.canvas_course_id,
            "course_name": course.name,
            "assignment_count": assignments.count(),
            "assignments": list(assignments)
        })



class CourseSyncView(APIView):
    def post(self, request, course_id):
        force_update = request.data.get("force", False)

        client = CanvasClient(settings.CANVAS_BASE_URL, settings.CANVAS_ACCESS_TOKEN)
        raw_assignments = client.list_assignments(course_id)
        course_data = client.get_course(course_id)

        course_name = course_data.get("name", "Unknown Course")
        

        pdf_text_by_assignment = {}

        for a in raw_assignments:
            try:
                pdf_text_by_assignment[a["id"]] = client.get_assignment_pdf_text(
                    course_id=course_id,
                    assignment_id=a["id"]
                )
            except Exception:
                pdf_text_by_assignment[a["id"]] = ""

        # Sync assignments into DB
        assignments = sync_assignments(
            course_canvas_id=course_id,
            course_name=course_name,
            raw_assignments=raw_assignments,
            pdf_text_map=pdf_text_by_assignment
        )

        # Generate tasks via LLM
        generate_and_store_tasks(assignments, force_update)

        return Response({
            "course_id": course_id,
            "course_name": course_name,
            "assignment_count": len(assignments),
            "message": "Assignments synced and tasks generated successfully",
            "forced": force_update
        })

    
class AssignmentTasksView(APIView):
    """
    GET: Return all tasks for a given assignment from the db. Does not call Canvas or LLM. Lookup is by Canvas assignment ID.
    """
    def get(self, request, assignment_id):
        try:
            assignment = Assignment.objects.get(canvas_assignment_id=str(assignment_id))
        except Assignment.DoesNotExist:
            return Response(
                {"error": f"Assignment with canvas_assignment_id {assignment_id} not found."},
                status=404
            )

        tasks = assignment.tasks.all().values(
            "id",
            "title",
            "estimated_minutes",
            "priority",
            "order",
            "is_completed",
            "description",
            "ai_insight"
        )

        return Response({
            "assignment_id": assignment.canvas_assignment_id,  
            "assignment_title": assignment.title,
            "course_id": assignment.course.canvas_course_id,
            "tasks": list(tasks),
        })
