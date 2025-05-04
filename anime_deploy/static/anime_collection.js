document.addEventListener("DOMContentLoaded", () => {
    console.log("🔥 [LOG]: Страница загружена!");

    // Добавляем возможность включения отладочного режима
    let debugMode = false;
    
    // Функция для вывода отладочной информации
    function debugLog(...args) {
        if (debugMode) {
            console.log('[DEBUG]', ...args);
        }
    }
    
    // Добавляем обработчик для включения отладочного режима по нажатию Ctrl+Shift+D
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            debugMode = !debugMode;
            if (debugMode) {
                console.log('🔧 Отладочный режим включен');
                // Создаем панель отладки
                createDebugPanel();
            } else {
                console.log('🔧 Отладочный режим выключен');
                // Удаляем панель отладки
                const debugPanel = document.querySelector('.debug-panel');
                if (debugPanel) debugPanel.remove();
            }
        }
    });
    
    // Функция для создания панели отладки
    function createDebugPanel() {
        // Проверяем, не создана ли уже панель
        if (document.querySelector('.debug-panel')) return;
        
        // Создаем панель
        const debugPanel = document.createElement('div');
        debugPanel.className = 'debug-panel';
        debugPanel.innerHTML = `
            <h3>Панель отладки</h3>
            <div class="debug-info">
                <div>Загружено аниме: <span class="debug-loaded-count">0</span></div>
                <div>Текущая страница: <span class="debug-current-page">1</span></div>
                <div>Есть еще данные: <span class="debug-has-more">${hasMoreData ? 'Да' : 'Нет'}</span></div>
                <div>Токен след. страницы: <span class="debug-next-token">${nextPageToken || 'Нет'}</span></div>
            </div>
            <div class="debug-actions">
                <button class="debug-reload">Перезагрузить данные</button>
                <button class="debug-next-page">Следующая страница</button>
                <button class="debug-clear-cache">Очистить кэш</button>
                <button class="debug-dump-data">Показать данные</button>
            </div>
        `;
        
        // Добавляем стили для панели
        const debugStyles = document.createElement('style');
        debugStyles.textContent = `
            .debug-panel {
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 300px;
                background: rgba(20, 20, 20, 0.9);
                color: #ddd;
                padding: 15px;
                border-radius: 8px;
                border: 2px solid #f39c12;
                z-index: 9999;
                font-family: monospace;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                max-height: 80vh;
                overflow-y: auto;
            }
            .debug-panel h3 {
                margin-top: 0;
                color: #f39c12;
                text-align: center;
            }
            .debug-info {
                margin: 10px 0;
                font-size: 13px;
            }
            .debug-info div {
                margin: 5px 0;
            }
            .debug-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }
            .debug-actions button {
                flex: 1 0 45%;
                background: #333;
                border: 1px solid #555;
                color: #ddd;
                padding: 5px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            .debug-actions button:hover {
                background: #444;
            }
        `;
        document.head.appendChild(debugStyles);
        
        // Добавляем панель в DOM
        document.body.appendChild(debugPanel);
        
        // Обработчики для кнопок
        document.querySelector('.debug-reload').addEventListener('click', () => {
            console.log('🔄 Перезагрузка данных...');
            resetPaginationAndData();
            fetchAnime(1, false);
        });
        
        document.querySelector('.debug-next-page').addEventListener('click', () => {
            if (hasMoreData) {
                console.log(`🔄 Загружаем страницу ${currentPage + 1}...`);
                fetchAnime(currentPage + 1, true);
            } else {
                console.log('⚠️ Нет больше данных для загрузки');
            }
        });
        
        document.querySelector('.debug-clear-cache').addEventListener('click', () => {
            console.log('🧹 Очистка кэша...');
            // Очищаем массивы данных
            animeData = [];
            filteredData = [];
            // Сбрасываем пагинацию
            currentPage = 1;
            hasMoreData = true;
            nextPageToken = null;
            // Перезагружаем данные
            fetchAnime(1, false);
        });
        
        document.querySelector('.debug-dump-data').addEventListener('click', () => {
            console.log('📊 Текущие данные:', {
                animeData: animeData.slice(0, 5) + '... и еще ' + (animeData.length - 5) + ' элементов',
                filteredData: filteredData.slice(0, 5) + '... и еще ' + (filteredData.length - 5) + ' элементов',
                currentPage,
                hasMoreData,
                nextPageToken,
                isLoading,
                MAX_PAGES,
                MAX_ITEMS,
                API_TOTAL_ITEMS
            });
            
            // Выводим первые 3 элемента для анализа
            if (animeData.length > 0) {
                console.log('📊 Пример структуры данных:', JSON.stringify(animeData.slice(0, 3), null, 2));
            }
        });
        
        // Функция для обновления информации в панели
        function updateDebugPanel() {
            document.querySelector('.debug-loaded-count').textContent = animeData.length;
            document.querySelector('.debug-current-page').textContent = currentPage;
            document.querySelector('.debug-has-more').textContent = hasMoreData ? 'Да' : 'Нет';
            document.querySelector('.debug-next-token').textContent = nextPageToken ? 'Есть' : 'Нет';
        }
        
        // Запускаем обновление каждую секунду
        setInterval(updateDebugPanel, 1000);
    }

    const animeList = document.getElementById("anime-list");
    const genreFilter = document.getElementById("genre");
    const ratingFilter = document.getElementById("rating");
    const completedCheckbox = document.getElementById("completed");
    const ongoingCheckbox = document.getElementById("ongoing");
    const searchInput = document.getElementById("search-input"); // Изменено: поле для поиска
    const searchBtn = document.getElementById("search-btn"); // Кнопка поиска

    // Проверка наличия необходимых DOM-элементов
    if (!animeList) {
        console.error("❌ Ошибка! Элемент #anime-list не найден на странице.");
        return;
    }

    // Элементы статус-бара
    const statusText = document.querySelector('.status-text');
    const progressFilled = document.querySelector('.progress-filled');

    // Добавляем глобальные стили для карточек аниме один раз при загрузке страницы
    addAnimeCardStyles();

    // Создаем индикатор прогресса загрузки
    const progressElement = document.createElement('div');
    progressElement.className = 'load-progress';
    progressElement.innerHTML = `
        <div class="progress-info">
            <span class="loaded-count">0</span>/<span class="total-count">0</span> аниме загружено
        </div>
        <div class="progress-status">Загрузка...</div>
    `;

    // Добавляем стили для индикатора прогресса
    const progressStyle = document.createElement('style');
    progressStyle.textContent = `
        .load-progress {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(26, 26, 26, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            font-size: 14px;
            border: 1px solid var(--accent-orange);
        }
        .progress-info {
            margin-bottom: 5px;
            text-align: center;
        }
        .progress-status {
            font-size: 12px;
            text-align: center;
            color: var(--accent-orange);
        }
        .loaded-count, .total-count {
            font-weight: bold;
        }
    `;
    document.head.appendChild(progressStyle);
    document.body.appendChild(progressElement);

    // 🔥 Вставьте свой API-ключ из Kodik
    const API_KEY = "447d179e875efe44217f20d1ee2146be";

    if (!API_KEY) {
        console.error("❌ Ошибка! Не найден API ключ Kodik.");
        animeList.innerHTML = `<p style="color: red;">Ошибка загрузки аниме! (Ключ не найден)</p>`;
        return;
    }

    // Параметры для бесконечного скролла
    let currentPage = 1;
    let isLoading = false;
    let hasMoreData = true;
    let animeData = []; // Все загруженные данные
    let filteredData = []; // Отфильтрованные данные для отображения
    let MAX_PAGES = 40; // Начальное ограничение максимального количества страниц
    let MAX_ITEMS = 2000; // Начальное ограничение максимального количества элементов
    let API_TOTAL_ITEMS = null; // Общее количество элементов по данным API

    // Начальный счетчик попыток
    window.apiAttemptCount = 0;
    window.firstApiAttemptFailed = false;

    // Сохраняем токены страниц для навигации
    let nextPageToken = null;

    // Функция обновления индикатора прогресса и статус-бара
    function updateProgressIndicator(loaded, maxItems, status = "Загрузка...") {
        const loadedCountElement = document.querySelector('.loaded-count');
        const totalCountElement = document.querySelector('.total-count');
        const statusElement = document.querySelector('.progress-status');
        
        if (loadedCountElement && totalCountElement && statusElement) {
            loadedCountElement.textContent = loaded;
            totalCountElement.textContent = maxItems;
            statusElement.textContent = status;
        }
        
        // Обновляем статус-бар
        if (statusText) {
            statusText.textContent = status;
            
            // Если есть информация о максимальном количестве элементов от API, добавляем счетчик
            if (API_TOTAL_ITEMS !== null) {
                const statusProgress = document.querySelector('.status-progress') || document.createElement('div');
                statusProgress.className = 'status-progress';
                statusProgress.textContent = `${loaded} из ${API_TOTAL_ITEMS} аниме`;
                
                // Если элемент еще не добавлен, добавляем его
                if (!document.querySelector('.status-progress')) {
                    const statusContainer = document.querySelector('.status-container');
                    if (statusContainer) {
                        statusContainer.insertBefore(statusProgress, document.querySelector('.progress-bar'));
                    }
                }
            }
        }
        
        // Обновляем прогресс-бар
        if (progressFilled) {
            // Используем значение из API для расчета прогресса, если оно доступно
            const totalForProgress = API_TOTAL_ITEMS !== null ? API_TOTAL_ITEMS : maxItems;
            const progressPercent = Math.min((loaded / totalForProgress) * 100, 100);
            progressFilled.style.width = `${progressPercent}%`;
        }
    }

    // 📡 Формирование URL для запроса с учетом пагинации и поиска
    function getApiUrl(page = 1, nextPageToken = null, searchQuery = null) {
        // Для первой страницы используем упрощенный запрос (важно: у локального API должно быть другое начало пути)
        if (page === 1 && window.location.pathname.startsWith('/admin/')) {
            return '/api/anime/';
        }
        
        // Если передан токен следующей страницы, используем его
        if (nextPageToken) {
            // Если есть поисковый запрос, добавляем его к токену
            if (searchQuery) {
                return `${nextPageToken}&title=${encodeURIComponent(searchQuery)}`;
            }
            return nextPageToken;
        }
        
        // Для всех остальных случаев используем прямой запрос к Kodik с базовыми параметрами
        const limit = 50; // Количество элементов на страницу
        const offset = (page - 1) * limit;
        
        // Начинаем с базового URL
        let url = `https://kodikapi.com/list?token=${API_KEY}&types=anime-serial,anime&limit=${limit}&offset=${offset}`;
        
        // Добавляем material_data только если это не первая попытка запроса
        if (!window.firstApiAttemptFailed) {
            url += '&with_material_data=true';
        }
        
        // Эти параметры добавляем только если это первая или вторая попытка
        if (!window.apiAttemptCount || window.apiAttemptCount <= 2) {
            // Добавляем базовые параметры для пагинации
            url += '&with_pagination=true';
        }
        
        // Если передан поисковый запрос, добавляем его к URL
        if (searchQuery) {
            // Добавляем все возможные параметры поиска для улучшения результатов
            url += `&title=${encodeURIComponent(searchQuery)}`;
            
            // Добавляем важные параметры для улучшения поиска
            url += '&full_match=false'; // Ищем частичные совпадения
            url += '&with_material_data=true'; // Обязательно получаем информацию о материале
            
            // Если длина запроса более 5 символов, установим минимальную релевантность для улучшения точности
            if (searchQuery.length > 5) {
                url += '&min_relevance=0.2'; // Установка минимальной релевантности
            }
            
            // Ищем также в оригинальных названиях
            url += `&title_orig=${encodeURIComponent(searchQuery)}`;
            
            // Если запрос на кириллице - ищем в японских и английских названиях
            if (/[а-яА-ЯёЁ]/.test(searchQuery)) {
                url += `&translation=${encodeURIComponent(searchQuery)}`;
            }
            
            // Сортировка по релевантности
            url += '&sort=relevance';
        }
        
        console.log(`🔎 Формирование поискового запроса для "${searchQuery}"`);
        console.log(`🔗 Сформирован URL API: ${url}`);
        
        return url;
    }
    
    // 🚀 Альтернативный метод загрузки данных с использованием JSONP для обхода CORS
    function fetchAnimeWithJSONP(page = 1, append = false) {
        return new Promise((resolve, reject) => {
            try {
                // Создаем уникальное имя функции обратного вызова
                const callbackName = 'jsonpCallback_' + Math.random().toString(36).substring(2, 15);
                
                // Регистрируем функцию обратного вызова в глобальной области
                window[callbackName] = function(data) {
                    // Удаляем скрипт после выполнения
                    if (script.parentNode) script.parentNode.removeChild(script);
                    // Удаляем глобальную функцию
                    delete window[callbackName];
                    // Возвращаем данные
                    resolve(data);
                };
                
                // Формируем URL с параметром callback
                const apiUrl = getApiUrl(page) + `&callback=${callbackName}`;
                
                // Создаем элемент скрипта
                const script = document.createElement('script');
                script.src = apiUrl;
                script.onerror = function() {
                    // Удаляем скрипт при ошибке
                    if (script.parentNode) script.parentNode.removeChild(script);
                    // Удаляем глобальную функцию
                    delete window[callbackName];
                    // Возвращаем ошибку
                    reject(new Error('Не удалось загрузить данные через JSONP'));
                };
                
                // Добавляем скрипт на страницу
                document.head.appendChild(script);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    // 🚀 Функция получения списка аниме с поддержкой пагинации
    async function fetchAnime(page = 1, append = false) {
        try {
            if (isLoading || (!hasMoreData && append)) return;
            
            // Увеличиваем счетчик попыток
            window.apiAttemptCount = (window.apiAttemptCount || 0) + 1;
            
            // Проверяем, не превышен ли лимит страниц
            if (page > MAX_PAGES) {
                console.log(`📢 Достигнуто максимальное количество страниц (${MAX_PAGES}). Загрузка остановлена.`);
                hasMoreData = false;
                removeLoadingMore();
                updateProgressIndicator(animeData.length, MAX_ITEMS, "Максимальное количество страниц достигнуто!");
                return;
            }
            
            // Проверяем, не превышен ли лимит элементов
            if (animeData.length >= MAX_ITEMS) {
                console.log(`📢 Достигнуто максимальное количество элементов (${MAX_ITEMS}). Загрузка остановлена.`);
                hasMoreData = false;
                removeLoadingMore();
                updateProgressIndicator(animeData.length, MAX_ITEMS, "Максимальное количество аниме достигнуто!");
                return;
            }
            
            isLoading = true;
            updateProgressIndicator(animeData.length, MAX_ITEMS, `Загрузка страницы ${page}...`);
            
            if (!append) {
                showLoading();
                // Сбрасываем токен следующей страницы при новой загрузке
                nextPageToken = null;
            } else {
                showLoadingMore();
            }
            
            console.log(`🔄 Загружаем данные (страница ${page})...`);
            
            // Получаем текущий поисковый запрос для продолжения поиска, если поле поиска существует
            const currentSearchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
            const isSearchActive = currentSearchQuery.length >= 3;
            
            // Используем токен следующей страницы, если он есть, или добавляем параметр поиска если активен поиск
            const apiUrl = getApiUrl(page, nextPageToken, isSearchActive ? currentSearchQuery : null);
            console.log(`📡 URL запроса: ${apiUrl}`);
            
            let data;
            
            try {
                // Сначала пробуем обычный fetch
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`Ошибка запроса: ${response.status}`);
                data = await response.json();
            } catch (fetchError) {
                console.log(`⚠️ Ошибка при использовании fetch: ${fetchError.message}`);
                console.log(`🔄 Пробуем альтернативный метод загрузки...`);
                
                try {
                    // Если fetch не сработал, пробуем метод JSONP
                    data = await fetchAnimeWithJSONP(page, append);
                } catch (jsonpError) {
                    console.log(`⚠️ Не удалось загрузить данные через JSONP: ${jsonpError.message}`);
                    throw new Error('Не удалось загрузить данные ни через fetch, ни через JSONP');
                }
            }
            
            // Диагностическое логирование ответа API
            console.log(`🔍 API ответ:`, {
                success: data.success,
                total: data.total,
                time: data.time,
                resultsCount: data.results ? data.results.length : 0
            });
            
            // Проверяем, есть ли результаты
            if (!data.results || data.results.length === 0) {
                console.log("⚠️ API не вернул результатов. Пробуем запасной вариант...");
                
                // Помечаем, что первая попытка не удалась
                window.firstApiAttemptFailed = true;
                
                // Если это первая неудачная попытка, пробуем другой метод
                if (window.apiAttemptCount <= 3) {
                    // Сбрасываем флаг загрузки
                    isLoading = false;
                    
                    // Пробуем снова с другими параметрами
                    console.log("🔄 Повторная попытка с другими параметрами...");
                    setTimeout(() => fetchAnime(page, append), 1000);
                    return;
                }
                
                // Если все попытки не удались, создаем тестовые данные
                if (animeData.length === 0) {
                    console.log("🔄 Все попытки не удались. Создаем тестовые данные...");
                    createTestAnimeCards();
                    hasMoreData = false;
                    isLoading = false;
                    
                    // Обновляем индикатор прогресса
                    updateProgressIndicator(animeData.length, MAX_ITEMS, "Не удалось загрузить данные. Показаны тестовые данные.");
                    return;
                }
                
                // Для последующих страниц просто останавливаем загрузку
                hasMoreData = false;
                removeLoadingMore();
                isLoading = false;
                updateProgressIndicator(animeData.length, MAX_ITEMS, "Больше аниме не найдено");
                return;
            }
            
            // Проверяем, чтобы в результатах действительно были объекты с данными
            const validResults = data.results.filter(item => item && (item.material_data || item.title));
            if (validResults.length === 0 && data.results.length > 0) {
                console.log("⚠️ API вернул результаты, но они не содержат необходимых данных:", data.results);
                animeList.innerHTML = "<p class='no-results'>Получены некорректные данные от API. Пожалуйста, попробуйте позже.</p>";
                isLoading = false;
                return;
            }
            
            // Проверка на наличие meta-данных для диагностики ограничений
            if (data.next_page !== undefined) {
                console.log(`📄 Следующая страница: ${data.next_page}`);
                nextPageToken = data.next_page; // Сохраняем токен следующей страницы
            }
            if (data.prev_page !== undefined) {
                console.log(`📄 Предыдущая страница: ${data.prev_page}`);
            }
            if (data.total !== undefined) {
                console.log(`📊 Всего элементов по данным API: ${data.total}`);
            }
            
            // Проверка на наличие информации о количестве страниц
            if (data.pages !== undefined) {
                console.log(`📑 Всего страниц по данным API: ${data.pages}`);
                if (data.pages < MAX_PAGES) {
                    MAX_PAGES = data.pages;
                    console.log(`📑 Обновлено максимальное количество страниц: ${MAX_PAGES}`);
                }
            }
            
            // Проверка на наличие параметров пагинации в более новой версии API
            if (data.pagination) {
                console.log(`📊 Информация о пагинации:`, data.pagination);
                
                if (data.pagination.total_items !== undefined) {
                    API_TOTAL_ITEMS = data.pagination.total_items;
                    console.log(`📊 Всего элементов по данным пагинации: ${API_TOTAL_ITEMS}`);
                    
                    // Обновляем максимальное количество элементов
                    if (API_TOTAL_ITEMS < MAX_ITEMS) {
                        MAX_ITEMS = API_TOTAL_ITEMS;
                        console.log(`📊 Обновлено максимальное количество элементов: ${MAX_ITEMS}`);
                    }
                }
                
                if (data.pagination.total_pages !== undefined) {
                    const apiTotalPages = data.pagination.total_pages;
                    console.log(`📑 Всего страниц по данным пагинации: ${apiTotalPages}`);
                    
                    // Обновляем максимальное количество страниц
                    if (apiTotalPages < MAX_PAGES) {
                        MAX_PAGES = apiTotalPages;
                        console.log(`📑 Обновлено максимальное количество страниц: ${MAX_PAGES}`);
                    }
                }
            }
            
            let newItems = [];
            
            if (data.success && data.results && data.results.length > 0) {
                // Формат локального API
                newItems = data.results.map(item => ({
                    id: item.id || item.link || '1',
                    material_data: {
                        title: item.title || "Без названия",
                        poster_url: item.poster_url || item.poster || '',
                        genres: item.genres || ['Без жанра'],
                        shikimori_rating: item.rating,
                        anime_status: item.status || 'released',
                        description: item.description || ''
                    }
                }));
            } else if (data.results && data.results.length > 0) {
                // Формат прямого API Kodik
                
                // Дополнительная проверка структуры данных
                newItems = data.results.filter(item => !!item).map(item => {
                    // Проверяем наличие material_data
                    if (!item.material_data) {
                        // Создаем базовый объект, если material_data отсутствует
                        return {
                            id: item.id || item.link || '1',
                            material_data: {
                                title: item.title || "Без названия",
                                poster_url: '',
                                genres: ['Без жанра'],
                                shikimori_rating: 0,
                                anime_status: 'released',
                                description: ''
                            }
                        };
                    }
                    return item;
                });
            } else {
                // Если нет результатов, значит больше данных нет
                hasMoreData = false;
                console.log("⚠️ Результаты отсутствуют или имеют неожиданный формат:", data);
            }
            
            console.log(`✅ Загружено ${newItems.length} тайтлов`);
            
            // Если ничего не загрузилось, значит больше данных нет
            if (newItems.length === 0) {
                hasMoreData = false;
                removeLoadingMore();
                isLoading = false;
                updateProgressIndicator(animeData.length, MAX_ITEMS, "Больше аниме не найдено");
                return;
            }
            
            // Если API вернул признак окончания данных, останавливаем загрузку
            if (data.next_page === null || data.next_page === false) {
                console.log("📢 API сообщил, что следующей страницы нет. Загрузка остановлена.");
                hasMoreData = false;
            }
            
            // Если API вернул общее количество элементов, используем его для более точного отображения
            if (data.total !== undefined && data.total > 0) {
                API_TOTAL_ITEMS = data.total;
                console.log(`📊 API сообщил, что всего доступно ${API_TOTAL_ITEMS} элементов`);
                
                // Обновляем максимальное количество элементов на основе данных API
                if (API_TOTAL_ITEMS < MAX_ITEMS) {
                    MAX_ITEMS = API_TOTAL_ITEMS;
                    console.log(`📊 Обновлено максимальное количество элементов: ${MAX_ITEMS}`);
                }
                
                // Рассчитываем максимальное количество страниц на основе общего количества элементов
                const pageSize = 50; // Элементов на страницу
                const calculatedMaxPages = Math.ceil(API_TOTAL_ITEMS / pageSize);
                
                // Обновляем максимальное количество страниц
                if (calculatedMaxPages < MAX_PAGES) {
                    MAX_PAGES = calculatedMaxPages;
                    console.log(`📊 Обновлено максимальное количество страниц: ${MAX_PAGES}`);
                }
                
                // Обновляем индикатор прогресса с учетом нового максимума
                updateProgressIndicator(animeData.length, MAX_ITEMS, `Загружено ${animeData.length} из ${MAX_ITEMS} аниме`);
            }
            
            // Создаем Set с уже загруженными названиями аниме для быстрой проверки дубликатов
            const existingIDs = new Set();
            const existingTitles = new Set();
            const existingShikimoriIDs = new Set();
            
            if (append) {
                // Собираем идентификаторы уже загруженных аниме
                animeData.forEach(item => {
                    // Сохраняем ID
                    if (item.id) {
                        existingIDs.add(item.id.toString());
                    }
                    
                    // Сохраняем названия
                    if (item.material_data && item.material_data.title) {
                        // Нормализуем название для лучшего сравнения
                        const normalizedTitle = item.material_data.title
                            .toLowerCase()
                            .trim()
                            .replace(/\s+/g, ' ');  // Заменяем множественные пробелы на один
                        existingTitles.add(normalizedTitle);
                    }
                    
                    // Сохраняем shikimori ID если есть
                    if (item.material_data && item.material_data.shikimori_id) {
                        existingShikimoriIDs.add(item.material_data.shikimori_id.toString());
                    }
                });
                
                console.log(`📊 Обнаружено ${existingIDs.size} существующих ID, ${existingTitles.size} названий и ${existingShikimoriIDs.size} Shikimori ID`);
            }
            
            // Фильтруем новые элементы, чтобы исключить дубликаты
            const uniqueNewItems = newItems.filter(item => {
                // Проверка по ID
                if (item.id && existingIDs.has(item.id.toString())) {
                    return false;
                }
                
                // Проверка по названию
                if (item.material_data && item.material_data.title) {
                    const normalizedTitle = item.material_data.title
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, ' ');
                        
                    if (existingTitles.has(normalizedTitle)) {
                        return false;
                    }
                    
                    // Добавляем название в Set для последующих проверок
                    existingTitles.add(normalizedTitle);
                }
                
                // Проверка по shikimori ID
                if (item.material_data && item.material_data.shikimori_id) {
                    const shikimoriID = item.material_data.shikimori_id.toString();
                    
                    if (existingShikimoriIDs.has(shikimoriID)) {
                        return false;
                    }
                    
                    // Добавляем ID в Set для последующих проверок
                    existingShikimoriIDs.add(shikimoriID);
                }
                
                // Добавляем ID в Set для последующих проверок
                if (item.id) {
                    existingIDs.add(item.id.toString());
                }
                
                // Если прошли все проверки, считаем элемент уникальным
                return true;
            });
            
            console.log(`🔍 Уникальных тайтлов: ${uniqueNewItems.length} из ${newItems.length}`);
            
            // Если после фильтрации не осталось уникальных элементов, возможно мы дошли до повторений
            if (uniqueNewItems.length === 0) {
                console.log("⚠️ Нет новых уникальных тайтлов. Пробуем загрузить следующую страницу...");
                
                // Если это уже 5-я попытка загрузки страницы без уникальных элементов, прекращаем загрузку
                if (window.noUniqueAttemptsCount >= 5) {
                    console.log("⚠️ Достигнуто максимальное количество попыток загрузки без новых элементов. Загрузка остановлена.");
                    hasMoreData = false;
                    removeLoadingMore();
                    isLoading = false;
                    updateProgressIndicator(animeData.length, MAX_ITEMS, "Новые аниме не найдены");
                    return;
                }
                
                // Увеличиваем счетчик попыток без новых элементов
                window.noUniqueAttemptsCount = (window.noUniqueAttemptsCount || 0) + 1;
                
                // Сбрасываем флаг загрузки
                isLoading = false;
                
                // Увеличиваем смещение страницы и пробуем снова
                const newPage = page + 5;
                
                if (newPage <= MAX_PAGES) {
                    console.log(`🔄 Пробуем загрузить страницу ${newPage} со смещением...`);
                    
                    // Сбрасываем токен следующей страницы, чтобы использовать числовое смещение
                    nextPageToken = null;
                    
                    // Устанавливаем новую текущую страницу
                    currentPage = newPage - 1;
                    
                    // Пробуем загрузить страницу с увеличенным смещением
                    setTimeout(() => fetchAnime(newPage, true), 500);
                    return;
                } else {
                    // Если превысили лимит страниц, останавливаем загрузку
                    hasMoreData = false;
                    removeLoadingMore();
                    isLoading = false;
                    updateProgressIndicator(animeData.length, MAX_ITEMS, "Новые аниме не найдены");
                    return;
                }
            } else {
                // Сбрасываем счетчик попыток без новых элементов, если загрузили уникальные элементы
                window.noUniqueAttemptsCount = 0;
            }
            
            // Добавляем новые данные к общему массиву
            if (append) {
                animeData = [...animeData, ...uniqueNewItems];
            } else {
                animeData = uniqueNewItems;
            }
            
            // Проверяем лимит количества элементов после добавления
            if (animeData.length >= MAX_ITEMS) {
                console.log(`📢 Достигнуто максимальное количество элементов (${MAX_ITEMS}). Загрузка остановлена.`);
                hasMoreData = false;
                updateProgressIndicator(animeData.length, MAX_ITEMS, "Максимальное количество аниме достигнуто!");
            } else {
                updateProgressIndicator(animeData.length, MAX_ITEMS, `Страница ${page} загружена`);
            }
            
            // Выполняем фильтрацию с обновленными данными
            filterAnime(append);
            
            // Обновляем текущую страницу
            currentPage = page;
            
            // Сбрасываем флаг загрузки
            isLoading = false;
            
            // Удаляем индикатор загрузки
            removeLoadingMore();
            
            // Добавляем информацию о количестве загруженных аниме
            console.log(`📊 Всего загружено: ${animeData.length} из ${MAX_ITEMS} аниме`);
            
        } catch (error) {
            console.error("⛔ Ошибка при загрузке данных!", error);
            
            if (!append) {
                animeList.innerHTML = `
                    <p style='color:red;'>❌ Ошибка загрузки данных. Пожалуйста, обновите страницу.</p>
                `;
            } else {
                removeLoadingMore();
            }
            
            isLoading = false;
            hasMoreData = false;
            updateProgressIndicator(animeData.length, MAX_ITEMS, "Ошибка загрузки данных!");
        }
    }

    // Показать индикатор загрузки (первая загрузка)
    function showLoading() {
        animeList.innerHTML = `
            <div class="loading-indicator">
                <div class="loader"></div>
                <p>Загружаем аниме...</p>
            </div>
        `;
    }
    
    // Показать индикатор дозагрузки (бесконечный скролл)
    function showLoadingMore() {
        // Проверяем, нет ли уже индикатора загрузки
        if (document.querySelector('.loading-more')) return;
        
        const loadingMore = document.createElement('div');
        loadingMore.className = 'loading-more';
        loadingMore.innerHTML = `
            <div class="loader"></div>
            <p>Загружаем еще...</p>
        `;
        
        // Добавляем стили для индикатора
        const style = document.createElement('style');
        style.textContent = `
            .loading-more {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                width: 100%;
                color: var(--text-light);
            }
            
            .loading-more .loader {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 107, 0, 0.2);
                border-radius: 50%;
                border-top-color: var(--accent-orange);
                animation: spin 1s ease-in-out infinite;
                margin-bottom: 10px;
            }
        `;
        document.head.appendChild(style);
        
        animeList.appendChild(loadingMore);
    }
    
    // 🔄 Обработка бесконечного скролла
    let scrollTimeout = null;
    let endMessageAdded = false;
    
    function handleInfiniteScroll() {
        // Не подгружать новые страницы, если активен поиск
        if (window.lastSearchQuery && window.lastSearchQuery.length >= 3) {
            return;
        }
        // Определяем, когда пользователь достиг конца страницы
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        
        // Проверяем, достигли ли мы уже максимального количества аниме от API
        if (API_TOTAL_ITEMS !== null && animeData.length >= API_TOTAL_ITEMS) {
            // Если достигли максимального количества аниме, больше не загружаем
            if (!endMessageAdded) {
                console.log(`📢 Достигнуто максимальное количество аниме (${API_TOTAL_ITEMS}) по данным API.`);
                hasMoreData = false;
                addEndMessage(`Загружены все доступные аниме (${API_TOTAL_ITEMS}) по данным API!`);
            }
            return;
        }
        
        // Если скролл достиг нижней части страницы (с запасом 200px)
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            // Если не загружаем в данный момент и есть еще данные для загрузки
            if (!isLoading && hasMoreData) {
                // Предотвращаем слишком частые запросы
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                
                scrollTimeout = setTimeout(() => {
                    // Проверяем, не превышен ли лимит страниц
                    if (currentPage >= MAX_PAGES) {
                        console.log(`📢 Достигнуто максимальное количество страниц (${MAX_PAGES}). Загрузка остановлена.`);
                        hasMoreData = false;
                        if (!endMessageAdded) {
                            addEndMessage("Достигнуто максимальное количество страниц!");
                        }
                        return;
                    }
                    
                    // Проверяем, не превышен ли лимит элементов
                    if (animeData.length >= MAX_ITEMS) {
                        console.log(`📢 Достигнуто максимальное количество элементов (${MAX_ITEMS}). Загрузка остановлена.`);
                        hasMoreData = false;
                        if (!endMessageAdded) {
                            addEndMessage("Достигнуто максимальное количество аниме!");
                        }
                        return;
                    }
                    
                    console.log("⏬ Загружаем следующую страницу...");
                    fetchAnime(currentPage + 1, true);
                }, 300); // Задержка в 300 мс для предотвращения множественных запросов
            } else if (!hasMoreData && !endMessageAdded) {
                // Если больше данных нет и сообщение еще не добавлено, добавляем его
                addEndMessage("Вы достигли конца коллекции аниме!");
            }
        }
    }
    
    // Функция для добавления сообщения о конце коллекции
    function addEndMessage(message) {
        // Проверяем, не было ли уже добавлено сообщение
        if (endMessageAdded || document.querySelector('.end-message')) {
            return;
        }
        
        const endMessage = document.createElement('div');
        endMessage.className = 'end-message';
        endMessage.innerHTML = `
            <div class="end-message-content">
                <span class="emoji">🎬</span>
                <p>${message}</p>
                <button class="scroll-to-top">Вернуться наверх</button>
            </div>
        `;
        
        // Добавляем стили для сообщения
        const endMessageStyle = document.createElement('style');
        endMessageStyle.textContent = `
            .end-message {
                width: 100%;
                padding: 20px;
                margin-top: 30px;
                margin-bottom: 50px;
                text-align: center;
            }
            .end-message-content {
                background-color: rgba(26, 26, 26, 0.9);
                border: 2px solid var(--accent-orange);
                border-radius: 10px;
                padding: 20px;
                display: inline-block;
                max-width: 500px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            .end-message .emoji {
                font-size: 2em;
                display: block;
                margin-bottom: 10px;
            }
            .end-message p {
                font-size: 1.1em;
                color: white;
                margin: 10px 0;
            }
            .scroll-to-top {
                background-color: var(--accent-orange);
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                margin-top: 10px;
                cursor: pointer;
                font-weight: bold;
                transition: background-color 0.3s ease;
            }
            .scroll-to-top:hover {
                background-color: #ff8c2a;
            }
        `;
        document.head.appendChild(endMessageStyle);
        
        // Добавляем в конец списка аниме
        animeList.appendChild(endMessage);
        
        // Добавляем обработчик для кнопки "Вернуться наверх"
        document.querySelector('.scroll-to-top').addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Отмечаем, что сообщение уже добавлено
        endMessageAdded = true;
    }
    
    // Обновляем функцию удаления индикатора загрузки, чтобы добавлять сообщение о конце коллекции
    function removeLoadingMore() {
        const loadingMore = document.querySelector('.loading-more');
        if (loadingMore) {
            loadingMore.remove();
        }
        
        // Если больше данных нет и сообщение еще не добавлено, добавляем его
        if (!hasMoreData && !endMessageAdded) {
            addEndMessage("Вы достигли конца коллекции аниме!");
        }
    }

    // 🖼 Создаем карточки и добавляем клик для перехода на страницу аниме
    function renderAnime(data, append = false) {
        // Если не режим добавления, очищаем список
        if (!append) {
            animeList.innerHTML = "";
            endMessageAdded = false; // Сбрасываем флаг сообщения о конце при новой загрузке
        } else {
            // Удаляем индикатор загрузки, если есть
            removeLoadingMore();
            
            // Удаляем сообщение о конце коллекции, если есть (чтобы добавить его в конце)
            const endMessage = document.querySelector('.end-message');
            if (endMessage) {
                endMessage.remove();
                endMessageAdded = false;
            }
        }
        
        // Если нет данных, показываем сообщение
        if (!data || data.length === 0) {
            if (!append) {
                animeList.innerHTML = "<p class='no-results'>Ничего не найдено. Попробуйте изменить параметры поиска.</p>";
                
                // Добавляем стили для сообщения, если их нет
                if (!document.querySelector('#no-results-style')) {
                    const style = document.createElement('style');
                    style.id = 'no-results-style';
                    style.textContent = `
                        .no-results {
                            text-align: center;
                            padding: 30px;
                            background: rgba(26, 26, 26, 0.9);
                            border: 1px solid var(--accent-orange);
                            border-radius: 10px;
                            color: #fff;
                            font-size: 18px;
                            margin: 40px auto;
                            max-width: 500px;
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
            return;
        }
        
        // Чтобы избежать дублирования, создаем Set для проверки уникальности
        const seenAnime = new Set();
        
        // Если это добавление, получаем уже отображенные аниме
        if (append) {
            document.querySelectorAll(".anime-card").forEach(card => {
                if (card.dataset.title) {
                    seenAnime.add(card.dataset.title.toLowerCase().trim());
                }
                
                // Также добавляем ID карточки для дополнительной проверки
                if (card.dataset.id) {
                    seenAnime.add(`id-${card.dataset.id}`);
                }
            });
        }

        // Счетчик добавленных карточек
        let addedCards = 0;
        
        // Дополнительная проверка данных перед рендерингом
        console.log(`🧐 Анализ данных перед рендерингом: ${data.length} элементов`);
        const itemsWithErrors = data.filter(anime => !anime || !anime.material_data).length;
        if (itemsWithErrors > 0) {
            console.log(`⚠️ Обнаружено ${itemsWithErrors} элементов с ошибками или отсутствующими данными`);
        }

        // Проходим по всем элементам массива данных
        data.forEach((anime, index) => {
            // Дополнительная проверка на валидность данных
            if (!anime || !anime.material_data) {
                console.log(`⚠️ Элемент #${index} не содержит необходимых данных:`, anime);
                
                // Пытаемся восстановить данные, если возможно
                if (anime) {
                    console.log(`🔄 Попытка восстановить данные для элемента #${index}`);
                    anime = {
                        id: anime.id || `temp-${index}`,
                        material_data: {
                            title: anime.title || "Аниме без названия",
                            poster_url: anime.poster_url || anime.poster || '',
                            genres: anime.genres || ['Без жанра'],
                            shikimori_rating: anime.rating || 0,
                            anime_status: anime.status || 'released',
                            description: anime.description || ''
                        }
                    };
                } else {
                    return; // Пропускаем полностью невалидные данные
                }
            }
            
            // Проверка на повторения по названию и ID
            const title = anime.material_data?.title || "Неизвестное аниме";
            const id = anime.id || "";
            const animeKey = title.toLowerCase().trim();
            const idKey = `id-${id}`;
            
            if (seenAnime.has(animeKey) || seenAnime.has(idKey)) {
                console.log(`⚠️ Пропускаем дубликат: ${title}`);
                return;  // Если уже был такой тайтл или ID, пропускаем
            }
            
            // Добавляем в Set для последующих проверок
            seenAnime.add(animeKey);
            if (id) seenAnime.add(idKey);

            const card = document.createElement("div");
            card.classList.add("anime-card");
            
            // Добавляем дата-атрибуты для проверки дубликатов
            card.dataset.title = title;
            card.dataset.id = id;
            
            let genresHTML = "";
            
            if (anime.material_data.genres && anime.material_data.genres.length > 0) {
                // Ограничиваем до 2 жанров как на скриншоте
                genresHTML = anime.material_data.genres.slice(0, 2).map(genre => 
                    `<span class="genre-tag">${genre}</span>`
                ).join("");
            }
            
            const posterUrl = anime.material_data.poster_url || anime.poster_url || 
                             anime.material_data.poster || anime.poster || 
                             'https://via.placeholder.com/300x400/1a1a1a/f39c12?text=No+Image';
            
            // Безопасное форматирование рейтинга с проверкой на NaN
            let rating = '?';
            if (anime.material_data.shikimori_rating !== undefined && anime.material_data.shikimori_rating !== null) {
                // Если это число, используем toFixed
                if (typeof anime.material_data.shikimori_rating === 'number') {
                    rating = anime.material_data.shikimori_rating.toFixed(1);
                } else {
                    // Пробуем преобразовать в число
                    const numRating = Number(anime.material_data.shikimori_rating);
                    if (!isNaN(numRating)) {
                        rating = numRating.toFixed(1);
                    }
                }
            }
            
            const status = anime.material_data.anime_status === "ongoing" ? "В процессе" : "Завершено";
            const description = anime.material_data.description || "Описание отсутствует";
            
            card.innerHTML = `
                <div class="anime-poster">
                    <img src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/f39c12?text=No+Image'">
                    <div class="rating rating-top-right">${rating}</div>
                    <div class="status ${anime.material_data.anime_status === "ongoing" ? "ongoing" : "released"}">${status}</div>
                </div>
                <div class="anime-info">
                    <h3 class="anime-title">${title}</h3>
                    <p class="anime-description">${description.substring(0, 60)}${description.length > 60 ? '...' : ''}</p>
                    <div class="genres-container">
                        ${genresHTML}
                    </div>
                    <a href="/anime/${encodeURIComponent(id)}/" class="watch-btn">СМОТРЕТЬ</a>
                </div>
            `;
            
            // Делаем всю карточку кликабельной
            card.addEventListener('click', (e) => {
                // Проверяем, не является ли клик по кнопке "Смотреть"
                if (e.target.classList.contains('watch-btn') || e.target.closest('.watch-btn')) {
                    // Предотвращаем обработку события если клик по кнопке
                    e.stopPropagation();
                    return;
                }
                window.location.href = `/anime/${encodeURIComponent(id)}/`;
            });
            
            animeList.appendChild(card);
            addedCards++;
        });
        
        // Если не добавилось ни одной карточки, возможно данные некорректны
        if (addedCards === 0) {
            if (!append) {
                console.log("⚠️ Не удалось создать ни одной карточки из полученных данных.");
                animeList.innerHTML = "<p class='no-results'>Не удалось отобразить результаты. Попробуйте другой поисковый запрос.</p>";
            } else {
                console.log("⚠️ Не добавлено ни одной новой карточки. Возможно, API возвращает повторяющиеся данные.");
                hasMoreData = false;
                addEndMessage("Похоже, больше уникальных аниме не найдено");
            }
        } else {
            console.log(`📊 Добавлено ${addedCards} карточек аниме`);
        }
    }

    // 🎯 Фильтрация данных по жанрам, рейтингу и статусу:
    function filterAnime(append = false) {
        if (animeData.length === 0) return;
        
        filteredData = [...animeData];
        console.log(`🔍 Фильтрация: начинаем с ${filteredData.length} результатов`);

        // Добавим отладочный вывод, чтобы увидеть доступные жанры
        if (debugMode) {
            // Собираем все уникальные жанры для анализа
            const allGenres = new Set();
            animeData.forEach(anime => {
                if (anime.material_data?.genres && Array.isArray(anime.material_data.genres)) {
                    anime.material_data.genres.forEach(genre => {
                        if (genre) allGenres.add(genre.toLowerCase());
                    });
                }
            });
            console.log('📊 Доступные жанры в данных:', [...allGenres].sort());
        }
        
        // Фильтр по жанру
        if (genreFilter && genreFilter.value !== "all") {
            const selectedGenre = genreFilter.value.toLowerCase();
            console.log(`🔍 Фильтрация по жанру: "${selectedGenre}"`);
            
            // Создаём таблицу соответствия для поиска жанров
            const genreMap = {
                'action': ['экшен', 'экшн', 'боевик', 'action', 'боевые искусства', 'боевик', 'сражения'],
                'comedy': ['комедия', 'юмор', 'comedy', 'комедийный'],
                'drama': ['драма', 'drama', 'драматический'],
                'fantasy': ['фэнтези', 'фэнтэзи', 'fantasy', 'фантастика'],
                'horror': ['ужасы', 'хоррор', 'horror', 'страшилка'],
                // Добавьте другие соответствия при необходимости
            };
            
            filteredData = filteredData.filter(anime => {
                if (!anime.material_data?.genres || !Array.isArray(anime.material_data.genres)) {
                    return false; // У аниме нет жанров
                }
                
                // Если у нас есть карта соответствий для выбранного жанра
                if (genreMap[selectedGenre]) {
                    return anime.material_data.genres.some(genre => {
                        const lowerGenre = genre.toLowerCase();
                        // Проверяем, содержит ли жанр аниме любой из синонимов выбранного жанра
                        return genreMap[selectedGenre].some(synonym => lowerGenre.includes(synonym));
                    });
                } else {
                    // Используем обычный поиск с включением
                    return anime.material_data.genres.some(genre => 
                        genre.toLowerCase().includes(selectedGenre)
                    );
                }
            });
            
            console.log(`🔍 После фильтрации по жанру: ${filteredData.length} результатов`);
        }

        // Фильтр по рейтингу
        if (ratingFilter && ratingFilter.value === "high") {
            filteredData.sort((a, b) => {
                // Безопасное преобразование рейтингов
                const ratingA = typeof a.material_data?.shikimori_rating === 'number'
                    ? a.material_data.shikimori_rating
                    : Number(a.material_data?.shikimori_rating) || 0;
                
                const ratingB = typeof b.material_data?.shikimori_rating === 'number'
                    ? b.material_data.shikimori_rating
                    : Number(b.material_data?.shikimori_rating) || 0;
                
                return ratingB - ratingA;
            });
        } else if (ratingFilter && ratingFilter.value === "low") {
            filteredData.sort((a, b) => {
                // Безопасное преобразование рейтингов
                const ratingA = typeof a.material_data?.shikimori_rating === 'number'
                    ? a.material_data.shikimori_rating
                    : Number(a.material_data?.shikimori_rating) || 0;
                
                const ratingB = typeof b.material_data?.shikimori_rating === 'number'
                    ? b.material_data.shikimori_rating
                    : Number(b.material_data?.shikimori_rating) || 0;
                
                return ratingA - ratingB;
            });
        }

        // Фильтр по статусу
        if (completedCheckbox && ongoingCheckbox) {
            if (completedCheckbox.checked && !ongoingCheckbox.checked) {
                filteredData = filteredData.filter(anime => 
                    anime.material_data?.anime_status === "released"
                );
                console.log(`🔍 После фильтрации по статусу (завершено): ${filteredData.length} результатов`);
            } else if (ongoingCheckbox.checked && !completedCheckbox.checked) {
                filteredData = filteredData.filter(anime => 
                    anime.material_data?.anime_status === "ongoing"
                );
                console.log(`🔍 После фильтрации по статусу (онгоинг): ${filteredData.length} результатов`);
            }
        }

        // Применяем поиск только если НЕ находимся в глобальном поиске
        // (т.е. при поиске через searchFullCatalog мы уже получили результаты от API)
        const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const isGlobalSearch = window.lastSearchQuery && window.lastSearchQuery.length >= 3;
        
        console.log(`🔍 Текущее состояние поиска: запрос="${searchQuery}", глобальный поиск=${isGlobalSearch}`);
        
        if (searchQuery && !isGlobalSearch) {
            console.log(`🔍 Применяем локальную фильтрацию по запросу "${searchQuery}"`);
            filteredData = filteredData.filter(anime => {
                const title = anime.material_data?.title?.toLowerCase() || "";
                const description = anime.material_data?.description?.toLowerCase() || "";
                return title.includes(searchQuery) || description.includes(searchQuery);
            });
            console.log(`🔍 После фильтрации по поисковому запросу: ${filteredData.length} результатов`);
        } else if (isGlobalSearch) {
            console.log(`🔍 Пропускаем локальную фильтрацию, т.к. уже получили результаты от API по запросу "${window.lastSearchQuery}"`);
        }
        
        // Обновляем информацию о количестве найденных аниме
        updateProgressIndicator(
            animeData.length, 
            MAX_ITEMS, 
            `Найдено: ${filteredData.length} из ${animeData.length} аниме`
        );

        // Рендерим отфильтрованные данные
        renderAnime(filteredData, append);
    }

    // Обработчики для поиска
    let searchTimeout;
    
    // Создаем функцию для оценки релевантности
    function calculateRelevance(item, searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        let score = 0;
        
        // Проверка во всех возможных полях
        const title = item.title || '';
        const titleOrig = item.title_orig || '';
        const otherTitle = item.other_title || '';
        const description = item.description || '';
        
        // Проверка в material_data
        const materialData = item.material_data || {};
        const materialTitle = materialData.title || '';
        const animeTitle = materialData.anime_title || '';
        const titleEn = materialData.title_en || '';
        const otherTitles = materialData.other_titles || [];
        const otherTitlesEn = materialData.other_titles_en || [];
        const otherTitlesJp = materialData.other_titles_jp || [];
        const materialDescription = materialData.description || '';
        const animeDescription = materialData.anime_description || '';
        
        // DEBUG: Выводим все возможные названия для анализа
        console.log(`🔍 Анализ аниме "${title || materialTitle}", поиск "${searchLower}"`);
        console.log(`   Заголовки: "${title}", "${titleOrig}", "${otherTitle}", "${materialTitle}", "${animeTitle}", "${titleEn}"`);
        
        // Расширенная проверка на точное совпадение в любом из названий
        if (title.toLowerCase() === searchLower || 
            titleOrig.toLowerCase() === searchLower || 
            otherTitle.toLowerCase() === searchLower ||
            materialTitle.toLowerCase() === searchLower ||
            animeTitle.toLowerCase() === searchLower ||
            titleEn.toLowerCase() === searchLower) {
            console.log(`✅ ТОЧНОЕ совпадение для "${title || materialTitle}"`);
            score += 1000; // Увеличиваем вес для полного совпадения
        }
        
        // Проверка содержит ли строка поиска в названиях
        if (title.toLowerCase().includes(searchLower)) {
            console.log(`✅ Найдено в title: "${title}"`);
            score += 500;
        }
        if (titleOrig.toLowerCase().includes(searchLower)) {
            console.log(`✅ Найдено в titleOrig: "${titleOrig}"`);
            score += 400;
        }
        if (otherTitle.toLowerCase().includes(searchLower)) {
            console.log(`✅ Найдено в otherTitle: "${otherTitle}"`);
            score += 300;
        }
        
        // Проверка в material_data
        if (materialTitle.toLowerCase().includes(searchLower)) {
            console.log(`✅ Найдено в materialTitle: "${materialTitle}"`);
            score += 450;
        }
        if (animeTitle.toLowerCase().includes(searchLower)) {
            console.log(`✅ Найдено в animeTitle: "${animeTitle}"`);
            score += 350;
        }
        if (titleEn.toLowerCase().includes(searchLower)) {
            console.log(`✅ Найдено в titleEn: "${titleEn}"`);
            score += 250;
        }
        
        // Проверка в массивах других названий
        let foundInOtherTitles = false;
        for (const t of otherTitles) {
            if (t && t.toLowerCase().includes(searchLower)) {
                console.log(`✅ Найдено в otherTitles: "${t}"`);
                score += 200;
                foundInOtherTitles = true;
                break;
            }
        }
        
        let foundInOtherTitlesEn = false;
        for (const t of otherTitlesEn) {
            if (t && t.toLowerCase().includes(searchLower)) {
                console.log(`✅ Найдено в otherTitlesEn: "${t}"`);
                score += 150;
                foundInOtherTitlesEn = true;
                break;
            }
        }
        
        let foundInOtherTitlesJp = false;
        for (const t of otherTitlesJp) {
            if (t && t.toLowerCase().includes(searchLower)) {
                console.log(`✅ Найдено в otherTitlesJp: "${t}"`);
                score += 100;
                foundInOtherTitlesJp = true;
                break;
            }
        }
        
        // Проверка по описанию с меньшим весом
        if (description.toLowerCase().includes(searchLower)) {
            console.log(`✅ Найдено в description`);
            score += 50;
        }
        
        if (materialDescription.toLowerCase().includes(searchLower)) {
            console.log(`✅ Найдено в materialDescription`);
            score += 50;
        }
        
        if (animeDescription.toLowerCase().includes(searchLower)) {
            console.log(`✅ Найдено в animeDescription`);
            score += 50;
        }
        
        // Проверка совпадений с жанрами
        const genres = materialData.genres || [];
        const animeGenres = materialData.anime_genres || [];
        
        const allGenres = [...genres, ...animeGenres];
        
        for (const genre of allGenres) {
            if (genre && genre.toLowerCase().includes(searchLower)) {
                console.log(`✅ Найдено в жанрах: "${genre}"`);
                score += 80;
                break;
            }
        }
        
        // Если в основном запросе нет совпадений, проверяем слова по отдельности
        if (score === 0 && searchLower.includes(' ')) {
            console.log(`🔍 Разбиваем поисковый запрос на слова: "${searchLower}"`);
            const words = searchLower.split(' ').filter(w => w.length > 2);
            
            for (const word of words) {
                console.log(`   Проверяем слово: "${word}"`);
                
                if (title.toLowerCase().includes(word)) {
                    console.log(`✅ Слово "${word}" найдено в title`);
                    score += 30;
                }
                if (titleOrig.toLowerCase().includes(word)) {
                    console.log(`✅ Слово "${word}" найдено в titleOrig`);
                    score += 20;
                }
                if (otherTitle.toLowerCase().includes(word)) {
                    console.log(`✅ Слово "${word}" найдено в otherTitle`);
                    score += 20;
                }
                if (materialTitle.toLowerCase().includes(word)) {
                    console.log(`✅ Слово "${word}" найдено в materialTitle`);
                    score += 30;
                }
                if (animeTitle.toLowerCase().includes(word)) {
                    console.log(`✅ Слово "${word}" найдено в animeTitle`);
                    score += 20;
                }
                if (description.toLowerCase().includes(word) || 
                    materialDescription.toLowerCase().includes(word) || 
                    animeDescription.toLowerCase().includes(word)) {
                    console.log(`✅ Слово "${word}" найдено в описании`);
                    score += 10;
                }
            }
        }
        
        // Сравнение на уровне символов (для коротких запросов)
        if (score === 0 && searchLower.length <= 5) {
            // Используем расстояние Левенштейна для нечеткого сравнения
            function levenshteinDistance(a, b) {
                const matrix = [];
                
                // Инициализация матрицы
                for (let i = 0; i <= b.length; i++) {
                    matrix[i] = [i];
                }
                
                for (let j = 0; j <= a.length; j++) {
                    matrix[0][j] = j;
                }
                
                // Заполнение матрицы
                for (let i = 1; i <= b.length; i++) {
                    for (let j = 1; j <= a.length; j++) {
                        if (b.charAt(i-1) === a.charAt(j-1)) {
                            matrix[i][j] = matrix[i-1][j-1];
                        } else {
                            matrix[i][j] = Math.min(
                                matrix[i-1][j-1] + 1, // замена
                                matrix[i][j-1] + 1,   // вставка
                                matrix[i-1][j] + 1    // удаление
                            );
                        }
                    }
                }
                
                return matrix[b.length][a.length];
            }
            
            const allTitles = [
                title, titleOrig, otherTitle, materialTitle, 
                animeTitle, titleEn, ...otherTitles, ...otherTitlesEn, ...otherTitlesJp
            ].filter(t => t && t.length > 0);
            
            for (const t of allTitles) {
                // Разбиваем название на слова и проверяем каждое слово
                const titleWords = t.toLowerCase().split(/\s+|[,.;\-_()[\]{}]/);
                
                for (const word of titleWords) {
                    if (word.length >= 3) {
                        const distance = levenshteinDistance(word, searchLower);
                        // Если расстояние меньше половины длины слова, считаем это близким совпадением
                        if (distance <= Math.min(2, Math.floor(searchLower.length / 2))) {
                            console.log(`✅ Близкое совпадение: "${word}" ~ "${searchLower}" (расстояние: ${distance})`);
                            score += Math.max(10, 30 - distance * 10); // Больше очков за меньшее расстояние
                        }
                    }
                }
            }
        }
        
        console.log(`🏆 Итоговый рейтинг для "${title || materialTitle}": ${score}`);
        return score;
    }

    // Функция поиска аниме по всему каталогу
    async function searchFullCatalog(query) {
        if (!query || query.trim() === '') {
            console.log('🔍 Пустой поисковый запрос. Поиск не выполняется.');
            return;
        }
        
        console.log(`🔍 Поиск по всему каталогу: "${query}"`);
        
        // Показываем индикатор загрузки
        showLoading();
        
        // Обновляем информацию в интерфейсе
        updateProgressIndicator(0, MAX_ITEMS, `Поиск: "${query}"...`);
        
        try {
            // Формируем URL для поиска
            const searchUrl = getApiUrl(1, null, query);
            console.log(`📡 URL запроса для поиска: ${searchUrl}`);
            
            // Выполняем запрос к API
            let data;
            try {
                const response = await fetch(searchUrl);
                if (!response.ok) throw new Error(`Ошибка запроса поиска: ${response.status}`);
                data = await response.json();
            } catch (fetchError) {
                console.log(`⚠️ Ошибка при использовании fetch для поиска: ${fetchError.message}`);
                console.log(`🔄 Пробуем альтернативный метод загрузки для поиска...`);
                
                try {
                    // Если fetch не сработал, пробуем метод JSONP
                    data = await fetchAnimeWithJSONP(1, false);
                } catch (jsonpError) {
                    console.log(`⚠️ Не удалось загрузить данные поиска через JSONP: ${jsonpError.message}`);
                    throw new Error('Не удалось загрузить данные ни через fetch, ни через JSONP');
                }
            }
            
            // Диагностический вывод полного ответа API
            console.log("🔍 Полный ответ API для поиска:", data);
            
            // Проверяем структуру ответа и наличие результатов
            if (!data) {
                console.log("⚠️ API вернул пустой ответ");
                animeList.innerHTML = "<p class='no-results'>Ошибка при получении результатов поиска. Пожалуйста, попробуйте позже.</p>";
                updateProgressIndicator(0, MAX_ITEMS, `Поиск: "${query}" - ошибка API`);
                return;
            }
            
            // Получаем результаты
            let allResults = data.results || [];
            
            // Проверяем, есть ли результаты, вне зависимости от поля success
            if (!allResults || allResults.length === 0) {
                console.log("⚠️ Поиск не вернул результатов");
                animeList.innerHTML = "<p class='no-results'>По вашему запросу ничего не найдено. Попробуйте изменить поисковый запрос.</p>";
                
                // Обновляем информацию в интерфейсе
                updateProgressIndicator(0, MAX_ITEMS, `Поиск: "${query}" - ничего не найдено`);
                return;
            }
            
            // Для популярных аниме проверяем дополнительные страницы
            const isPopularAnime = query.toLowerCase() === "наруто" || query.toLowerCase() === "naruto" || 
                                query.toLowerCase() === "блич" || query.toLowerCase() === "ван пис" || 
                                query.toLowerCase() === "атака титанов";
            
            // Если это популярное аниме и есть следующая страница, загрузим еще результаты
            if (isPopularAnime && data.next_page) {
                console.log(`🔍 Поиск популярного аниме "${query}", пробуем загрузить больше страниц...`);
                
                try {
                    // Загружаем вторую страницу
                    const page2Url = data.next_page;
                    console.log(`📡 URL запроса для второй страницы: ${page2Url}`);
                    
                    const response2 = await fetch(page2Url);
                    if (response2.ok) {
                        const data2 = await response2.json();
                        if (data2.results && data2.results.length > 0) {
                            console.log(`✅ Загружена вторая страница результатов, добавляем ${data2.results.length} элементов`);
                            allResults = [...allResults, ...data2.results];
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ Ошибка при загрузке второй страницы: ${error.message}`);
                }
            }
            
            // Применяем дополнительную фильтрацию результатов по поисковому запросу
            console.log(`🔍 Применяем дополнительную фильтрацию по запросу "${query}" к ${allResults.length} результатам...`);
            
            // Фильтруем и сортируем результаты по релевантности
            let filteredResults = allResults
                .map(item => ({
                    item,
                    relevance: calculateRelevance(item, query)
                }))
                .filter(scored => scored.relevance > 0)  // Оставляем только релевантные результаты
                .sort((a, b) => b.relevance - a.relevance)  // Сортируем по убыванию релевантности
                .map(scored => scored.item);  // Извлекаем только сами элементы
            
            // --- ДОБАВЛЕНО: фильтрация только по точному совпадению названия ---
            const exactMatches = filteredResults.filter(item => {
                const title = (item.material_data?.title || item.title || '').toLowerCase().trim();
                return title === query.toLowerCase().trim();
            });
            if (exactMatches.length > 0) {
                filteredResults = exactMatches;
            } else {
                filteredResults = [];
            }
            // --- КОНЕЦ ДОБАВЛЕНИЯ ---
            
            console.log(`🔍 После фильтрации по релевантности осталось ${filteredResults.length} результатов`);
            
            // Если после фильтрации ничего не осталось или меньше 5 результатов,
            // используем специальный запрос
            if (filteredResults.length < 5) {
                console.log("⚠️ После фильтрации осталось мало результатов. Пробуем специальный запрос...");
                
                // Формируем URL для специального запроса
                const specialSearchUrl = `https://kodikapi.com/search?token=${API_KEY}&title=${encodeURIComponent(query)}&with_material_data=true&full_match=false&limit=10`;
                
                try {
                    console.log(`📡 URL специального запроса: ${specialSearchUrl}`);
                    const specialResponse = await fetch(specialSearchUrl);
                    
                    if (specialResponse.ok) {
                        const specialData = await specialResponse.json();
                        
                        if (specialData.results && specialData.results.length > 0) {
                            console.log(`✅ Специальный запрос вернул ${specialData.results.length} результатов`);
                            
                            // Оцениваем релевантность результатов специального запроса
                            const specialFilteredResults = specialData.results
                                .map(item => ({
                                    item,
                                    relevance: calculateRelevance(item, query)
                                }))
                                .filter(scored => scored.relevance > 0)
                                .sort((a, b) => b.relevance - a.relevance)
                                .map(scored => scored.item);
                            
                            console.log(`🔍 После фильтрации специального запроса осталось ${specialFilteredResults.length} результатов`);
                            
                            if (specialFilteredResults.length > 0) {
                                // Объединяем результаты
                                const combinedResults = [...specialFilteredResults];
                                
                                // Добавляем уникальные результаты из предыдущего запроса
                                if (filteredResults.length > 0) {
                                    const existingIds = new Set(combinedResults.map(item => item.id));
                                    
                                    filteredResults.forEach(item => {
                                        if (!existingIds.has(item.id)) {
                                            combinedResults.push(item);
                                        }
                                    });
                                }
                                
                                filteredResults = combinedResults;
                                console.log(`🔍 После объединения результатов имеем ${filteredResults.length} аниме`);
                            }
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ Ошибка при выполнении специального запроса: ${error.message}`);
                }
            }
            
            // Если после всех попыток не осталось результатов
            if (filteredResults.length === 0) {
                console.log("⚠️ После всех попыток фильтрации не осталось результатов. Показываем исходные результаты.");
                filteredResults = allResults;
            }
            
            // Проверяем, что в результатах действительно есть данные
            const validResults = filteredResults.filter(item => item && (item.material_data || item.title));
            if (validResults.length === 0 && filteredResults.length > 0) {
                console.log("⚠️ API вернул результаты, но они не содержат необходимых данных:", filteredResults);
                animeList.innerHTML = "<p class='no-results'>Получены некорректные данные от API. Пожалуйста, попробуйте позже.</p>";
                updateProgressIndicator(0, MAX_ITEMS, `Поиск: "${query}" - некорректные данные`);
                return;
            }
            
            console.log(`✅ Найдено ${validResults.length} валидных результатов по запросу "${query}"`);
            
            // Выводим первый результат для диагностики
            if (validResults.length > 0) {
                console.log("🔍 Пример первого результата:", JSON.stringify(validResults[0], null, 2));
            }
            
            // Выводим все названия для анализа
            console.log("📊 Найденные аниме:");
            validResults.forEach((item, index) => {
                if (index < 10) { // Выводим только первые 10 для краткости
                    const title = item.title || (item.material_data?.title) || "Без названия";
                    console.log(`   ${index+1}. ${title}`);
                }
            });
            
            // Обрабатываем результаты
            const searchResults = validResults.map(item => {
                // Логируем каждый элемент для диагностики
                console.log(`🔄 Обработка элемента:`, 
                    item.title || (item.material_data?.title) || "Без названия", 
                    "material_data:", !!item.material_data
                );
                
                if (!item.material_data) {
                    // Создаем базовый объект, если material_data отсутствует
                    return {
                        id: item.id || item.link || '1',
                        material_data: {
                            title: item.title || "Без названия",
                            poster_url: item.poster_url || item.poster || '',
                            genres: item.genres || ['Без жанра'],
                            shikimori_rating: item.rating,
                            anime_status: item.status || 'released',
                            description: item.description || ''
                        }
                    };
                }
                return item;
            });
            
            // Проверяем, что результаты после обработки содержат нужные данные
            console.log(`✅ После обработки: ${searchResults.length} результатов`);
            const hasValidData = searchResults.every(item => 
                item && item.material_data && item.material_data.title
            );
            
            if (!hasValidData) {
                console.log("⚠️ После обработки остались некорректные данные!");
                console.log("🔍 Пример данных после обработки:", searchResults.slice(0, 3));
                
                // Повторная обработка для исправления проблем со структурой
                const fixedResults = searchResults.map(item => {
                    if (!item || !item.material_data) {
                        return {
                            id: item?.id || '1',
                            material_data: {
                                title: item?.title || "Неизвестный аниме",
                                poster_url: item?.poster_url || '',
                                genres: ['Неизвестный жанр'],
                                shikimori_rating: 0,
                                anime_status: 'released',
                                description: "Описание отсутствует"
                            }
                        };
                    }
                    return item;
                });
                
                // Обновляем данные исправленными результатами
                animeData = fixedResults;
            } else {
                // Обновляем данные
                animeData = searchResults;
            }
            
            // Отображаем результаты
            console.log(`🔍 Передаем на отображение ${animeData.length} результатов напрямую`);
            
            // Прямое отображение результатов без фильтрации
            renderAnime(animeData, false);
            
            // Обновляем информацию в интерфейсе
            updateProgressIndicator(
                searchResults.length, 
                searchResults.length, 
                `Найдено: ${searchResults.length} аниме по запросу "${query}"`
            );
            
            // Обновляем состояние пагинации
            if (data.next_page) {
                nextPageToken = data.next_page;
                hasMoreData = true;
                currentPage = 1;
            } else {
                hasMoreData = false;
            }
            
            // Если есть информация о количестве элементов
            if (data.total) {
                updateProgressIndicator(
                    searchResults.length, 
                    data.total, 
                    `Найдено: ${searchResults.length} из ${data.total} аниме по запросу "${query}"`
                );
            }
            
        } catch (error) {
            console.error("⛔ Ошибка при поиске:", error);
            animeList.innerHTML = "<p class='no-results'>Произошла ошибка при поиске. Пожалуйста, попробуйте позже.</p>";
            
            // Обновляем информацию в интерфейсе
            updateProgressIndicator(0, MAX_ITEMS, "Ошибка при поиске");
        }
    }
    
    // Функция фильтрации данных по поисковому запросу
    function performSearch() {
        // Проверяем наличие поля поиска
        if (!searchInput) {
            console.log('⚠️ Невозможно выполнить поиск: элемент поиска не найден');
            return;
        }
        
        const searchQuery = searchInput.value.trim().toLowerCase();
        
        // Добавляем класс при активном поиске
        if (searchQuery) {
            document.body.classList.add('search-active');
        } else {
            document.body.classList.remove('search-active');
        }
        
        // Если запрос пустой, и данные были загружены ранее, просто сбрасываем фильтры
        if (!searchQuery && animeData.length > 0) {
            filterAnime(false);
            return;
        }
        
        // Если запрос очень короткий (меньше 3 символов) и есть загруженные данные,
        // фильтруем только по загруженным данным
        if (searchQuery.length < 3 && animeData.length > 0) {
            console.log(`🔍 Короткий поиск по загруженным данным: "${searchQuery}"`);
            filterAnime(false);
            return;
        }
        
        // Для запросов длиной 3 символа и более выполняем поиск по всему каталогу через API
        searchFullCatalog(searchQuery);
    }
    
    // Добавляем стили для состояния поиска
    const searchStyles = document.createElement('style');
    searchStyles.textContent = `
        .search-active .search-container {
            border-color: var(--accent-orange);
            box-shadow: 0 0 10px rgba(243, 156, 18, 0.5);
        }
        #search {
            transition: all 0.3s ease;
        }
        .search-active #search {
            background-color: rgba(255, 255, 255, 0.1);
        }
        .search-active #search-btn {
            background-color: var(--accent-orange);
        }
        .search-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--accent-orange);
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            z-index: 100;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: none;
        }
        .search-active .search-indicator {
            display: block;
        }
    `;
    document.head.appendChild(searchStyles);
    
    // Создаем индикатор поиска, если есть контейнер для поиска
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        const searchIndicator = document.createElement('div');
        searchIndicator.className = 'search-indicator';
        searchIndicator.textContent = 'Режим поиска';
        searchContainer.appendChild(searchIndicator);
    }
    
    // Проверка наличия и добавление обработчиков для элементов фильтрации и поиска
    if (searchInput) {
        searchInput.addEventListener("keyup", function(e) {
            // Отменяем предыдущий таймаут при каждом нажатии клавиши
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Если поле поиска пусто, и мы до этого выполняли поиск, загружаем все аниме снова
            if (this.value.trim() === "" && window.lastSearchQuery) {
                console.log("🔄 Поле поиска очищено, возвращаемся к общему списку аниме");
                document.body.classList.remove('search-active');
                window.lastSearchQuery = null;
                resetPaginationAndData();
                fetchAnime(1, false);
                return;
            }
            
            // Проверяем клавишу Enter
            if (e.key === "Enter") {
                e.preventDefault();
                // Сохраняем поисковый запрос
                const query = this.value.trim();
                if (query.length > 0) {
                    window.lastSearchQuery = query;
                    performSearch();
                }
                return;
            }
            
            // Устанавливаем задержку для автоматического поиска при вводе
            searchTimeout = setTimeout(() => {
                const query = this.value.trim();
                if (query.length >= 3) {
                    // Сохраняем поисковый запрос только если длина >= 3
                    window.lastSearchQuery = query;
                    performSearch();
                } else if (query.length > 0 && query.length < 3) {
                    // Для коротких запросов просто фильтруем текущие данные
                    filterAnime(false);
                }
            }, 500); // Задержка в 500 мс перед автоматическим поиском
        });
    } else {
        console.log("⚠️ Элемент поиска не найден на странице");
    }
    
    if (searchBtn) {
        searchBtn.addEventListener("click", function() {
            const query = searchInput?.value.trim() || "";
            if (query.length > 0) {
                // Сохраняем поисковый запрос
                window.lastSearchQuery = query;
                performSearch();
            } else {
                // Если запрос пустой и были ранее результаты поиска, сбрасываем
                if (window.lastSearchQuery) {
                    document.body.classList.remove('search-active');
                    window.lastSearchQuery = null;
                    resetPaginationAndData();
                    fetchAnime(1, false);
                }
            }
        });
    } else {
        console.log("⚠️ Кнопка поиска не найдена на странице");
    }
    
    // Функция для сброса пагинации и данных
    function resetPaginationAndData() {
        currentPage = 1;
        hasMoreData = true;
        animeData = []; // Очищаем все данные
        filteredData = [];
        endMessageAdded = false;
        nextPageToken = null; // Сбрасываем токен следующей страницы
        
        // Удаляем сообщение о конце коллекции, если есть
        const endMessage = document.querySelector('.end-message');
        if (endMessage) {
            endMessage.remove();
        }
        
        // Обновляем индикатор прогресса
        updateProgressIndicator(0, MAX_ITEMS, "Обновление данных...");
        
        // Сбрасываем счетчики попыток
        window.apiAttemptCount = 0;
        window.noUniqueAttemptsCount = 0;
        
        console.log("🔄 Сброс пагинации и данных");
    }

    // Загружаем список аниме (первая страница)
    fetchAnime(1, false);

    // Добавляем обработчики для фильтров
    if (genreFilter) {
        genreFilter.addEventListener("change", function() {
            // При изменении фильтров сбрасываем пагинацию и фильтруем существующие данные
            currentPage = 1;
            hasMoreData = true;
            endMessageAdded = false;
            
            // Удаляем сообщение о конце коллекции, если есть
            const endMessage = document.querySelector('.end-message');
            if (endMessage) {
                endMessage.remove();
            }
            
            // Применяем фильтры к уже загруженным данным
            filterAnime(false);
        });
    }
    
    if (ratingFilter) {
        ratingFilter.addEventListener("change", function() {
            // При изменении фильтров просто перефильтровываем данные
            filterAnime(false);
        });
    }
    
    if (completedCheckbox) {
        completedCheckbox.addEventListener("change", function() {
            // При изменении фильтров просто перефильтровываем данные
            filterAnime(false);
        });
    }
    
    if (ongoingCheckbox) {
        ongoingCheckbox.addEventListener("change", function() {
            // При изменении фильтров просто перефильтровываем данные
            filterAnime(false);
        });
    }

    // Добавляем обработчик скролла для бесконечной загрузки
    window.addEventListener('scroll', handleInfiniteScroll);

    // Показать начальный набор аниме (если API недоступен)
    function createTestAnimeCards() {
        // Очищаем контейнер
        animeList.innerHTML = "";
        
        // Создаем тестовые данные с большим количеством аниме
        const testData = [
            {
                title: "Attack on Titan",
                description: "В мире, где человечество скрывается за огромными стенами от гигантских титанов, юноша клянется отомстить за свою семью и вернуть себе свободу.",
                genres: ["Сёнен", "Драма", "Экшен", "Фэнтези"],
                rating: 9.1,
                status: "released",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=Attack+on+Titan"
            },
            {
                title: "Demon Slayer",
                description: "История молодого парня, который хочет отомстить за свою семью и излечить сестру от демонической болезни.",
                genres: ["Сёнен", "Экшен", "Сверхъестественное", "Исторический"],
                rating: 9.7,
                status: "released",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=Demon+Slayer"
            },
            {
                title: "My Hero Academia",
                description: "В мире, где большинство людей обладают суперспособностями, мальчик без них мечтает стать величайшим героем.",
                genres: ["Сёнен", "Комедия", "Экшен", "Супергерои"],
                rating: 8.9,
                status: "ongoing",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=My+Hero+Academia"
            },
            {
                title: "Fullmetal Alchemist: Brotherhood",
                description: "Два брата ищут философский камень, чтобы вернуть свои тела после неудачной попытки воскресить мать.",
                genres: ["Сёнен", "Фэнтези", "Экшен", "Драма"],
                rating: 9.8,
                status: "released",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=Fullmetal+Alchemist"
            },
            {
                title: "One Punch Man",
                description: "История о супергерое, который может победить любого врага одним ударом и ищет достойного противника.",
                genres: ["Комедия", "Экшен", "Супергерои", "Пародия"],
                rating: 8.7,
                status: "ongoing",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=One+Punch+Man"
            },
            {
                title: "Death Note",
                description: "Студент находит сверхъестественную тетрадь, которая убивает людей, чьи имена в ней записаны.",
                genres: ["Сэйнэн", "Психологический", "Триллер", "Детектив"],
                rating: 9.4,
                status: "released",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=Death+Note"
            },
            {
                title: "Naruto",
                description: "Молодой ниндзя с демоном внутри стремится стать лидером своей деревни и получить признание.",
                genres: ["Сёнен", "Экшен", "Комедия", "Боевые искусства"],
                rating: 8.5,
                status: "released",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=Naruto"
            },
            {
                title: "Jujutsu Kaisen",
                description: "Подросток вступает в тайную организацию заклинателей, чтобы бороться со злыми духами и проклятиями.",
                genres: ["Сёнен", "Сверхъестественное", "Экшен", "Школа"],
                rating: 9.2,
                status: "ongoing",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=Jujutsu+Kaisen"
            },
            {
                title: "Hunter x Hunter",
                description: "Мальчик ищет своего отца-охотника и проходит через опасные испытания, чтобы стать охотником.",
                genres: ["Сёнен", "Приключения", "Экшен", "Фэнтези"],
                rating: 9.5,
                status: "ongoing",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=Hunter+x+Hunter"
            },
            {
                title: "Steins;Gate",
                description: "Студенты изобретают способ отправлять сообщения в прошлое и попадают в опасную ситуацию.",
                genres: ["Научная фантастика", "Триллер", "Психологический", "Драма"],
                rating: 9.6,
                status: "released",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=Steins;Gate"
            },
            {
                title: "Re:Zero",
                description: "Парень попадает в фэнтезийный мир, где получает способность возрождаться после смерти.",
                genres: ["Исэкай", "Драма", "Психологический", "Фэнтези"],
                rating: 8.8,
                status: "ongoing",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=Re:Zero"
            },
            {
                title: "Spy x Family",
                description: "Шпион, телепат и убийца создают фальшивую семью для выполнения миссии, не подозревая о тайнах друг друга.",
                genres: ["Комедия", "Экшен", "Шпионский", "Семейный"],
                rating: 9.0,
                status: "ongoing",
                poster: "https://via.placeholder.com/300x400/1a1a1a/f39c12?text=Spy+x+Family"
            }
        ];
        
        // Преобразуем тестовые данные в подходящий формат и добавляем в массив анимe
        animeData = testData.map((item, index) => ({
            id: `test-${index + 1}`,
            material_data: {
                title: item.title,
                poster_url: item.poster,
                genres: item.genres,
                shikimori_rating: item.rating,
                anime_status: item.status,
                description: item.description
            }
        }));
        
        // Отображаем данные
        filterAnime(false);
        
        // Обновляем индикатор прогресса
        updateProgressIndicator(animeData.length, animeData.length, "Показаны тестовые данные, поскольку API недоступен");
        
        console.log("📊 Создано тестовых элементов:", animeData.length);
    }

    // Функция для добавления общих стилей карточек один раз
    function addAnimeCardStyles() {
        const cardStyles = document.createElement('style');
        cardStyles.textContent = `
            .anime-card {
                width: 280px;
                border-radius: 10px;
                overflow: hidden;
                background: #1a1a1a;
                box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                position: relative;
                margin-bottom: 30px;
                display: flex;
                flex-direction: column;
                cursor: pointer;
            }
            .anime-poster {
                position: relative;
                height: 380px;
                overflow: hidden;
            }
            .rating-top-right {
                position: absolute;
                top: 2px;
                right: 10px;
                z-index: 20;
                background: var(--accent-orange);
                color: white;
                padding: 5px 14px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
            .anime-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 25px rgba(0, 0, 0, 0.5);
            }
            .anime-poster img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s ease;
            }
            .anime-card:hover .anime-poster img {
                transform: scale(1.05);
            }
            .status {
                position: absolute;
                top: 10px;
                left: 10px;
                padding: 3px 8px;
                border-radius: 5px;
                font-size: 12px;
                font-weight: bold;
                z-index: 10;
            }
            .status.ongoing {
                background: #4CAF50;
                color: white;
            }
            .status.released {
                background: #2196F3;
                color: white;
            }
            .anime-info {
                padding: 15px;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
            }
            .anime-title {
                color: white;
                font-size: 16px;
                margin: 0 0 10px 0;
                line-height: 1.3;
                max-height: 42px;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            .anime-description {
                color: #aaa;
                font-size: 14px;
                margin: 0 0 15px 0;
                line-height: 1.4;
                max-height: 40px;
                overflow: hidden;
            }
            .genres-container {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-bottom: 15px;
            }
            .genre-tag {
                background: rgba(255, 255, 255, 0.1);
                color: #aaa;
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 12px;
            }
            .watch-btn {
                display: block;
                width: 90%;
                margin: 20px auto 10px auto;
                background: linear-gradient(90deg, #ff9900 0%, #ff7b00 100%);
                color: #fff;
                font-size: 1.3rem;
                font-weight: bold;
                border: none;
                border-radius: 25px;
                padding: 16px 0;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(255, 140, 0, 0.2);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                transition: background 0.2s, transform 0.1s;
            }
            .watch-btn:hover {
                background: linear-gradient(90deg, #ff7b00 0%, #ff9900 100%);
                transform: translateY(-2px) scale(1.03);
            }
        `;
        document.head.appendChild(cardStyles);
    }
});
