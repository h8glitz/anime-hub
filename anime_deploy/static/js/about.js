// Loading Animation
document.addEventListener('DOMContentLoaded', () => {
    const loading = document.querySelector('.loading');
    if (loading) {
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 1000);
    }
});

// Scroll Progress Bar
const scrollProgress = document.querySelector('.scroll-progress');
window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    scrollProgress.style.transform = `scaleX(${scrolled / 100})`;
});

// Back to Top Button
const backToTop = document.querySelector('.back-to-top');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.highlight-item, .testimonial-card').forEach(el => {
    observer.observe(el);
});

// Add loading animation to page
const loadingHTML = `
    <div class="loading">
        <div class="loading-spinner"></div>
    </div>
`;

// Add scroll progress bar
const progressHTML = `
    <div class="scroll-progress"></div>
`;

// Add back to top button
const backToTopHTML = `
    <a href="#" class="back-to-top">
        <i class="fas fa-arrow-up"></i>
    </a>
`;

// Insert new elements
document.body.insertAdjacentHTML('beforeend', loadingHTML + progressHTML + backToTopHTML);

// Комментарии: доработанный функционал
const commentForm = document.getElementById('comment-form');
const commentsList = document.getElementById('comments-list');
let commentCount = commentsList ? commentsList.querySelectorAll('.testimonial-card').length : 0;

function getInitialAvatar(name) {
    const letter = name.trim()[0] ? name.trim()[0].toUpperCase() : 'A';
    return `<div class="avatar-initial">${letter}</div>`;
}

function getTimeString(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Только что';
    if (diff < 3600) return `${Math.floor(diff/60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff/3600)} ч назад`;
    return date.toLocaleDateString();
}

function showNoCommentsPlaceholder() {
    if (!commentsList.querySelector('.testimonial-card')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'no-comments';
        placeholder.innerHTML = '<p>Пока нет комментариев. Будьте первым!</p>';
        commentsList.appendChild(placeholder);
    }
}

function removeNoCommentsPlaceholder() {
    const ph = commentsList.querySelector('.no-comments');
    if (ph) ph.remove();
}

if (commentForm && commentsList) {
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('comment-name').value.trim() || 'Аноним';
        const text = document.getElementById('comment-text').value.trim();
        if (!text) return;
        if (text.length > 500) {
            alert('Комментарий слишком длинный (максимум 500 символов)');
            return;
        }
        removeNoCommentsPlaceholder();
        const now = new Date();
        // Создаём разметку нового комментария
        const card = document.createElement('div');
        card.className = 'testimonial-card animate';
        card.innerHTML = `
            <div class="testimonial-content">
                <p>"${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}"</p>
            </div>
            <div class="testimonial-author">
                ${getInitialAvatar(name)}
                <div class="author-info">
                    <h4>${name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h4>
                    <p class="comment-time">${getTimeString(now)}</p>
                </div>
                <button class="delete-comment" title="Удалить">&times;</button>
            </div>
        `;
        // Добавляем в начало списка
        commentsList.prepend(card);
        // Анимация появления
        setTimeout(() => card.classList.remove('animate'), 600);
        // Очищаем форму
        commentForm.reset();
        commentCount++;
    });

    // Удаление комментария (только локально)
    commentsList.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-comment')) {
            const card = e.target.closest('.testimonial-card');
            if (card) {
                card.remove();
                commentCount--;
                if (commentCount === 0) showNoCommentsPlaceholder();
            }
        }
    });

    // Если нет комментариев, показать плейсхолдер
    if (commentCount === 0) showNoCommentsPlaceholder();
}

// Стили для аватарки с буквой и плейсхолдера можно добавить в CSS 