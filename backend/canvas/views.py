# views.py

from http import client
from django.shortcuts import render, get_object_or_404
from django.conf import settings
from requests import HTTPError
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User

from .canvas_client import CanvasClient
from .models import Course, Assignment, TaskGeneration, Task, StudentProfile
from .services.canvas_sync_services import generate_and_store_tasks, sync_assignments


def get_token_from_request(request):
    """get the bearer token from Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if 'Bearer ' in auth_header:
        print("DEBUG AUTH_HEADER:", auth_header)
        return auth_header.split(' ')[1]
    return None


def get_student_profile(token):
    """
    get canvas access token, get profile or create profile w canvas id
    returns profile, error message
    """

    client = CanvasClient(settings.CANVAS_BASE_URL, token)
    try:
        canvas_user = client.get_current_user()
        print("DEBUG canvas_user:", canvas_user)  
    except HTTPError as e:
        print("DEBUG HTTPError:", e)              
        return None, Response({"error": "Failed to identify Canvas user"}, status=401)
    except Exception as e:
        print("DEBUG Exception:", e)              
        return None, Response({"error": str(e)}, status=500)


    canvas_user_id = str(canvas_user.get("id"))
    username = canvas_user.get("login_id") or canvas_user.get("name") or canvas_user_id

    # Get or create a Django User and StudentProfile for this Canvas user
    django_user, _ = User.objects.get_or_create(
        username=f"canvas_{canvas_user_id}",
        defaults={"first_name": canvas_user.get("name", "")}
    )
    profile, _ = StudentProfile.objects.get_or_create(
        canvas_user_id=canvas_user_id,
        defaults={"user": django_user}
    )
    return profile, None


class CoursesView(APIView):
    def get(self, request):
        token = get_token_from_request(request)
        if not token:
            return Response({"error": "Unauthorized: No token provided"}, status=401)

        # Identify the user from their token
        profile, err = get_student_profile(token)
        if err:
            return err

        canvas_client = CanvasClient(settings.CANVAS_BASE_URL, token)

        try:
            courses_raw = canvas_client.list_courses()

            saved_courses = []
            for c in courses_raw:
                if "id" not in c:
                    continue
                course, _ = Course.objects.update_or_create(
                    canvas_course_id=str(c["id"]),
                    defaults={
                        "name": c.get("name", "Unnamed Course"),
                        "course_code": c.get("course_code", "")
                    }
                )
                # Link this course to the authenticated student
                course.students.add(profile)
                saved_courses.append(course)

            return Response({
                "count": len(saved_courses),
                "courses": courses_raw
            })

        except HTTPError as e:
            if e.response.status_code == 401:
                return Response({"error": "Canvas token expired"}, status=401)
            return Response({"error": str(e)}, status=500)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class CourseAssignmentsView(APIView):
    """
    GET: Return all assignments for a course, scoped to the authenticated user.
    """
    def get(self, request, course_id):
        token = get_token_from_request(request)
        if not token:
            return Response({"error": "Unauthorized"}, status=401)

        profile, err = get_student_profile(token)
        if err:
            return err

        # make sure this course belongs to this user
        try:
            course = Course.objects.get(
                canvas_course_id=str(course_id),
                students=profile
            )
        except Course.DoesNotExist:
            return Response(
                {"error": f"Course {course_id} not found for this user."},
                status=status.HTTP_404_NOT_FOUND
            )

        assignments = course.assignments.all().values(
            "id", "canvas_assignment_id", "title",
            "description", "due_at", "points_possible"
        )

        return Response({
            "course_id": course.canvas_course_id,
            "course_name": course.name,
            "assignment_count": assignments.count(),
            "assignments": list(assignments)
        })


class CourseSyncView(APIView):
    def post(self, request, course_id):
        token = get_token_from_request(request)
        if not token:
            return Response({"error": "No token provided"}, status=401)

        # identify user and ensure the course is linked to them
        profile, err = get_student_profile(token)
        if err:
            return err

        force_update = request.data.get("force", False)
        canvas_client = CanvasClient(settings.CANVAS_BASE_URL, token)

        raw_assignments = canvas_client.list_assignments(course_id)
        course_data = canvas_client.get_course(course_id)
        course_name = course_data.get("name", "Unknown Course")

        pdf_text_by_assignment = {}
        for a in raw_assignments:
            try:
                pdf_text_by_assignment[a["id"]] = canvas_client.get_assignment_pdf_text(
                    course_id=course_id,
                    assignment_id=a["id"]
                )
            except Exception:
                pdf_text_by_assignment[a["id"]] = ""

        assignments = sync_assignments(
            course_canvas_id=course_id,
            course_name=course_name,
            raw_assignments=raw_assignments,
            pdf_text_map=pdf_text_by_assignment
        )

        # Make sure this course is linked to the user after sync
        course = Course.objects.get(canvas_course_id=str(course_id))
        course.students.add(profile)

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
    GET: Return all tasks for an assignment, scoped to the authenticated user.
    """
    def get(self, request, assignment_id):
        token = get_token_from_request(request)
        if not token:
            return Response({"error": "Unauthorized"}, status=401)

        profile, err = get_student_profile(token)
        if err:
            return err

        try:
            # Scope to assignments within courses this user is enrolled in
            assignment = Assignment.objects.get(
                canvas_assignment_id=str(assignment_id),
                course__students=profile  
            )
        except Assignment.DoesNotExist:
            return Response(
                {"error": f"Assignment {assignment_id} not found for this user."},
                status=404
            )

        tasks = assignment.tasks.all().values(
            "id", "title", "estimated_minutes", "priority",
            "order", "is_completed", "description", "ai_insight"
        )

        return Response({
            "assignment_id": assignment.canvas_assignment_id,
            "assignment_title": assignment.title,
            "course_id": assignment.course.canvas_course_id,
            "tasks": list(tasks),
        })


class ExchangeTokenView(APIView):
    def post(self, request):
        code = request.data.get("code")
        if not code:
            return Response({"error": "No code provided"}, status=400)

        response = requests.post(
            f"{settings.CANVAS_BASE_URL}/login/oauth2/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.CANVAS_CLIENT_ID,
                "client_secret": settings.CANVAS_CLIENT_SECRET,
                "redirect_uri": settings.CANVAS_REDIRECT_URI,
                "code": code,
            },
        )

        if response.status_code != 200:
            return Response(
                {"error": "Failed to exchange token", "details": response.json()},
                status=400
            )

        data = response.json()
        access_token = data.get("access_token")

        
        profile, err = get_student_profile(access_token)
        if err:
            # Token worked for OAuth but failed on /users/self — still return the token
            return Response({
                "status": "success",
                "access_token": access_token,
                "user": data.get("user"),
                "warning": "Could not resolve Canvas user profile"
            })

        request.session["canvas_access_token"] = access_token

        return Response({
            "status": "success",
            "access_token": access_token,
            "canvas_user_id": profile.canvas_user_id,
            "user": data.get("user")
        })


# --- Task mutation views are unchanged but shown for completeness ---

class TaskUpdateView(APIView):
    def patch(self, request, task_id):
        token = get_token_from_request(request)
        if not token:
            return Response({"error": "Unauthorized"}, status=401)

        profile, err = get_student_profile(token)
        if err:
            return err

        try:
            task = Task.objects.get(
                pk=task_id,
                assignment__course__students=profile  
            )
            if 'label' in request.data:
                task.title = request.data['label']
            if 'description' in request.data:
                task.description = request.data['description']
            if 'time' in request.data:
                try:
                    task.estimated_minutes = int(request.data['time'].replace('m', ''))
                except ValueError:
                    pass
            task.save()
            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TaskCreateView(APIView):
    def post(self, request, assignment_id):
        token = get_token_from_request(request)
        if not token:
            return Response({"error": "Unauthorized"}, status=401)

        profile, err = get_student_profile(token)
        if err:
            return err

        try:
            assignment = Assignment.objects.get(
                canvas_assignment_id=assignment_id,
                course__students=profile  
            )
            last_order = assignment.tasks.count()
            new_task = Task.objects.create(
                assignment=assignment,
                title=request.data.get('label', 'New Task'),
                description=request.data.get('description', ''),
                estimated_minutes=15,
                order=last_order,
                priority="Medium"
            )
            return Response({
                "id": new_task.id,
                "title": new_task.title,
                "estimated_minutes": new_task.estimated_minutes
            }, status=status.HTTP_201_CREATED)
        except Assignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)


class TaskDeleteView(APIView):
    def delete(self, request, task_id):
        token = get_token_from_request(request)
        if not token:
            return Response({"error": "Unauthorized"}, status=401)

        profile, err = get_student_profile(token)
        if err:
            return err

        try:
            task = Task.objects.get(
                pk=task_id,
                assignment__course__students=profile  
            )
            task.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)


class TaskReorderView(APIView):
    def post(self, request, assignment_id):
        token = get_token_from_request(request)
        if not token:
            return Response({"error": "Unauthorized"}, status=401)

        profile, err = get_student_profile(token)
        if err:
            return err

        try:
            # Verify the assignment belongs to this user before reordering
            assignment = Assignment.objects.get(
                canvas_assignment_id=assignment_id,
                course__students=profile  
            )
            ordered_ids = request.data.get('ordered_ids', [])
            for index, task_id in enumerate(ordered_ids):
                Task.objects.filter(
                    pk=task_id,
                    assignment=assignment  
                ).update(order=index)
            return Response({"status": "order updated"}, status=status.HTTP_200_OK)
        except Assignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)