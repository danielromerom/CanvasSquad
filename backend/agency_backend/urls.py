"""
URL configuration for agency_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse, JsonResponse
from .auth_views import canvas_authorize_url, canvas_exchange, auth_me, auth_logout, auth_success

def health(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("", health),
    path('admin/', admin.site.urls),
    path("api/canvas/", include("canvas.urls")),
    path("", lambda request: HttpResponse("Backend is running.")),
    path("auth/canvas/authorize-url/", canvas_authorize_url),
    # path("auth/canvas/exchange/", canvas_exchange),
    path("auth/me/", auth_me, name="auth-me"),
    path("auth/logout/", auth_logout, name="auth-logout"),
    path("auth/success/", auth_success, name="auth-success"),
]
