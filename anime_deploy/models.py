from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class CustomUser(AbstractUser):
    """ Кастомная модель пользователя, заменяющая стандартный User """
    email = models.EmailField(unique=True)  # Поле email обязательно и уникально
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    def __str__(self):
        return self.username

class Anime(models.Model):
    """ Модель аниме """
    title = models.CharField(max_length=255)
    description = models.TextField()
    poster = models.ImageField(upload_to='posters/')
    year = models.IntegerField()
    episodes = models.IntegerField()
    status = models.CharField(max_length=50)
    duration = models.CharField(max_length=50)
    age_rating = models.CharField(max_length=10)
    genres = models.ManyToManyField('Genre')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    @property
    def average_rating(self):
        ratings = self.ratings.all()
        if not ratings:
            return 0
        return sum(r.rating for r in ratings) / len(ratings)

class Genre(models.Model):
    """ Модель жанра """
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Rating(models.Model):
    """ Модель рейтинга """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    anime = models.ForeignKey(Anime, on_delete=models.CASCADE, related_name='ratings')
    rating = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'anime')

class Favorite(models.Model):
    """ Модель избранного """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    anime = models.ForeignKey(Anime, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'anime')

class Comment(models.Model):
    """ Модель комментария """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    anime = models.ForeignKey(Anime, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
