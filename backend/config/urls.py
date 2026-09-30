from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({
        "status": "ok",
        "service": "consulta-habitacional-api"
    })


urlpatterns = [
    path("", health_check, name="health-check"),
    path("admin/", admin.site.urls),
    path("api/", include("habitacional.urls")),
]

from django.views.static import serve
from django.urls import re_path

urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]

