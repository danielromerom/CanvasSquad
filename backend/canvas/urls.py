from django.urls import path
from .views import CourseAssignmentsView, CoursesView, AssignmentTasksView, CourseSyncView
from canvas.views_pdf import download_assignment_pdfs_zip
from django.contrib import admin
from django.http import JsonResponse

urlpatterns = [
    path("courses/", CoursesView.as_view(), name="course-list"),
    path("courses/<int:course_id>/assignments/", CourseAssignmentsView.as_view()),
    path("courses/<int:course_id>/sync/", CourseSyncView.as_view()),
    path("assignments/<int:assignment_id>/tasks/", AssignmentTasksView.as_view()),
    # THIS URL PATH IS TEMPORARY & CAN BE REMOVED - ONLY FOR TESTING PDFS
    path("courses/<int:course_id>/assignments/<int:assignment_id>/pdfs.zip",
         download_assignment_pdfs_zip)
]

# curl -X POST http://127.0.0.1:8000/api/canvas/courses/255/sync/ \
  # -H "Content-Type: application/json"