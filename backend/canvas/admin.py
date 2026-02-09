# admin.py
from django.contrib import admin
from .models import StudentProfile, Course, Assignment, Task

admin.site.register(StudentProfile)
admin.site.register(Course)
admin.site.register(Assignment)
admin.site.register(Task)
