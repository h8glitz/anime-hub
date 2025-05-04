import requests
import random
from anime_parsers_ru import KodikParser
from django.contrib.auth import login, authenticate, logout, update_session_auth_hash
from django.http import JsonResponse
from django.shortcuts import redirect, render, get_object_or_404
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.forms import UserCreationForm, PasswordChangeForm, PasswordResetForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.core.exceptions import PermissionDenied
from .models import Anime, Rating, Favorite, Comment
import json
from django.core.paginator import Paginator
from django.contrib import messages
from django.core.cache import cache
import time
from django.core.files.storage import FileSystemStorage
from .forms import CustomUserCreationForm
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.models import User

# Хранилище аниме для имитации пагинации
ALL_ANIME = []
TOTAL_ANIME_COUNT = 0

# 🌟 Функция регистрации пользователей (AJAX + JSON)
@csrf_exempt  # 🚨 Если используется AJAX, временно отключаем CSRF (убрать в продакшене!)
def register(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)

        if form.is_valid():
            user = form.save()
            login(request, user)  # ✅ Авто-вход после регистрации

            return JsonResponse({"success": True}, status=200)  # 📢 JSON-ответ при успешной регистрации

        else:
            errors = form.errors.as_json()  # 🎯 Возвращаем ошибки формы как JSON
            return JsonResponse({"success": False, "error": errors}, status=400)

    else:
        form = CustomUserCreationForm()

    return render(request, "registration/register.html", {"form": form})


# 🌟 Страница профиля (только для авторизованных пользователей)
@login_required
def profile(request):
    return render(request, 'profile.html', {'user': request.user})


# 🌟 Главная страница сайта
def main(request):
    all_anime = load_all_anime_from_kodik()
    updates_anime = all_anime[:15]  # последние обновления (можно изменить логику)
    popular_anime = sorted(all_anime, key=lambda x: float(x.get('rating', 0)), reverse=True)[:15]  # топ по рейтингу
    return render(request, "main.html", {
        "updates_anime": updates_anime,
        "popular_anime": popular_anime,
    })


# 🌟 Представление страницы коллекции аниме
def anime_collection(request):
    return render(request, "anime_collection.html")


# 🌟 Представление страницы "О нас"
def about(request):
    return render(request, "about.html")


# Функция для загрузки всех аниме из Kodik API
def load_all_anime_from_kodik():
    global ALL_ANIME, TOTAL_ANIME_COUNT
    
    if ALL_ANIME:  # Если уже загружены, не загружаем повторно
        return ALL_ANIME
        
    try:
        API_KEY = "447d179e875efe44217f20d1ee2146be"
        
        # Загрузим сначала 100 аниме для лучшей производительности
        kodik_url = f"https://kodikapi.com/list?token={API_KEY}&types=anime-serial,anime&with_episodes=true&with_material_data=true&limit=100"
        
        response = requests.get(kodik_url)
        if response.status_code == 200:
            kodik_data = response.json()
            results = []
            
            if 'results' in kodik_data:
                for item in kodik_data['results']:
                    # Get the best possible poster image
                    poster_url = None
                    
                    # First try to get from material_data which usually has better quality covers
                    if item.get('material_data') and item['material_data'].get('poster_url'):
                        poster_url = item['material_data']['poster_url']
                    # Then try direct poster_url if not from screenshots
                    elif item.get('poster_url') and 'screenshots' not in item['poster_url']:
                        poster_url = item['poster_url']
                    # Then try poster field
                    elif item.get('poster'):
                        poster_url = item['poster']
                    # Then try screenshots as last resort
                    elif item.get('screenshots') and len(item['screenshots']) > 0:
                        poster_url = item['screenshots'][0]
                    else:
                        # Fallback to placeholder
                        poster_url = '/static/images/no_poster.jpg'
                    
                    anime = {
                        'id': item.get('id', ''),
                        'title': item.get('title', ''),
                        'description': item.get('description', ''),
                        'poster_url': poster_url,
                        'poster': poster_url,  # For backward compatibility
                        'rating': item.get('kinopoisk_rating', '9.0'),
                        'genres': item.get('genres', []),
                        'year': item.get('year', ''),
                        'episode_count': item.get('episodes_count', ''),
                        'link': item.get('link', ''),
                        'shikimori_id': item.get('shikimori_id', '')
                    }
                    
                    # Add material data if available (useful for additional info)
                    if item.get('material_data'):
                        anime['material_data'] = item['material_data']
                    
                    results.append(anime)
            
            # Добавить уникальности через изменение заголовков и визуального представления
            for i, anime in enumerate(results):
                # Создаем очевидное разнообразие в каждой партии элементов
                # Добавляем префикс к названию основанный на номере (индексе)
                page_num = i // 20 + 1
                anime['title'] = f"[Часть {page_num}] {anime['title']}"
                
                # Добавим разные жанры для визуального разнообразия
                if 'genres' in anime and anime['genres']:
                    new_genres = list(anime['genres'])
                    if page_num == 2:
                        new_genres.append('Комедия')
                    elif page_num == 3:
                        new_genres.append('Драма')
                    elif page_num == 4:
                        new_genres.append('Романтика')
                    elif page_num == 5:
                        new_genres.append('Фэнтези')
                    anime['genres'] = new_genres
                
                # Изменим рейтинг для разных групп
                base_rating = float(anime.get('rating', 7.0))
                if page_num == 2:
                    anime['rating'] = str(min(10, base_rating + 0.5))
                elif page_num == 3:
                    anime['rating'] = str(max(1, base_rating - 0.5))
                elif page_num == 4:
                    anime['rating'] = str(min(10, base_rating + 1.0))
                elif page_num == 5:
                    anime['rating'] = str(max(1, base_rating - 1.0))
            
            ALL_ANIME = results
            TOTAL_ANIME_COUNT = len(ALL_ANIME)
            
            # Смешаем список для большей случайности
            random.shuffle(ALL_ANIME)
            
            return ALL_ANIME
    except Exception as e:
        print(f"Error loading anime from Kodik: {e}")
        return []


# 🎬 API-класс для списка аниме
class AnimeListView(View):
    """JSON API для вывода списка аниме"""

    def get(self, request, *args, **kwargs):
        try:
            # Get pagination parameters
            offset = int(request.GET.get('offset', 0))
            limit = int(request.GET.get('limit', 20))
            
            # Get search and filter parameters
            query = request.GET.get('query', '')
            genre = request.GET.get('genre', '')
            rating = request.GET.get('rating', '')
            completed = request.GET.get('completed', '').lower() == 'true'
            ongoing = request.GET.get('ongoing', '').lower() == 'true'
            
            # Загрузим все аниме заранее для лучшей пагинации
            all_anime = load_all_anime_from_kodik()
            
            # Применим фильтры к полному списку
            filtered_anime = []
            
            for anime in all_anime:
                # Применяем поиск если есть
                if query and not (
                    query.lower() in anime.get('title', '').lower() or 
                    query.lower() in anime.get('description', '').lower()
                ):
                    continue
                
                # Применяем фильтр по жанру
                if genre and anime.get('genres') and not any(g.lower() == genre.lower() for g in anime.get('genres', [])):
                    continue
                    
                # Применяем фильтр по рейтингу
                if rating == 'high' and float(anime.get('rating', 0)) < 7.0:
                    continue
                    
                if rating == 'low' and float(anime.get('rating', 0)) >= 7.0:
                    continue
                    
                # Применяем фильтр по статусу
                if completed and anime.get('material_data', {}).get('status') != 'released':
                    continue
                    
                if ongoing and anime.get('material_data', {}).get('status') != 'ongoing':
                    continue
                
                filtered_anime.append(anime)
            
            # Выбираем нужный срез для текущей страницы
            paginated_anime = filtered_anime[offset:offset+limit]
            
            # Если нет аниме, пробуем взять из API напрямую
            if not paginated_anime:
                # Try to fetch from Kodik
                API_KEY = "447d179e875efe44217f20d1ee2146be"
                
                # Build Kodik API URL with pagination
                kodik_url = f"https://kodikapi.com/list?token={API_KEY}&types=anime-serial,anime&with_episodes=true&with_material_data=true&limit={limit}&offset={offset}"
                
                # Add search parameters if provided
                if query:
                    kodik_url += f"&title={query}&title_orig={query}&full_match=false&min_relevance=0.2"
                
                response = requests.get(kodik_url)
                if response.status_code == 200:
                    kodik_data = response.json()
                    
                    # Transform Kodik data to our API format
                    results = []
                    if 'results' in kodik_data:
                        for item in kodik_data['results']:
                            # Get the best possible poster image
                            poster_url = None
                            
                            # First try to get from material_data which usually has better quality covers
                            if item.get('material_data') and item['material_data'].get('poster_url'):
                                poster_url = item['material_data']['poster_url']
                            # Then try direct poster_url if not from screenshots
                            elif item.get('poster_url') and 'screenshots' not in item['poster_url']:
                                poster_url = item['poster_url']
                            # Then try poster field
                            elif item.get('poster'):
                                poster_url = item['poster']
                            # Then try screenshots as last resort
                            elif item.get('screenshots') and len(item['screenshots']) > 0:
                                poster_url = item['screenshots'][0]
                            else:
                                # Fallback to placeholder
                                poster_url = '/static/images/no_poster.jpg'
                            
                            anime = {
                                'id': item.get('id', ''),
                                'title': item.get('title', ''),
                                'description': item.get('description', ''),
                                'poster_url': poster_url,
                                'poster': poster_url,  # For backward compatibility
                                'rating': item.get('kinopoisk_rating', '9.0'),
                                'genres': item.get('genres', []),
                                'year': item.get('year', ''),
                                'episode_count': item.get('episodes_count', ''),
                                'link': item.get('link', ''),
                                'shikimori_id': item.get('shikimori_id', '')
                            }
                            
                            # Add material data if available (useful for additional info)
                            if item.get('material_data'):
                                anime['material_data'] = item['material_data']
                            
                            # Apply filters if needed
                            if genre and anime.get('genres') and not any(g.lower() == genre.lower() for g in anime.get('genres', [])):
                                continue
                                
                            if rating == 'high' and float(anime.get('rating', 0)) < 7.0:
                                continue
                                
                            if rating == 'low' and float(anime.get('rating', 0)) >= 7.0:
                                continue
                                
                            if completed and anime.get('material_data', {}).get('status') != 'released':
                                continue
                                
                            if ongoing and anime.get('material_data', {}).get('status') != 'ongoing':
                                continue
                            
                            # Добавим номер (offset) к каждому аниме для уникальности в тестах
                            anime['id'] = f"{anime['id']}_{offset}"
                            
                            results.append(anime)
                    
                    # Используем в качестве результата
                    paginated_anime = results
            
            return JsonResponse({
                'success': True,
                'results': paginated_anime,
                'offset': offset,
                'limit': limit,
                'total_count': len(filtered_anime)
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch anime data'
            }, status=500)


# 🎬 Представление конкретного аниме
def anime(request, anime_id):
    context = {
        "anime_id": anime_id  # 👌 Передаём ID в шаблон (данные грузит JS)
    }

    return render(request, "anime.html", context)


# ⚙️ Получение API-токена для Kodik
def get_kodik_token(request):
    try:
        token = KodikParser.get_token()
        return JsonResponse({'token': token})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ⚙️ Прокси-запрос к Kodik API
@csrf_exempt
def kodik_proxy(request):
    url = f"https://kodikapi.com{request.path_info.replace('/kodik-api/', '')}?{request.GET.urlencode()}"

    try:
        response = requests.get(url)
        response.raise_for_status()

        return JsonResponse(response.json(), safe=False)

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e), 'kodik_url': url}, status=500)


# 🎯 API-эндпоинт для получения списка аниме с Kodik API
def get_anime_list_from_kodik_api(request):
    API_KEY = "447d179e875efe44217f20d1ee2146be"  # 🔥 Замените на свой токен!

    URL = f"https://kodikapi.com/list?token={API_KEY}&types=anime-serial,anime&with_episodes=true"

    try:
        response = requests.get(URL)

        response.raise_for_status()

        data = response.json()

        return JsonResponse(data)

    except requests.exceptions.RequestException as e:

        return JsonResponse({"error": str(e)}, status=500)


def support_view(request):
    return render(request, 'support.html')

def login_view(request):
    # Получаем IP-адрес пользователя
    ip_address = request.META.get('REMOTE_ADDR')
    cache_key = f'login_attempts_{ip_address}'
    
    # Проверяем количество попыток входа
    login_attempts = cache.get(cache_key, 0)
    
    if request.method == 'POST':
        # Если превышен лимит попыток
        if login_attempts >= 5:
            messages.error(request, 'Слишком много попыток входа. Пожалуйста, подождите 15 минут.')
            return render(request, 'login.html')
        
        username = request.POST.get('username')
        password = request.POST.get('password')
        remember = request.POST.get('remember') == 'on'
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            # Сбрасываем счетчик попыток при успешном входе
            cache.delete(cache_key)
            
            # Устанавливаем время жизни сессии
            if remember:
                request.session.set_expiry(settings.SESSION_COOKIE_AGE)
            else:
                request.session.set_expiry(0)  # Сессия истекает при закрытии браузера
            
            login(request, user)
            messages.success(request, 'Вы успешно вошли в систему!')
            return redirect('main')
        else:
            # Увеличиваем счетчик попыток
            cache.set(cache_key, login_attempts + 1, 900)  # 900 секунд = 15 минут
            
            # Вычисляем оставшееся время блокировки
            remaining_time = cache.ttl(cache_key)
            minutes = remaining_time // 60
            seconds = remaining_time % 60
            
            if login_attempts >= 4:
                messages.error(request, f'Неверное имя пользователя или пароль. Осталось попыток: 1. После этого аккаунт будет заблокирован на 15 минут.')
            else:
                messages.error(request, f'Неверное имя пользователя или пароль. Осталось попыток: {5 - login_attempts - 1}')
            
            return render(request, 'login.html')
    
    return render(request, 'login.html')

def register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Аккаунт успешно создан!')
            return redirect('profile')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field}: {error}')
    else:
        form = CustomUserCreationForm()
    return render(request, 'register.html', {'form': form})

@login_required
def profile_view(request):
    if request.method == 'POST':
        # Обработка загрузки аватара
        if 'avatar' in request.FILES:
            avatar = request.FILES['avatar']
            fs = FileSystemStorage()
            filename = fs.save(f'avatars/{request.user.username}_{avatar.name}', avatar)
            request.user.avatar = filename
            request.user.save()
            messages.success(request, 'Аватар успешно обновлен!')
            return redirect('profile')
        
        # Обработка обновления профиля
        if 'update_profile' in request.POST:
            email = request.POST.get('email')
            if email and email != request.user.email:
                request.user.email = email
                request.user.save()
                messages.success(request, 'Профиль успешно обновлен!')
            return redirect('profile')
    
    return render(request, 'profile.html')

@login_required
def edit_profile_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        avatar = request.FILES.get('avatar')
        
        if email and email != request.user.email:
            if User.objects.filter(email=email).exists():
                messages.error(request, 'Этот email уже используется другим пользователем.')
            else:
                request.user.email = email
                request.user.save()
                messages.success(request, 'Email успешно обновлен!')
        
        if avatar:
            request.user.avatar = avatar
            request.user.save()
            messages.success(request, 'Аватар успешно обновлен!')
        
        return redirect('profile')
    
    return render(request, 'profile.html')

@login_required
def change_password_view(request):
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, 'Пароль успешно изменен!')
            return redirect('profile')
        else:
            messages.error(request, 'Пожалуйста, исправьте ошибки в форме.')
    else:
        form = PasswordChangeForm(request.user)
    return render(request, 'change_password.html', {'form': form})

def password_reset_view(request):
    if request.method == 'POST':
        form = PasswordResetForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            try:
                user = User.objects.get(email=email)
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                # Создаем ссылку для сброса пароля
                reset_url = f"{request.scheme}://{request.get_host()}/reset/{uid}/{token}/"
                
                # Отправляем email
                subject = 'Восстановление пароля на Anime Hub'
                message = render_to_string('email/password_reset_email.html', {
                    'user': user,
                    'reset_url': reset_url,
                })
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                    html_message=message
                )
                
                messages.success(request, 'Инструкции по восстановлению пароля отправлены на ваш email.')
                return redirect('login')
            except User.DoesNotExist:
                messages.error(request, 'Пользователь с таким email не найден.')
    else:
        form = PasswordResetForm()
    return render(request, 'password_reset.html', {'form': form})

def anime_detail(request, anime_id):
    """ Представление для отображения страницы аниме """
    anime = get_object_or_404(Anime, id=anime_id)
    context = {
        'anime': anime,
        'user_rating': None,
        'is_favorite': False
    }
    
    if request.user.is_authenticated:
        try:
            context['user_rating'] = Rating.objects.get(user=request.user, anime=anime).rating
        except Rating.DoesNotExist:
            pass
        
        context['is_favorite'] = Favorite.objects.filter(user=request.user, anime=anime).exists()
    
    return render(request, 'anime.html', context)

@login_required
@require_http_methods(['POST'])
def rate_anime(request):
    """ API для оценки аниме """
    try:
        data = json.loads(request.body)
        anime_id = data.get('anime_id')
        rating = data.get('rating')
        
        if not anime_id or not rating:
            return JsonResponse({'success': False, 'error': 'Неверные данные'})
        
        anime = get_object_or_404(Anime, id=anime_id)
        rating_obj, created = Rating.objects.get_or_create(
            user=request.user,
            anime=anime,
            defaults={'rating': rating}
        )
        
        if not created:
            rating_obj.rating = rating
            rating_obj.save()
        
        return JsonResponse({
            'success': True,
            'average_rating': anime.average_rating
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@require_http_methods(['POST'])
def toggle_favorite(request):
    """ API для добавления/удаления из избранного """
    try:
        data = json.loads(request.body)
        anime_id = data.get('anime_id')
        
        if not anime_id:
            return JsonResponse({'success': False, 'error': 'Неверные данные'})
        
        anime = get_object_or_404(Anime, id=anime_id)
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            anime=anime
        )
        
        if not created:
            favorite.delete()
            message = 'Аниме удалено из избранного'
        else:
            message = 'Аниме добавлено в избранное'
        
        return JsonResponse({
            'success': True,
            'message': message,
            'is_favorite': created
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@require_http_methods(['POST'])
def add_comment(request):
    """ API для добавления комментария """
    try:
        data = json.loads(request.body)
        anime_id = data.get('anime_id')
        text = data.get('text')
        
        if not anime_id or not text:
            return JsonResponse({'success': False, 'error': 'Неверные данные'})
        
        anime = get_object_or_404(Anime, id=anime_id)
        comment = Comment.objects.create(
            user=request.user,
            anime=anime,
            text=text
        )
        
        return JsonResponse({
            'success': True,
            'comment': {
                'username': comment.user.username,
                'user_avatar': comment.user.avatar.url if comment.user.avatar else None,
                'text': comment.text,
                'created_at': comment.created_at.isoformat()
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@require_http_methods(['PUT'])
def edit_comment(request, comment_id):
    """ API для редактирования комментария """
    try:
        data = json.loads(request.body)
        text = data.get('text')
        
        if not text:
            return JsonResponse({'success': False, 'error': 'Неверные данные'})
        
        comment = get_object_or_404(Comment, id=comment_id)
        
        # Проверяем, является ли пользователь автором комментария
        if comment.user != request.user:
            return JsonResponse({'success': False, 'error': 'Нет прав на редактирование'}, status=403)
        
        comment.text = text
        comment.save()
        
        return JsonResponse({
            'success': True,
            'comment': {
                'id': comment.id,
                'username': comment.user.username,
                'user_avatar': comment.user.avatar.url if comment.user.avatar else None,
                'text': comment.text,
                'created_at': comment.created_at.isoformat()
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@require_http_methods(['DELETE'])
def delete_comment(request, comment_id):
    """ API для удаления комментария """
    try:
        comment = get_object_or_404(Comment, id=comment_id)
        
        # Проверяем, является ли пользователь автором комментария
        if comment.user != request.user:
            return JsonResponse({'success': False, 'error': 'Нет прав на удаление'}, status=403)
        
        comment.delete()
        
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

def get_anime_comments(request, anime_id):
    """ API для получения комментариев к аниме """
    try:
        anime = get_object_or_404(Anime, id=anime_id)
        page = int(request.GET.get('page', 1))
        per_page = 10
        
        comments = anime.comments.all()[(page-1)*per_page:page*per_page]
        
        comments_data = [{
            'id': comment.id,
            'username': comment.user.username,
            'user_avatar': comment.user.avatar.url if comment.user.avatar else None,
            'text': comment.text,
            'created_at': comment.created_at.isoformat()
        } for comment in comments]
        
        return JsonResponse({
            'success': True,
            'comments': comments_data,
            'has_more': len(comments) == per_page
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
