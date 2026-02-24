from django.urls import path
from .views import CourseAssignmentsView, CoursesView, AssignmentTasksView, CourseSyncView
from django.contrib import admin
from django.http import JsonResponse

urlpatterns = [
    path("courses/", CoursesView.as_view(), name="course-list"),
    path("courses/<int:course_id>/assignments/", CourseAssignmentsView.as_view()),
    path("courses/<int:course_id>/sync/", CourseSyncView.as_view()),
    path("assignments/<int:assignment_id>/tasks/", AssignmentTasksView.as_view()),
]

# curl -X POST http://127.0.0.1:8000/api/canvas/courses/255/sync/ \
  # -H "Content-Type: application/json"


