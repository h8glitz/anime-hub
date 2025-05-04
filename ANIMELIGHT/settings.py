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
    'django.contrib.sessions',       # Добавлено для поддержки сессий
    'django.contrib.messages',       # Добавлено для поддержки сообщений
    'anime_deploy',                  # Наше приложение
]



MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Добавлено перед CommonMiddleware
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Для обслуживания статических файлов
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

# Директория, куда collectstatic соберет все статические файлы
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Дополнительные директории, из которых Django будет собирать статические файлы
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'anime_deploy/static'),
]

# Настройки для WhiteNoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Настройки для медиафайлов (загружаемых пользователями)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Настройка для обработки статики через Django в режиме DEBUG
if DEBUG:
    import mimetypes
    mimetypes.add_type("text/css", ".css", True)
    mimetypes.add_type("application/javascript", ".js", True)


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

