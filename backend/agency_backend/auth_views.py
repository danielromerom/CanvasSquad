import secrets
from urllib.parse import urlencode


import requests
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.shortcuts import redirect
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from canvas.models import StudentProfile

def _canvas_url(path: str) -> str:
    return settings.CANVAS_BASE_URL.rstrip("/") + path

def canvas_authorize_url(request):
    state = secrets.token_urlsafe(24)

    # redirect_uri must come from the extension (chrome.identity.getRedirectURL)
    redirect_uri = request.GET.get("redirect_uri")
    if not redirect_uri:
        return HttpResponseBadRequest("Missing redirect_uri")

    request.session["canvas_oauth_state"] = state
    request.session["canvas_oauth_redirect_uri"] = redirect_uri

    authorize_url = _canvas_url("/login/oauth2/auth")
    params = {
        "client_id": settings.CANVAS_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "state": state,
    }
    url = f"{authorize_url}?{urlencode(params)}"
    return JsonResponse({"authorize_url": url, "state": state})

from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth import login
from django.views.decorators.http import require_POST
import requests


@require_POST
def canvas_exchange(request):
    # Parse JSON body
    try:
        import json
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON body")

    code = body.get("code")
    state = body.get("state")

    if not code or not state:
        return HttpResponseBadRequest("Missing code/state")

    # Validate state against the session set during authorize-url step
    if state != request.session.get("canvas_oauth_state"):
        return HttpResponseBadRequest("Invalid state")

    # IMPORTANT: redirect_uri must match exactly the one used in the authorize step
    redirect_uri = request.session.get("canvas_oauth_redirect_uri")
    if not redirect_uri:
        return HttpResponseBadRequest("Missing redirect_uri in session")

    # Exchange code -> token
    token_url = _canvas_url("/login/oauth2/token")
    token_resp = requests.post(
        token_url,
        data={
            "grant_type": "authorization_code",
            "client_id": settings.CANVAS_CLIENT_ID,
            "client_secret": settings.CANVAS_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "code": code,
        },
        timeout=15,
    )

    try:
        token_resp.raise_for_status()
    except requests.HTTPError:
        return HttpResponseBadRequest(token_resp.text)

    token_data = token_resp.json()

    access_token = token_data.get("access_token")
    token_type = token_data.get("token_type", "Bearer")
    if not access_token:
        return HttpResponseBadRequest("No access_token returned")

    # Identify user from Canvas
    profile_resp = requests.get(
        _canvas_url("/api/v1/users/self/profile"),
        headers={"Authorization": f"{token_type} {access_token}"},
        timeout=15,
    )

    try:
        profile_resp.raise_for_status()
    except requests.HTTPError:
        return HttpResponseBadRequest(profile_resp.text)

    profile = profile_resp.json()

    canvas_user_id = str(profile.get("id"))
    email = profile.get("primary_email") or ""
    time_zone = profile.get("time_zone") or "UTC"

    # Local user record
    username = f"canvas_{canvas_user_id}"
    user, created = User.objects.get_or_create(
        username=username,
        defaults={"email": email},
    )
    if not created and email and user.email != email:
        user.email = email
        user.save(update_fields=["email"])

    sp, _ = StudentProfile.objects.get_or_create(
        user=user,
        defaults={"canvas_user_id": canvas_user_id, "time_zone": time_zone},
    )
    if sp.time_zone != time_zone:
        sp.time_zone = time_zone
        sp.save(update_fields=["time_zone"])

    # store token in session
    request.session["canvas_access_token"] = access_token
    request.session["canvas_token_type"] = token_type

    # Optional: clear one-time oauth fields (prevents accidental reuse)
    request.session.pop("canvas_oauth_state", None)
    request.session.pop("canvas_oauth_redirect_uri", None)

    # log user into Django session
    login(request, user)

    return JsonResponse({"ok": True})

def auth_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False})

    sp = getattr(request.user, "student_profile", None)
    return JsonResponse({
        "authenticated": True,
        "username": request.user.username,
        "email": request.user.email,
        "canvas_user_id": sp.canvas_user_id if sp else None,
        "time_zone": sp.time_zone if sp else None,
    })

def auth_logout(request):
    # clear token from session too
    request.session.pop("canvas_access_token", None)
    request.session.pop("canvas_token_type", None)
    logout(request)
    return JsonResponse({"ok": True})
    
@require_GET
def auth_success(request):
    return HttpResponse("OAuth success. You can close this tab.")