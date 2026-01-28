from django.urls import path
from .views import CourseAssignmentsView

urlpatterns = [
    path("courses/<int:course_id>/assignments/", CourseAssignmentsView.as_view()),
]
