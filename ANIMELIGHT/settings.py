"""
Django settings for ANIMELIGHT project.
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-yfs5lqo3*q!huy9r6%c5fcg!j!q%kbcx@+y#(qg8v0+3ak=beo'

DEBUG = True

ALLOWED_HOSTS = ["83.222.17.157", "anime-hub.ru", "www.anime-hub.ru"]

INSTALLED_APPS = [
    'django.contrib.contenttypes',   # Нужно для базовых моделей
    'django.contrib.auth',           # Нужно для пользователей и авторизации
    'django.contrib.staticfiles',
    'anime_deploy',                  # Наше приложение
]



MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Добавлено перед CommonMiddleware
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://localhost:8000", # Добавлено
]

ROOT_URLCONF = 'ANIMELIGHT.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'anime_deploy/templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ANIMELIGHT.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

LOGIN_URL = "/accounts/login/"


STATIC_URL = '/static/'

# Добавляем STATIC_ROOT для сбора статических файлов при деплое
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

STATICFILES_DIRS = [
    BASE_DIR / 'anime_deploy/static',
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# settings.py

AUTH_USER_MODEL = 'anime_deploy.CustomUser'  # Указываем кастомную модель пользователя


# settings.py

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'level': 'ERROR',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}

