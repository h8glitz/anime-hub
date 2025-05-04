document.addEventListener('DOMContentLoaded', function() {
    // Инициализация рейтинга
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.dataset.rating;
            updateRating(rating);
        });
    });

    // Обработка добавления в избранное
    const favoriteBtn = document.getElementById('add-to-favorite');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', function() {
            toggleFavorite();
        });
    }

    // Обработка кнопки "Поделиться"
    const shareBtn = document.getElementById('share-button');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            shareAnime();
        });
    }

    // Обработка комментариев
    const commentForm = document.querySelector('.comment-form');
    const commentText = document.getElementById('comment-text');
    const submitComment = document.getElementById('submit-comment');

    if (submitComment && commentText) {
        submitComment.addEventListener('click', function() {
            submitNewComment(commentText.value);
        });
    }

    // Загрузка комментариев при прокрутке
    let currentPage = 1;
    const commentsContainer = document.getElementById('comments-container');
    let isLoading = false;

    function loadMoreComments() {
        if (isLoading) return;
        isLoading = true;

        fetch(`/api/anime/${getAnimeId()}/comments/?page=${currentPage}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.comments.length > 0) {
                    data.comments.forEach(comment => {
                        addCommentToPage(comment);
                    });
                    currentPage++;
                }
                isLoading = false;
            })
            .catch(error => {
                console.error('Error:', error);
                isLoading = false;
            });
    }

    // Наблюдатель за прокруткой
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadMoreComments();
            }
        });
    });

    // Добавляем элемент для наблюдения
    const loadMoreTrigger = document.createElement('div');
    loadMoreTrigger.id = 'load-more-trigger';
    commentsContainer.appendChild(loadMoreTrigger);
    observer.observe(loadMoreTrigger);

    // Загружаем первые комментарии
    loadMoreComments();
});

// Функция обновления рейтинга
function updateRating(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        if (star.dataset.rating <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });

    // Отправка рейтинга на сервер
    fetch('/api/anime/rate/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            rating: rating,
            anime_id: getAnimeId()
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Рейтинг успешно обновлен');
            // Обновляем отображение среднего рейтинга
            document.getElementById('rating').textContent = data.average_rating.toFixed(1);
        } else {
            showNotification('Ошибка при обновлении рейтинга', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Произошла ошибка', 'error');
    });
}

// Функция добавления/удаления из избранного
function toggleFavorite() {
    const favoriteBtn = document.getElementById('add-to-favorite');
    
    fetch('/api/anime/favorite/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            anime_id: getAnimeId()
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            favoriteBtn.classList.toggle('active');
            showNotification(data.message);
        } else {
            showNotification('Ошибка при обновлении избранного', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Произошла ошибка', 'error');
    });
}

// Функция поделиться аниме
function shareAnime() {
    const url = window.location.href;
    const title = document.getElementById('anime-title').textContent;

    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        })
        .catch(error => console.log('Error sharing:', error));
    } else {
        // Fallback для браузеров без поддержки Web Share API
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showNotification('Ссылка скопирована в буфер обмена');
    }
}

// Функция отправки комментария
function submitNewComment(text) {
    if (!text.trim()) {
        showNotification('Комментарий не может быть пустым', 'error');
        return;
    }

    fetch('/api/anime/comment/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            anime_id: getAnimeId(),
            text: text
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('comment-text').value = '';
            addCommentToPage(data.comment);
            showNotification('Комментарий успешно добавлен');
        } else {
            showNotification('Ошибка при добавлении комментария', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Произошла ошибка', 'error');
    });
}

// Функция редактирования комментария
function editComment(commentId, currentText) {
    const newText = prompt('Редактировать комментарий:', currentText);
    if (newText === null) return;

    fetch(`/api/anime/comment/${commentId}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            text: newText
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            commentElement.querySelector('.comment-text').textContent = newText;
            showNotification('Комментарий успешно отредактирован');
        } else {
            showNotification('Ошибка при редактировании комментария', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Произошла ошибка', 'error');
    });
}

// Функция удаления комментария
function deleteComment(commentId) {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) return;

    fetch(`/api/anime/comment/${commentId}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            commentElement.remove();
            showNotification('Комментарий успешно удален');
        } else {
            showNotification('Ошибка при удалении комментария', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Произошла ошибка', 'error');
    });
}

// Вспомогательные функции
function getAnimeId() {
    const path = window.location.pathname;
    return path.split('/').filter(Boolean).pop();
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function addCommentToPage(comment) {
    const commentsContainer = document.getElementById('comments-container');
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.dataset.commentId = comment.id;
    
    const isCurrentUser = comment.username === document.querySelector('.user-info')?.dataset.username;
    
    commentElement.innerHTML = `
        <div class="comment-header">
            <img src="${comment.user_avatar || '/static/images/default-avatar.png'}" alt="Avatar" class="comment-avatar">
            <div class="comment-info">
                <div class="comment-author">${comment.username}</div>
                <div class="comment-date">${new Date(comment.created_at).toLocaleDateString()}</div>
            </div>
        </div>
        <div class="comment-text">${comment.text}</div>
        ${isCurrentUser ? `
            <div class="comment-actions">
                <button class="comment-action-btn edit" onclick="editComment(${comment.id}, '${comment.text.replace(/'/g, "\\'")}')">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="comment-action-btn delete" onclick="deleteComment(${comment.id})">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        ` : ''}
    `;
    
    // Вставляем перед триггером загрузки
    const loadMoreTrigger = document.getElementById('load-more-trigger');
    commentsContainer.insertBefore(commentElement, loadMoreTrigger);
} 