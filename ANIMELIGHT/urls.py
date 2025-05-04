from django.shortcuts import render
from django.shortcuts import render
from django.urls import path
from anime_deploy import views  # Импортируем views из приложения anime_deploy
from django.contrib.auth import views as auth_views



urlpatterns = [

    path('', views.main, name='main'),  # Главная страница ('/'
    path('main/', views.main, name='main'),  # Главная страница ('/'
    path('about/', views.about, name='about'),
    path('profile/', views.profile, name='profile'),
    path('get_kodik_token/', views.get_kodik_token, name='get_kodik_token'),
    path('kodik-api/', views.kodik_proxy),
    path('kodik-api/<path:path>', views.kodik_proxy),

    path("api/anime/",views.AnimeListView.as_view(), name="api_anime"),  # ✅ Это JSON API для списка аниме

    # ✅ Исправленный маршрут для списка аниме (CBV)
    path("anime_collection/", lambda request: render(request, "../templates/anime_collection.html"), name="anime_scroll"),

    # 🔹 Динамический маршрут для просмотра конкретного аниме 🎬
    path("anime/<str:anime_id>/", views.anime, name="anime"),

    path("accounts/login/", views.login_view, name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('register/', views.register_view, name='register'),
    path('support/', views.support_view, name='support'),
  # Ваши другие маршруты
]

