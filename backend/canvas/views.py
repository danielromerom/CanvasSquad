from http import client
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.conf import settings
from requests import HTTPError, request
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import traceback
from .canvas_client import CanvasClient
from .models import Course, Assignment, TaskGeneration, Task
from .services.canvas_sync_services import generate_and_store_tasks, sync_assignments

def get_canvas_token_or_401(request):
    token = request.session.get("canvas_access_token")
    token_type = request.session.get("canvas_token_type", "Bearer")
    if not token:
        return None, None
    return token, token_type

class CoursesView(APIView):
    def get(self, request):
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(' ')[1] if 'Bearer ' in auth_header else None

        if not token:
            return Response({"error": "Unauthorized: No token provided"}, status=401)

        client = CanvasClient(settings.CANVAS_BASE_URL, token)

        # EVERYTHING that talks to Canvas must be inside this try block
        try:
            courses_raw = client.list_courses() # This is Line 33 that was crashing
            
            saved_courses = []
            for c in courses_raw:
                if "id" not in c: continue
                course, _ = Course.objects.update_or_create(
                    canvas_course_id=str(c["id"]),
                    defaults={
                        "name": c.get("name", "Unnamed Course"),
                        "course_code": c.get("course_code", "")
                    }
                )
                saved_courses.append(course)

            return Response({
                "count": len(saved_courses),
                "courses": courses_raw
            })
    
        except HTTPError as e:
            # This catches the 401 from Canvas and sends it to React gracefully
            if e.response.status_code == 401:
                return Response({"error": "Canvas token expired"}, status=401)
            return Response({"error": str(e)}, status=500)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
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
        try:
            auth_header = request.headers.get('Authorization', '')
            token = auth_header.split(' ')[1] if 'Bearer ' in auth_header else None

            if not token:
                return Response({"error": "No token provided"}, status=401)

            force_update = request.data.get("force", False)

            client = CanvasClient(settings.CANVAS_BASE_URL, token)

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

            assignments = sync_assignments(
                course_canvas_id=course_id,
                course_name=course_name,
                raw_assignments=raw_assignments,
                pdf_text_map=pdf_text_by_assignment
            )

            generate_and_store_tasks(assignments, force_update)

            return Response({
                "course_id": course_id,
                "course_name": course_name,
                "assignment_count": len(assignments),
                "message": "Assignments synced and tasks generated successfully",
                "forced": force_update
            })

        except Exception as e:
            print("SYNC ERROR:", e)
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
    

    
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
            return Response({"error": "Failed to exchange token", "details": response.json()}, status=400)

        data = response.json()
        access_token = data.get("access_token")

        request.session["canvas_access_token"] = access_token
        
        return Response({
            "status": "success",
            "access_token": access_token,
            "user": data.get("user")
        })

class TaskUpdateView(APIView):
    def patch(self, request, task_id):
        try:
            # Finding the task using your Task model
            task = Task.objects.get(pk=task_id)
            
            # Update the title (frontend sends 'label')
            if 'label' in request.data:
                task.title = request.data['label']
            
            # Update the description
            if 'description' in request.data:
                task.description = request.data['description']
                
            # Update estimated_minutes (frontend sends 'time' like "15m")
            if 'time' in request.data:
                time_str = request.data['time']
                try:
                    # Strip the 'm' and convert to integer for your PositiveIntegerField
                    task.estimated_minutes = int(time_str.replace('m', ''))
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
        try:
            # 1. Get the assignment to link the task to
            assignment = Assignment.objects.get(canvas_assignment_id=assignment_id)
            
            # 2. Determine the order (put it at the end)
            last_order = assignment.tasks.count()
            
            # 3. Create the task with default values
            new_task = Task.objects.create(
                assignment=assignment,
                title=request.data.get('label', 'New Task'),
                description=request.data.get('description', ''),
                estimated_minutes=15, # Default
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
        try:
            task = Task.objects.get(pk=task_id)
            task.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        
class TaskReorderView(APIView):
    def post(self, request, assignment_id):
        try:
            # Expecting a list of IDs from frontend: [45, 22, 10, 88]
            ordered_ids = request.data.get('ordered_ids', [])
            
            # Efficiently update the 'order' field for each task
            for index, task_id in enumerate(ordered_ids):
                Task.objects.filter(pk=task_id, assignment__canvas_assignment_id=assignment_id).update(order=index)
                
            return Response({"status": "order updated"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)