document.addEventListener("DOMContentLoaded", () => {
    console.log("Страница загружена!");

    // Основные элементы DOM
    const animeList = document.getElementById("anime-list");
    const genreFilter = document.getElementById("genre");
    const ratingFilter = document.getElementById("rating");
    const completedCheckbox = document.getElementById("completed");
    const ongoingCheckbox = document.getElementById("ongoing");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const statusText = document.querySelector('.status-text');
    const progressFilled = document.querySelector('.progress-filled');

    // Проверка наличия контейнера для аниме
    if (!animeList) {
        console.error("Контейнер для аниме не найден на странице");
        return;
    }

    // Состояние приложения
    const state = {
        animeData: [],       // Все загруженные данные
        filteredData: [],    // Отфильтрованные данные
        currentPage: 1,      // Текущая страница
        isLoading: false,    // Флаг загрузки
        hasMoreData: true,   // Есть ли еще данные для загрузки
        searchQuery: "",     // Текущий поисковый запрос
        existingIds: new Set(),  // Множество для отслеживания уже загруженных ID
        existingTitles: new Set(), // Множество для отслеживания уже загруженных названий
        nextPageToken: null,  // Сохраненный токен следующей страницы
        lastCheckedIds: new Set() // Кэш ID последней проверенной страницы
    };

    // Конфигурация
    const config = {
        API_KEY: "447d179e875efe44217f20d1ee2146be",
        ITEMS_PER_PAGE: 50,
        MAX_PAGES: 40,       // Увеличиваем лимит страниц
        MAX_ITEMS: 2000      // Увеличиваем лимит элементов
    };

    // Добавляем стили для карточек аниме
    addAnimeCardStyles();

    // 1. Функция получения URL для API
    function getApiUrl(page = 1, searchQuery = null) {
        // Для первой страницы используем базовый URL
        if (page === 1) {
            let url = `https://kodikapi.com/list?token=${config.API_KEY}&types=anime-serial,anime&limit=${config.ITEMS_PER_PAGE}&with_material_data=true&with_pagination=true`;
            
            // Добавляем параметры поиска если есть запрос
            if (searchQuery) {
                url += `&title=${encodeURIComponent(searchQuery)}&full_match=false`;
                // Ищем также в оригинальных названиях
                url += `&title_orig=${encodeURIComponent(searchQuery)}`;
            }
            
            return url;
        } 
        // Для последующих страниц используем сохраненный токен следующей страницы
        else if (state.nextPageToken) {
            return state.nextPageToken;
        }
        
        // Если нет токена, используем обычную пагинацию (запасной вариант)
        const offset = (page - 1) * config.ITEMS_PER_PAGE;
        let url = `https://kodikapi.com/list?token=${config.API_KEY}&types=anime-serial,anime&limit=${config.ITEMS_PER_PAGE}&offset=${offset}&with_material_data=true&with_pagination=true`;
        
        if (searchQuery) {
            url += `&title=${encodeURIComponent(searchQuery)}&full_match=false`;
            url += `&title_orig=${encodeURIComponent(searchQuery)}`;
        }
        
        return url;
    }

    // 2. Основная функция загрузки данных
    async function fetchAnime(page = 1, append = false) {
        if (state.isLoading || (!state.hasMoreData && append)) return;
        
        // Проверяем ограничения
        if (page > config.MAX_PAGES || state.animeData.length >= config.MAX_ITEMS) {
            state.hasMoreData = false;
            updateStatus("Достигнут предел загрузки данных");
            removeLoadingMore();
            return;
        }
        
        try {
            state.isLoading = true;
            
            // Показываем индикатор загрузки
            if (!append) {
                animeList.innerHTML = '<div class="loading">Загрузка аниме...</div>';
                
                // Сбрасываем кэш при новой загрузке
                if (!state.searchQuery) {
                    state.existingIds = new Set();
                    state.existingTitles = new Set();
                    state.nextPageToken = null;
                    state.lastCheckedIds = new Set(); // Сбрасываем кэш последней проверки
                    window.consecutiveEmptyPages = 0; // Сбрасываем счетчик пустых страниц
                }
            } else {
                showLoadingMore();
            }
            
            updateStatus(`Загрузка страницы ${page}...`);
            
            // Формируем URL с учетом поиска
            const apiUrl = getApiUrl(page, state.searchQuery);
            console.log(`Запрос к API (страница ${page}):`, apiUrl);
            
            // Выполняем запрос
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Ошибка запроса: ${response.status}`);
            
            const data = await response.json();
            
            // Отладочная информация для анализа структуры данных
            console.log("Ответ API:", {
                success: data.success,
                total: data.total,
                resultsCount: data.results ? data.results.length : 0,
                hasNextPage: !!data.next_page
            });
            
            // Сохраняем токен следующей страницы для пагинации
            if (data.next_page) {
                state.nextPageToken = data.next_page;
                state.hasMoreData = true;
                console.log("Найден токен следующей страницы:", data.next_page);
            } else {
                state.nextPageToken = null;
                state.hasMoreData = false;
                console.log("Токен следующей страницы отсутствует");
            }
            
            // Проверяем на дублирование данных между запросами
            if (data.results && data.results.length > 0) {
                const currentPageIds = data.results.slice(0, 5).map(item => item.id || item.link || "");
                
                // Проверяем, приходят ли те же самые данные при новом запросе
                let isDuplicate = false;
                if (state.lastCheckedIds && state.lastCheckedIds.size > 0) {
                    // Подсчитываем, сколько ID из текущей страницы были в предыдущей
                    let duplicateCount = 0;
                    currentPageIds.forEach(id => {
                        if (state.lastCheckedIds.has(id)) {
                            duplicateCount++;
                        }
                    });
                    
                    // Если более 60% ID совпадают, считаем страницу дубликатом
                    if (duplicateCount / currentPageIds.length > 0.6) {
                        isDuplicate = true;
                        console.warn(`⚠️ Обнаружено дублирование страницы! ${duplicateCount} из ${currentPageIds.length} ID совпадают с предыдущей страницей.`);
                    }
                }
                
                // Сохраняем текущие ID для следующей проверки
                state.lastCheckedIds = new Set(currentPageIds);
                
                // Если обнаружили дублирование и не первая страница, пробуем взять следующую
                if (isDuplicate && page > 1 && state.nextPageToken) {
                    console.warn("Пропускаем дублирующую страницу и пробуем следующую...");
                    state.isLoading = false;
                    fetchAnime(page + 1, append);
                    return;
                }
                
                // Выводим информацию о данных для отладки
                console.log("Образец данных:", {
                    id: data.results[0].id || data.results[0].link,
                    title: data.results[0].title,
                    material_data: data.results[0].material_data ? true : false,
                    material_title: data.results[0].material_data?.title,
                    poster: data.results[0].poster_url || data.results[0].poster || data.results[0].material_data?.poster_url
                });
                
                console.log("Хэш ID первых 5 элементов:", currentPageIds);
            }
            
            // Проверяем результаты
            if (!data.results || data.results.length === 0) {
                state.hasMoreData = false;
                if (state.animeData.length === 0) {
                    animeList.innerHTML = '<div class="no-results">Ничего не найдено</div>';
                }
                updateStatus("Больше аниме не найдено");
                removeLoadingMore();
                return;
            }
            
            // Сохраняем результаты текущей страницы для проверки дубликатов между страницами
            const currentPageIds = new Set();
            
            // Обрабатываем данные (с учетом возможных дубликатов)
            const newItems = [];
            
            // Маркируем дубликаты для статистики
            let localDuplicates = 0;
            let globalDuplicates = 0;
            
            for (const item of data.results) {
                // Проверка на валидность данных
                if (!item) continue;
                
                // Используем более надежный способ извлечения данных
                const animeItem = {
                    id: '',
                    title: '',
                    poster: '',
                    genres: [],
                    rating: 0,
                    status: 'released',
                    description: ''
                };
                
                // Заполняем ID (важнейший параметр)
                animeItem.id = item.id || item.link || item.shikimori_id || '';
                
                // Пропускаем элементы с пустым ID
                if (!animeItem.id) continue;
                
                // Проверяем дублирование ID в текущей странице
                if (currentPageIds.has(animeItem.id)) {
                    localDuplicates++;
                    continue; // Пропускаем дубликаты в текущей странице
                }
                currentPageIds.add(animeItem.id);
                
                // Заполняем название
                if (item.title) {
                    animeItem.title = item.title;
                } else if (item.material_data && item.material_data.title) {
                    animeItem.title = item.material_data.title;
                } else if (item.russian) {
                    animeItem.title = item.russian;
                } else if (item.name) {
                    animeItem.title = item.name;
                } else {
                    animeItem.title = "Без названия";
                }
                
                // Заполняем постер
                animeItem.poster = item.poster_url || item.poster || 
                                  (item.material_data && item.material_data.poster_url) || 
                                  '';
                
                // Заполняем жанры
                if (Array.isArray(item.genres)) {
                    animeItem.genres = item.genres;
                } else if (item.material_data && Array.isArray(item.material_data.genres)) {
                    animeItem.genres = item.material_data.genres;
                } else if (typeof item.genres === 'string') {
                    animeItem.genres = item.genres.split(',').map(g => g.trim());
                } else {
                    animeItem.genres = ['Без жанра'];
                }
                
                // Заполняем рейтинг
                const rawRating = item.rating || item.material_data?.shikimori_rating || 0;
                animeItem.rating = typeof rawRating === 'number' ? rawRating : Number(rawRating) || 0;
                
                // Заполняем статус
                animeItem.status = item.status || item.material_data?.anime_status || 'released';
                
                // Заполняем описание
                animeItem.description = item.description || item.material_data?.description || '';
                
                // Проверяем на глобальные дубликаты по ID
                if (state.existingIds.has(animeItem.id)) {
                    globalDuplicates++;
                    continue; // Пропускаем если ID уже есть
                }
                
                // Проверяем на глобальные дубликаты по названию
                const normalizedTitle = animeItem.title.toLowerCase().trim();
                if (!normalizedTitle || state.existingTitles.has(normalizedTitle)) {
                    globalDuplicates++;
                    continue; // Пропускаем если название уже есть или пустое
                }
                
                // Добавляем ID и название в множества для отслеживания
                state.existingIds.add(animeItem.id);
                state.existingTitles.add(normalizedTitle);
                
                // Добавляем элемент в список новых
                newItems.push(animeItem);
            }
            
            console.log(`Загружено ${newItems.length} уникальных элементов из ${data.results.length} полученных (стр.${page})`);
            console.log(`Статистика дубликатов: ${localDuplicates} локальных, ${globalDuplicates} глобальных`);
            
            // Проверяем процент уникальных элементов
            const uniquePercent = Math.round((newItems.length / data.results.length) * 100);
            console.log(`Процент уникальных элементов: ${uniquePercent}%`);
            
            // Если мало уникальных элементов, возможно на дальнейших страницах будет больше
            if (newItems.length === 0 || uniquePercent < 20) {
                // Увеличиваем счетчик пустых страниц
                window.consecutiveEmptyPages = (window.consecutiveEmptyPages || 0) + 1;
                
                // Если мы уже несколько раз получали мало уникальных результатов, 
                // возможно мы достигли предела уникальных данных
                if (window.consecutiveEmptyPages >= 3) {
                    console.log("Достигнут предел уникальных данных после нескольких пустых страниц");
                    state.hasMoreData = false;
                    updateStatus("Больше уникальных аниме не найдено");
                    removeLoadingMore();
                    return;
                }
                
                console.log(`Страница #${page} содержит слишком мало уникальных элементов (${uniquePercent}%). Пробуем следующую...`);
                
                // Сбрасываем флаг загрузки и пробуем следующую страницу
                state.isLoading = false;
                fetchAnime(page + 1, append);
                return;
            } else {
                // Сбрасываем счетчик, если нашли достаточно уникальных элементов
                window.consecutiveEmptyPages = 0;
            }
            
            // Добавляем новые данные
            if (append) {
                state.animeData = [...state.animeData, ...newItems];
            } else {
                state.animeData = newItems;
            }
            
            // Обновляем состояние
            state.currentPage = page;
            
            // Применяем фильтры к новым данным
            filterAnime(append);
            
            updateStatus(`Загружено ${state.animeData.length} аниме`);
            
        } catch (error) {
            console.error("Ошибка при загрузке данных:", error);
            if (!append) {
                animeList.innerHTML = '<div class="error">Ошибка загрузки данных</div>';
            }
            updateStatus("Ошибка загрузки данных");
        } finally {
            state.isLoading = false;
            if (append) {
                removeLoadingMore();
            }
        }
    }

    // 3. Функция фильтрации данных
    function filterAnime(append = false) {
        if (state.animeData.length === 0) return;
        
        let filtered = [...state.animeData];
        
        // Фильтр по жанру
        if (genreFilter && genreFilter.value !== "all") {
            filtered = filtered.filter(anime => 
                anime.genres.some(genre => 
                    genre.toLowerCase().includes(genreFilter.value.toLowerCase())
                )
            );
        }
        
        // Фильтр по рейтингу
        if (ratingFilter) {
            if (ratingFilter.value === "high") {
                filtered.sort((a, b) => b.rating - a.rating);
            } else if (ratingFilter.value === "low") {
                filtered.sort((a, b) => a.rating - b.rating);
            }
        }
        
        // Фильтр по статусу
        if (completedCheckbox && ongoingCheckbox) {
            if (completedCheckbox.checked && !ongoingCheckbox.checked) {
                filtered = filtered.filter(anime => anime.status === "released");
            } else if (ongoingCheckbox.checked && !completedCheckbox.checked) {
                filtered = filtered.filter(anime => anime.status === "ongoing");
            }
        }
        
        // Поиск по названию (локальный)
        const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (searchQuery && searchQuery.length > 0 && !state.searchQuery) {
            filtered = filtered.filter(anime => {
                const title = anime.title.toLowerCase();
                const description = anime.description.toLowerCase();
                return title.includes(searchQuery) || description.includes(searchQuery);
            });
        }
        
        // Обновляем отфильтрованные данные
        state.filteredData = filtered;
        
        // Отображаем данные
        renderAnime(filtered, append);
        
        updateStatus(`Найдено: ${filtered.length} из ${state.animeData.length} аниме`);
    }

    // 4. Функция отрисовки аниме
    function renderAnime(data, append = false) {
        if (!data || data.length === 0) {
            if (!append) {
                animeList.innerHTML = '<div class="no-results">Ничего не найдено</div>';
            }
            return;
        }
        
        // Если не режим добавления, очищаем список
        if (!append) {
            animeList.innerHTML = "";
        } else {
            // Удаляем индикатор загрузки, если есть
            removeLoadingMore();
        }
        
        data.forEach(anime => {
            const card = document.createElement("div");
            card.className = "anime-card";
            card.dataset.id = anime.id;  // Добавляем ID для отслеживания дубликатов в DOM
            
            // Лимитируем жанры до 2 для компактности
            const genresHTML = anime.genres.slice(0, 2).map(genre => 
                `<span class="genre-tag">${genre}</span>`
            ).join("");
            
            const posterUrl = anime.poster || 'https://via.placeholder.com/300x400/1a1a1a/f39c12?text=No+Image';
            
            // Форматируем рейтинг
            const rating = anime.rating.toFixed(1);
            
            // Определяем статус
            const status = anime.status === "ongoing" ? "В процессе" : "Завершено";
            const statusClass = anime.status === "ongoing" ? "ongoing" : "released";
            
            // Сокращаем описание для карточки
            const shortDescription = anime.description.substring(0, 60) + (anime.description.length > 60 ? '...' : '');
            
            card.innerHTML = `
                <div class="anime-poster">
                    <img src="${posterUrl}" alt="${anime.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/f39c12?text=No+Image'">
                    <div class="rating">${rating}</div>
                    <div class="status ${statusClass}">${status}</div>
                </div>
                <div class="anime-info">
                    <h3 class="anime-title">${anime.title}</h3>
                    <p class="anime-description">${shortDescription}</p>
                    <div class="genres-container">
                        ${genresHTML}
                    </div>
                    <a href="/anime/${encodeURIComponent(anime.id)}/" class="watch-btn">Смотреть</a>
                </div>
            `;
            
            // Делаем всю карточку кликабельной
            card.addEventListener('click', (e) => {
                // Проверяем, не является ли клик по кнопке "Смотреть"
                if (e.target.classList.contains('watch-btn') || e.target.closest('.watch-btn')) {
                    e.stopPropagation();
                    return;
                }
                window.location.href = `/anime/${encodeURIComponent(anime.id)}/`;
            });
            
            animeList.appendChild(card);
        });
    }

    // 5. Функция обновления статуса
    function updateStatus(status) {
        if (statusText) {
            statusText.textContent = status;
        }
        
        if (progressFilled) {
            const progress = Math.min((state.animeData.length / config.MAX_ITEMS) * 100, 100);
            progressFilled.style.width = `${progress}%`;
        }
    }

    // Функции для индикатора загрузки при прокрутке
    function showLoadingMore() {
        // Проверяем, нет ли уже индикатора загрузки
        if (document.querySelector('.loading-more')) return;
        
        const loadingMore = document.createElement('div');
        loadingMore.className = 'loading-more';
        loadingMore.innerHTML = `
            <div class="loader"></div>
            <p>Загружаем еще...</p>
        `;
        animeList.appendChild(loadingMore);
    }
    
    function removeLoadingMore() {
        const loadingMore = document.querySelector('.loading-more');
        if (loadingMore) {
            loadingMore.remove();
        }
        
        // Если больше данных нет, добавляем сообщение о конце
        if (!state.hasMoreData && state.animeData.length > 0) {
            addEndMessage("Вы достигли конца коллекции аниме!");
        }
    }
    
    // Добавление сообщения о конце коллекции
    function addEndMessage(message) {
        // Проверяем, нет ли уже сообщения
        if (document.querySelector('.end-message')) return;
        
        const endMessage = document.createElement('div');
        endMessage.className = 'end-message';
        endMessage.innerHTML = `
            <div class="end-message-content">
                <span class="emoji">🎬</span>
                <p>${message}</p>
                <button class="scroll-to-top">Вернуться наверх</button>
            </div>
        `;
        
        animeList.appendChild(endMessage);
        
        // Добавляем обработчик для кнопки "Вернуться наверх"
        document.querySelector('.scroll-to-top').addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 6. Обработчик скролла для загрузки дополнительных данных
    function handleScroll() {
        if (state.isLoading || !state.hasMoreData) return;
        
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        
        // Если пользователь достиг конца страницы (с запасом 200px)
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            fetchAnime(state.currentPage + 1, true);
        }
    }

    // 7. Функция поиска
    function performSearch() {
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        
        // Если запрос слишком короткий, применяем локальную фильтрацию
        if (query.length > 0 && query.length < 3) {
            state.searchQuery = ""; // Сбрасываем глобальный поиск
            filterAnime();
            return;
        }
        
        // Для запросов от 3 символов делаем поиск через API
        if (query.length >= 3) {
            state.searchQuery = query;
            state.currentPage = 1;
            state.hasMoreData = true;
            state.animeData = [];
            state.existingIds = new Set();  // Сбрасываем множество ID
            state.existingTitles = new Set(); // Сбрасываем множество названий
            fetchAnime(1, false);
            return;
        }
        
        // Если запрос пустой, сбрасываем поиск
        if (query.length === 0 && state.searchQuery) {
            state.searchQuery = "";
            state.currentPage = 1;
            state.hasMoreData = true;
            state.animeData = [];
            state.existingIds = new Set();  // Сбрасываем множество ID
            state.existingTitles = new Set(); // Сбрасываем множество названий
            fetchAnime(1, false);
        }
    }

    // 8. Стили для карточек аниме
    function addAnimeCardStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
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
            .anime-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 25px rgba(0, 0, 0, 0.5);
            }
            .anime-poster {
                position: relative;
                height: 380px;
                overflow: hidden;
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
            .rating {
                position: absolute;
                top: 10px;
                right: 10px;
                background: var(--accent-orange, #f39c12);
                color: white;
                padding: 3px 8px;
                border-radius: 5px;
                font-weight: bold;
                z-index: 10;
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
                display: inline-block;
                background: var(--accent-orange, #f39c12);
                color: white;
                text-decoration: none;
                padding: 8px 15px;
                border-radius: 5px;
                text-align: center;
                font-weight: bold;
                transition: background-color 0.3s ease;
                margin-top: auto;
                text-transform: uppercase;
                font-size: 13px;
                letter-spacing: 0.5px;
            }
            .watch-btn:hover {
                background-color: #ff8c2a;
            }
            .loading, .error, .no-results {
                text-align: center;
                padding: 50px;
                font-size: 18px;
                color: #aaa;
            }
            .error {
                color: #ff6b6b;
            }
            .loading-more {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                width: 100%;
                color: #aaa;
            }
            .loading-more .loader {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 107, 0, 0.2);
                border-radius: 50%;
                border-top-color: var(--accent-orange, #f39c12);
                animation: spin 1s ease-in-out infinite;
                margin-bottom: 10px;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .end-message {
                width: 100%;
                padding: 20px;
                margin-top: 30px;
                margin-bottom: 50px;
                text-align: center;
            }
            .end-message-content {
                background-color: rgba(26, 26, 26, 0.9);
                border: 2px solid var(--accent-orange, #f39c12);
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
                background-color: var(--accent-orange, #f39c12);
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
        document.head.appendChild(styles);
    }

    // Назначаем обработчики событий
    if (searchInput) {
        searchInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                performSearch();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", performSearch);
    }

    if (genreFilter) {
        genreFilter.addEventListener("change", () => filterAnime(false));
    }

    if (ratingFilter) {
        ratingFilter.addEventListener("change", () => filterAnime(false));
    }

    if (completedCheckbox) {
        completedCheckbox.addEventListener("change", () => filterAnime(false));
    }

    if (ongoingCheckbox) {
        ongoingCheckbox.addEventListener("change", () => filterAnime(false));
    }

    // Добавляем обработчик бесконечного скролла
    window.addEventListener("scroll", handleScroll);

    // Запускаем первую загрузку
    fetchAnime(1, false);
}); 