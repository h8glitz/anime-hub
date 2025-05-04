from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Кастомизация сообщений об ошибках
        self.fields['username'].error_messages = {
            'required': 'Пожалуйста, введите имя пользователя',
            'unique': 'Это имя пользователя уже занято',
            'invalid': 'Имя пользователя может содержать только буквы, цифры и символы @/./+/-/_'
        }
        self.fields['email'].error_messages = {
            'required': 'Пожалуйста, введите email',
            'invalid': 'Пожалуйста, введите корректный email'
        }
        self.fields['password1'].error_messages = {
            'required': 'Пожалуйста, введите пароль',
            'password_too_short': 'Пароль должен содержать минимум 8 символов',
            'password_too_common': 'Этот пароль слишком простой',
            'password_entirely_numeric': 'Пароль не может состоять только из цифр'
        }
        self.fields['password2'].error_messages = {
            'required': 'Пожалуйста, подтвердите пароль',
            'password_mismatch': 'Пароли не совпадают'
        }
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('Этот email уже зарегистрирован')
        return email
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user
