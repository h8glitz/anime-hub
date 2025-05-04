#!/bin/bash

# Активация виртуального окружения
source /path/to/venv/bin/activate

# Переход в директорию проекта
cd /path/to/project

# Сбор статических файлов
python manage.py collectstatic --noinput

# Запуск Gunicorn
exec gunicorn ANIMELIGHT.wsgi:application \
    --name=anime-hub \
    --bind=0.0.0.0:8000 \
    --workers=3 \
    --log-level=info \
    --log-file=/path/to/logs/gunicorn.log \
    --access-logfile=/path/to/logs/access.log \
    --error-logfile=/path/to/logs/error.log \
    --capture-output \
    --timeout=90 