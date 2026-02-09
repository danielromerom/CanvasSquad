from django.urls import path
from .views import CourseAssignmentsView
from django.contrib import admin

urlpatterns = [
    path("courses/<int:course_id>/assignments/", CourseAssignmentsView.as_view()),
    path('admin/', admin.site.urls),
]
