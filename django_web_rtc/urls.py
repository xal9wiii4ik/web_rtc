from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from django_web_rtc import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('web_rtc.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS)
