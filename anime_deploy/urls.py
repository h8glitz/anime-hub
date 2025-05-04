from django.urls import path
from . import views

urlpatterns = [
    # Основные маршруты
    path('anime/<int:anime_id>/', views.anime_detail, name='anime_detail'),
    
    # API маршруты
    path('api/anime/rate/', views.rate_anime, name='rate_anime'),
    path('api/anime/favorite/', views.toggle_favorite, name='toggle_favorite'),
    path('api/anime/comment/', views.add_comment, name='add_comment'),
    path('api/anime/<int:anime_id>/comments/', views.get_anime_comments, name='get_anime_comments'),
    
    # API для работы с комментариями
    path('api/anime/comment/<int:comment_id>/', views.edit_comment, name='edit_comment'),
    path('api/anime/comment/<int:comment_id>/delete/', views.delete_comment, name='delete_comment'),
    path('login/', views.login_view, name='login'),
    path('change-password/', views.change_password_view, name='change_password'),
    path('password-reset/', views.password_reset_view, name='password_reset'),
    path('reset/<uidb64>/<token>/', views.password_reset_confirm_view, name='password_reset_confirm'),
] 