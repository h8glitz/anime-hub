document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registration-form');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Остановить отправку формы

        const formData = new FormData(form);

        fetch('/register/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'Accept': 'application/json' // Ожидаем JSON-ответ от сервера
            },
            body: formData,
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    window.location.href = '/profile'; // Перенаправление на профиль при успешной регистрации
                }
            })
            .catch(error => {
                console.error("Ошибка:", error);

                // Правильный разбор вложенных ошибок Django
                let errorsObj = JSON.parse(error.error);

                let errorMessages = "";

                Object.keys(errorsObj).forEach((field) => {
                    errorsObj[field].forEach(errItem => {
                        errorMessages += `<p style="color: red;">${errItem.message}</p>`;
                    });
                });

                errorMessage.innerHTML = errorMessages;
            });
    });
});
