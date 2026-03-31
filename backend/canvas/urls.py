from django.urls import path
from .views import AssignmentSyncView, CourseAssignmentsView, CoursesView, AssignmentTasksView, ExchangeTokenView, TaskReorderView, TaskUpdateView, TaskCreateView, TaskDeleteView
from canvas.views_pdf import download_assignment_pdfs_zip
from django.contrib import admin
from django.http import JsonResponse

urlpatterns = [
    path("courses/", CoursesView.as_view(), name="course-list"),
    path("courses/<int:course_id>/assignments/", CourseAssignmentsView.as_view()),
    path('courses/<int:course_id>/assignments/<int:assignment_id>/sync/', AssignmentSyncView.as_view(), name='assignment-sync'),
    path("assignments/<int:assignment_id>/tasks/", AssignmentTasksView.as_view()),
    path('tasks/<int:task_id>/update/', TaskUpdateView.as_view(), name='task-update'),
    path('assignments/<str:assignment_id>/tasks/add/', TaskCreateView.as_view(), name='task-add'),
    path('tasks/<int:task_id>/delete/', TaskDeleteView.as_view(), name='task-delete'),
    path('assignments/<str:assignment_id>/tasks/reorder/', TaskReorderView.as_view(), name='task-reorder'),
    path("exchange/", ExchangeTokenView.as_view(), name="canvas-exchange"),
    # THIS URL PATH IS TEMPORARY & CAN BE REMOVED - ONLY FOR TESTING PDFS
    path("courses/<int:course_id>/assignments/<int:assignment_id>/pdfs.zip",
         download_assignment_pdfs_zip)
]

# curl -X POST http://127.0.0.1:8000/api/canvas/courses/255/sync/ \
  # -H "Content-Type: application/json"