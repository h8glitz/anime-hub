document.addEventListener("DOMContentLoaded", async () => {
    const animeContainer = document.querySelector(".container");
    const hero = document.querySelector(".hero");
    const header = document.querySelector("header");

    // --- Header Effects ---
    if (header) {
        // Structure the header with containers if needed
        if (!header.querySelector('.header-container')) {
            // Get all direct children of header
            const headerContents = Array.from(header.children);
            
            // Create container
            const headerContainer = document.createElement('div');
            headerContainer.className = 'header-container';
            
            // Move all children to the container
            headerContents.forEach(child => {
                headerContainer.appendChild(child);
            });
            
            // Add the container to header
            header.appendChild(headerContainer);
            
            // Create logo if it doesn't exist
            if (!header.querySelector('.logo')) {
                const nav = header.querySelector('nav');
                if (nav) {
                    const logo = document.createElement('a');
                    logo.className = 'logo';
                    logo.href = '/';
                    logo.textContent = 'AnimeLIGHT';
                    
                    // Insert before nav
                    headerContainer.insertBefore(logo, nav);
                }
            }
            
            // Create mobile menu toggle
            const menuToggle = document.createElement('div');
            menuToggle.className = 'menu-toggle';
            menuToggle.innerHTML = `
                <span></span>
                <span></span>
                <span></span>
            `;
            headerContainer.appendChild(menuToggle);
            
            // Create user actions container if login button exists
            const loginBtn = header.querySelector('.btn-login');
            if (loginBtn && loginBtn.parentNode.tagName !== 'DIV') {
                const userActions = document.createElement('div');
                userActions.className = 'user-actions';
                
                // Move login button to user actions
                userActions.appendChild(loginBtn);
                
                // Add to header container
                headerContainer.appendChild(userActions);
            }
        }
        
        // Scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
        
        // Mobile menu toggle
        const menuToggle = header.querySelector('.menu-toggle');
        const nav = header.querySelector('nav');
        
        if (menuToggle && nav) {
            menuToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                header.classList.toggle('menu-open');
            });
        }
    }

    // Create effects container if hero exists
    if (hero) {
        // --- Grid Overlays ---
        // First grid overlay (diagonal pattern)
        const gridOverlay = document.createElement("div");
        gridOverlay.className = "hero-grid-overlay";
        hero.appendChild(gridOverlay);
        
        // Second grid overlay (lines pattern)
        const gridOverlay2 = document.createElement("div");
        gridOverlay2.className = "hero-grid-overlay-2";
        hero.appendChild(gridOverlay2);
        
        // --- Container Creation --- 
        // Create various particle containers
        const containers = [
            "sparkles",         // For basic sparkles
            "digital-particles", // For pixel particles
            "floating-elements", // For floating Japanese characters
            "animated-shapes",   // For geometric shapes
            "tech-particles"     // For tech lines and data blocks
        ];
        
        // Create all containers
        const createdContainers = {};
        containers.forEach(containerName => {
            const container = document.createElement("div");
            container.className = containerName;
            hero.appendChild(container);
            createdContainers[containerName] = container;
        });
        
        // --- Standard Sparkles ---
        function createSparkle() {
            const sparkle = document.createElement("div");
            sparkle.className = "sparkle";
            sparkle.style.left = Math.random() * 100 + "%";
            sparkle.style.top = Math.random() * 100 + "%"; 
            sparkle.style.animationDelay = Math.random() * 4 + "s"; 
            createdContainers.sparkles.appendChild(sparkle);
            
            setTimeout(() => {
                sparkle.remove();
            }, 4000); 
        }
        
        // Create initial sparkles
        for (let i = 0; i < 15; i++) {
            createSparkle();
        }
        
        // Create new sparkles periodically
        setInterval(() => {
            if (createdContainers.sparkles.children.length < 15) {
                createSparkle();
            }
        }, 500);
        
        // --- Digital Particles ---
        function createPixelParticle(type = null) {
            const particle = document.createElement("div");
            particle.classList.add("pixel-particle");
            
            // Set type and animation parameters
            let animationDuration = 5;
            
            // If type is specified, use it, otherwise pick randomly
            if (!type) {
                const rand = Math.random();
                if (rand < 0.3) type = "white";
                else if (rand < 0.5) type = "orange";
                else if (rand < 0.65) type = "tiny";
                else if (rand < 0.8) type = "data-block";
                else if (rand < 0.9) type = "star";
                else type = "pulse";
            }
            
            // Apply the specific class and get the animation duration
            switch (type) {
                case "white":
                    particle.classList.add("pixel--white");
                    animationDuration = 5;
                    break;
                case "orange":
                    particle.classList.add("pixel--orange");
                    animationDuration = 7;
                    break;
                case "tiny":
                    particle.classList.add("pixel--tiny");
                    animationDuration = 4;
                    break;
                case "data-block":
                    particle.classList.add("pixel--data-block");
                    animationDuration = 12;
                    break;
                case "star":
                    particle.classList.add("pixel--star");
                    animationDuration = 3;
                    break;
                case "pulse":
                    particle.classList.add("pixel--pulse");
                    animationDuration = 4;
                    break;
            }
            
            // Position randomly
            particle.style.left = Math.random() * 100 + "%";
            particle.style.top = Math.random() * 100 + "%";
            
            // Add random delay
            const delay = Math.random() * animationDuration;
            particle.style.animationDelay = delay + "s";
            
            // Add to container
            createdContainers["digital-particles"].appendChild(particle);
            
            // Remove when animation is complete
            setTimeout(() => {
                particle.remove();
            }, (animationDuration + delay) * 1000 + 100);
        }
        
        // Create initial digital particles
        for (let i = 0; i < 30; i++) {
            createPixelParticle();
        }
        
        // Create new particles periodically
        setInterval(() => {
            if (createdContainers["digital-particles"].children.length < 40) {
                for (let i = 0; i < 3; i++) {
                    createPixelParticle();
                }
            }
        }, 400);
        
        // --- Japanese Characters ---
        function createFloatingCharacter() {
            // Japanese and anime-related characters
            const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん♥♪☆★';
            
            const element = document.createElement("div");
            element.className = "floating-character";
            element.textContent = chars[Math.floor(Math.random() * chars.length)];
            
            // Randomize position, size, and animation delay
            element.style.left = Math.random() * 100 + "%";
            element.style.top = Math.random() * 100 + "%";
            element.style.fontSize = (Math.random() * 14 + 12) + "px"; // 12-26px
            
            const delay = Math.random() * 10;
            element.style.animationDelay = delay + "s";
            
            // Add to container
            createdContainers["floating-elements"].appendChild(element);
            
            // Remove when animation is complete
            setTimeout(() => {
                element.remove();
            }, 10000 + delay * 1000 + 100);
        }
        
        // Create initial floating characters
        for (let i = 0; i < 20; i++) {
            createFloatingCharacter();
        }
        
        // Create new characters periodically
        setInterval(() => {
            if (createdContainers["floating-elements"].children.length < 30) {
                createFloatingCharacter();
            }
        }, 600);
        
        // --- Animated Shapes ---
        function createShape() {
            const element = document.createElement("div");
            element.className = "anime-shape";
            
            // Randomly choose shape type
            const shapeType = Math.random();
            if (shapeType < 0.33) {
                element.classList.add("shape-circle");
            } else if (shapeType < 0.66) {
                element.classList.add("shape-triangle");
            } else {
                element.classList.add("shape-square");
            }
            
            // Randomize position, size and animation delay
            element.style.left = Math.random() * 100 + "%";
            element.style.top = Math.random() * 100 + "%";
            
            // Larger size variation for shapes
            const size = (Math.random() * 20 + 10); // 10-30px
            element.style.width = size + "px";
            element.style.height = size + "px";
            
            const delay = Math.random() * 12;
            element.style.animationDelay = delay + "s";
            
            // Add to container
            createdContainers["animated-shapes"].appendChild(element);
            
            // Remove when animation is complete
            setTimeout(() => {
                element.remove();
            }, 12000 + delay * 1000 + 100);
        }
        
        // Create initial shapes
        for (let i = 0; i < 15; i++) {
            createShape();
        }
        
        // Create new shapes periodically
        setInterval(() => {
            if (createdContainers["animated-shapes"].children.length < 20) {
                createShape();
            }
        }, 800);
        
        // --- Tech Lines ---
        function createTechLine() {
            const element = document.createElement("div");
            element.className = "tech-line";
            
            // Randomize position, width and animation delay
            element.style.left = Math.random() * 40 + "%"; // Left side bias
            element.style.top = Math.random() * 100 + "%";
            element.style.width = (Math.random() * 200 + 50) + "px"; // 50-250px length
            
            const delay = Math.random() * 8;
            element.style.animationDelay = delay + "s";
            
            // Add to container
            createdContainers["tech-particles"].appendChild(element);
            
            // Remove when animation is complete
            setTimeout(() => {
                element.remove();
            }, 8000 + delay * 1000 + 100);
        }
        
        // Create initial tech lines
        for (let i = 0; i < 10; i++) {
            createTechLine();
        }
        
        // Create new tech lines periodically
        setInterval(() => {
            if (createdContainers["tech-particles"].children.length < 15) {
                createTechLine();
            }
        }, 1000);
        
        // --- Interactive Gradient ---
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top;
            
            // Calculate normalized position for enhanced effects
            const normalizedX = x / rect.width;
            const normalizedY = y / rect.height;
            
            // Apply position with smooth transition
            hero.style.setProperty('--hero-x', `${x}px`);
            hero.style.setProperty('--hero-y', `${y}px`);
            
            // Dynamically adjust the gradient size based on cursor speed
            if (!hero.lastCursorPosition) {
                hero.lastCursorPosition = { x, y, timestamp: Date.now() };
            } else {
                const now = Date.now();
                const elapsed = now - hero.lastCursorPosition.timestamp;
                
                if (elapsed > 50) { // Throttle measurements
                    const distance = Math.sqrt(
                        Math.pow(x - hero.lastCursorPosition.x, 2) + 
                        Math.pow(y - hero.lastCursorPosition.y, 2)
                    );
                    
                    const speed = distance / elapsed;
                    
                    // Adjust the gradient based on cursor speed (faster = larger)
                    const baseSize = 800;
                    let size = baseSize + (speed * 1000);
                    size = Math.min(Math.max(size, baseSize), baseSize * 1.5);
                    
                    hero.style.setProperty('--hero-gradient-size', `${size}px`);
                    
                    // Update last position
                    hero.lastCursorPosition = { x, y, timestamp: now };
                }
            }
            
            // Add a new particle at mouse position occasionally (10% chance)
            if (Math.random() < 0.15) { // Increased chance
                const types = ["star", "pulse", "data-block"];
                const particle = document.createElement("div");
                particle.classList.add("pixel-particle");
                particle.classList.add("pixel--" + types[Math.floor(Math.random() * types.length)]);
                
                // Position near the cursor with slight randomization
                const offsetX = (Math.random() - 0.5) * 40;
                const offsetY = (Math.random() - 0.5) * 40;
                
                particle.style.left = ((x + offsetX) / rect.width * 100) + "%";
                particle.style.top = ((y + offsetY) / rect.height * 100) + "%";
                
                // Animation parameters
                let duration;
                if (particle.classList.contains("pixel--star")) duration = 3;
                else if (particle.classList.contains("pixel--pulse")) duration = 4;
                else duration = 12;
                
                particle.style.animationDelay = "0s"; // Start immediately
                
                // Add to container
                createdContainers["digital-particles"].appendChild(particle);
                
                // Remove when animation completes
                setTimeout(() => {
                    particle.remove();
                }, duration * 1000 + 100);
            }
        });
    }

    /** 📡 Получаем ID аниме из URL */
    function getAnimeIdFromUrl() {
        return window.location.pathname.split("/")[2];
    }

    /** 📡 Загружаем данные из Kodík + подгрузка с Shikimori */
    async function fetchAnimeDetails(animeId) {
        try {
            console.log(`🔄 Получаем данные из Kodík для ID ${animeId}`);

            const apiKey = "447d179e875efe44217f20d1ee2146be";
            const apiUrl = `https://kodikapi.com/search?token=${apiKey}&id=${animeId}&with_episodes=true&with_material_data=true`;

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Ошибка запроса Kodík (${response.status})`);

            const data = await response.json();
            if (!data.results || data.results.length === 0) throw new Error("⚠ Аниме не найдено!");

            let animeDetails = data.results[0];

            console.log("📜 Ответ API:", animeDetails);

            // Получаем наилучшую доступную обложку аниме (приоритет)
            if (animeDetails.material_data && animeDetails.material_data.poster_url) {
                // Приоритет 1: данные с material_data (обычно официальные обложки)
                animeDetails.poster_url = animeDetails.material_data.poster_url;
                console.log(`✅ Используем официальную обложку из material_data: ${animeDetails.poster_url}`);
            } else if (animeDetails.poster_url && !animeDetails.poster_url.includes('screenshots')) {
                // Приоритет 2: использовать poster_url, если это не скриншот
                console.log(`✅ Используем обложку из poster_url: ${animeDetails.poster_url}`);
            } else if (animeDetails.screenshots && animeDetails.screenshots.length > 0) {
                // Приоритет 3: использовать первый скриншот как последнее средство
                animeDetails.poster_url = animeDetails.screenshots[0];
                console.log(`✅ Используем скриншот как временную обложку: ${animeDetails.poster_url}`);
            }

	        // ⏬ Дополняем данными (Shikimori)
	        if (animeDetails.shikimori_id) {
	            console.warn("⚡ Дополним данными через Shikimori...");
	            await fetchShikimoriData(animeDetails);
	        }

	        renderAnimeDetails(animeDetails);

        } catch (error) {
			console.error(error);
			animeContainer.innerHTML = "<p style='color:red;'>❌ Ошибка загрузки аниме.</p>";
        }
    }

    /** 📡 Подгрузка данных с SHIKIMORI */
    async function fetchShikimoriData(anime){
	    try {
	        console.log(`🔍 Ищем на Shikimori по ID ${anime.shikimori_id}`);

	        let shikiAPI = `https://shikimori.one/api/animes/${anime.shikimori_id}`;
	        let resp = await fetch(shikiAPI);
	        if (!resp.ok) throw new Error ("Ошибка поиска!");

	        let shikiRes= await resp.json();

	        document.getElementById("genres").textContent =
	    		shikiRes.genres.map(g => g.russian).join(", ");

		    document.getElementById("year").textContent = shikiRes.aired_on ? shikiRes.aired_on.slice(0,4) : "-";

		    document.getElementById("studio").textContent =
		         shikiRes.studios?.[0]?.name_ru || "—";

	    	document.getElementById("rating").textContent=`⭐ ${shikiRes.score}`;

	    	document.getElementById("shiki-link").href=`https://shikimori.one${shikiRes.url}`;

		    document.getElementById("anime-description").textContent=
					   shikiRes.description || "(Описание ожидается...)";

		    /** 💡 Подгружаем постер из SHIKIMORI 🖼️ **/
		   if(shikiRes.image?.original){
		 		console.log ("✅ Обновляем постер!");
				document.getElementById("anime-poster").
	         		src=`https://shikimori.one${shikiRes.image.original}`;
		   }

	    } catch(err){
	 		console.warn("[⚠ Ошибка запроса к SHIKI]");
	    }
	}

    /** 🎞️ Отображение полной информации о тайтле */
    function renderAnimeDetails(anime){
        console.log ("🎬 Финальная загрузка карточки!");

        document.title=`🎞️ ${anime.title}`;
    	document.getElementById ("anime-title") .textContent= anime.title;

	    // ✅ Установка обложки с обработкой ошибок
	    let posterElement = document.getElementById("anime-poster");
	    let posterURL = anime.poster_url || "/static/images/no_poster.jpg";
	    
	    // Добавляем обработчик ошибок для изображения
	    posterElement.onerror = function() {
	        console.warn("⚠️ Ошибка загрузки изображения, используем запасное");
	        this.src = "/static/images/no_poster.jpg";
	    };
	    
	    posterElement.src = posterURL;
        
        // Отображаем информацию о сериях
        if (anime.episodes_count) {
            document.getElementById("episodes").textContent = anime.episodes_count;
        } else {
            document.getElementById("episodes").textContent = "?";
        }
        
        // Отображаем рейтинг (приоритезируем данные из разных источников)
        const ratingElement = document.getElementById("rating");
        if (ratingElement) {
            // Используем первый из доступных рейтингов
            const rating = anime.shikimori_id ? null : // Если есть shikimori_id, оставляем null, так как будет загружено из Shikimori
                         anime.material_data?.shikimori_rating || 
                         anime.kinopoisk_rating || 
                         anime.imdb_rating || 
                         "?";
            
            if (rating) {
                ratingElement.textContent = `⭐ ${rating}`;
            }
        }
        
        // Отображаем статус
        document.getElementById("status").textContent = anime.material_data?.status === "ongoing" ? "Онгоинг" : "Завершен";

        // Описание аниме (если нет shikimori_id)
        if (!anime.shikimori_id) {
            let description = anime.description || anime.material_data?.description || "Описание отсутствует";
            document.getElementById("anime-description").textContent = description;
        }

        // Создаем общий стиль для всех секций страницы, чтобы обеспечить единообразие
        const commonStyles = document.createElement('style');
        commonStyles.textContent = `
            /* Общие стили для всех секций */
            .anime-player, .screenshots, .episodes, .recommendations {
                margin: 40px auto;
                max-width: 1200px;
                width: 95%;
                background-color: #121212;
                border-radius: 15px;
                overflow: hidden;
                padding: 30px 20px;
            }
            
            .anime-player h2, .screenshots h2, .episodes h2, .recommendations h2 {
                margin-bottom: 25px;
                color: #f39c12;
                text-align: center;
                font-size: 28px;
                position: relative;
            }
            
            .anime-player h2::after, .screenshots h2::after, .episodes h2::after, .recommendations h2::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 80px;
                height: 3px;
                background: var(--gradient-orange);
                border-radius: 3px;
            }
            
            /* Стили для плеера */
            .player-container iframe {
                width: 100%;
                height: 650px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            
            /* Отзывчивый плеер */
            @media (max-width: 768px) {
                .player-container iframe {
                    height: 400px;
                }
            }
            
            @media (max-width: 480px) {
                .player-container iframe {
                    height: 300px;
                }
            }
        `;
        document.head.appendChild(commonStyles);

	    // Плеер - делаем больше
	    let playerWrapper = document.getElementById("player-wrapper");
	    if (playerWrapper && anime.link) {
	        playerWrapper.innerHTML = `
                <h2>Смотреть онлайн</h2>
                <div class="player-container">
                    <iframe src="${"https:"+ anime.link}" allowfullscreen frameborder='0'></iframe>
                </div>`;
	    } else if (playerWrapper) {
	        playerWrapper.innerHTML = `<div class="error-message">Видео недоступно</div>`;
	    }
        
        // Отображаем скриншоты в виде вкладок, если они есть
        renderScreenshots(anime);
        
        // Отображаем список эпизодов, если они есть
        renderEpisodesList(anime);
    }
    
    /** 📸 Отображение скриншотов */
    function renderScreenshots(anime) {
        const screenshotsContainer = document.querySelector('.screenshots-container');
        
        // Если контейнера нет, выходим
        if (!screenshotsContainer) return;
        
        // Если скриншотов нет, скрываем раздел
        if (!anime.screenshots || anime.screenshots.length === 0) {
            document.querySelector('.screenshots').style.display = 'none';
            return;
        }
        
        // Добавляем CSS только для скриншотов, без повторения общих стилей
        const screenshotsStyle = document.createElement('style');
        screenshotsStyle.textContent = `
            .screenshots-container {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                justify-content: center;
            }
            
            .screenshot-thumbnail {
                width: 200px;
                height: 120px;
                border-radius: 10px;
                overflow: hidden;
                cursor: pointer;
                position: relative;
                transition: all 0.3s ease;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            
            .screenshot-thumbnail img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }
            
            .screenshot-thumbnail:hover img {
                transform: scale(1.1);
            }
            
            .screenshot-thumbnail:hover::after {
                content: '👁️';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 24px;
                text-shadow: 0 0 5px rgba(0,0,0,0.7);
            }
            
            .screenshot-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 999;
                justify-content: center;
                align-items: center;
            }
            
            .screenshot-modal.active {
                display: flex;
            }
            
            .screenshot-modal img {
                max-width: 90%;
                max-height: 90%;
                border-radius: 10px;
            }
            
            .screenshot-modal .close {
                position: absolute;
                top: 20px;
                right: 30px;
                color: white;
                font-size: 30px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(screenshotsStyle);
        
        // Создаем превью скриншотов
        anime.screenshots.forEach((screenshot, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'screenshot-thumbnail';
            thumbnail.innerHTML = `<img src="${screenshot}" alt="Скриншот ${index+1}">`;
            
            // При клике открываем скриншот в модальном окне
            thumbnail.addEventListener('click', () => {
                // Создаем модальное окно если его еще нет
                let modal = document.querySelector('.screenshot-modal');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.className = 'screenshot-modal';
                    modal.innerHTML = `
                        <span class="close">&times;</span>
                        <img src="${screenshot}" alt="Скриншот ${index+1}">
                    `;
                    document.body.appendChild(modal);
                    
                    // Закрытие по клику на крестик
                    modal.querySelector('.close').addEventListener('click', () => {
                        modal.classList.remove('active');
                    });
                    
                    // Закрытие по клику вне изображения
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.classList.remove('active');
                        }
                    });
                } else {
                    // Обновляем изображение
                    modal.querySelector('img').src = screenshot;
                }
                
                // Показываем модальное окно
                modal.classList.add('active');
            });
            
            screenshotsContainer.appendChild(thumbnail);
        });
    }
    
    /** 📃 Отображение списка эпизодов */
    function renderEpisodesList(anime) {
        const episodesContainer = document.getElementById('episodes-container');
        
        // Если контейнера нет, выходим
        if (!episodesContainer) return;
        
        // Если эпизодов нет, скрываем раздел
        if (!anime.episodes || Object.keys(anime.episodes).length === 0) {
            document.querySelector('.episodes').style.display = 'none';
            return;
        }
        
        // Добавляем CSS только для списка эпизодов, без дублирования общих стилей
        const episodesStyle = document.createElement('style');
        episodesStyle.textContent = `
            .episode-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            
            .episode-item {
                background: #1a1a1a;
                border-radius: 10px;
                overflow: hidden;
                transition: all 0.3s ease;
                cursor: pointer;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            
            .episode-item:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(243, 156, 18, 0.2);
            }
            
            .episode-item img {
                width: 100%;
                height: 100px;
                object-fit: cover;
                border-bottom: 2px solid #f39c12;
            }
            
            .episode-info {
                padding: 10px;
            }
            
            .episode-info h4 {
                font-size: 16px;
                margin-bottom: 5px;
                color: white;
            }
            
            .episode-info p {
                font-size: 14px;
                color: #b0b0b0;
            }
        `;
        document.head.appendChild(episodesStyle);
        
        // Создаем сетку эпизодов
        const episodeGrid = document.createElement('div');
        episodeGrid.className = 'episode-grid';
        
        // Сортируем эпизоды по номеру
        const sortedEpisodes = Object.keys(anime.episodes)
            .sort((a, b) => parseInt(a) - parseInt(b));
        
        // Создаем карточки эпизодов
        sortedEpisodes.forEach(epNum => {
            const episode = anime.episodes[epNum];
            const episodeItem = document.createElement('div');
            episodeItem.className = 'episode-item';
            
            // Используем скриншот если есть, иначе постер аниме
            const imageUrl = (anime.screenshots && anime.screenshots.length > 0) 
                ? anime.screenshots[Math.floor(Math.random() * anime.screenshots.length)]
                : anime.poster_url;
            
            episodeItem.innerHTML = `
                <img src="${imageUrl}" alt="Эпизод ${epNum}">
                <div class="episode-info">
                    <h4>Эпизод ${epNum}</h4>
                    <p>${episode.title || 'Без названия'}</p>
                </div>
            `;
            
            // При клике переключаем на этот эпизод
            episodeItem.addEventListener('click', () => {
                const playerIframe = document.querySelector('.player-container iframe');
                if (playerIframe) {
                    playerIframe.src = "https:" + episode.link;
                    
                    // Скроллим к плееру
                    document.getElementById('player-wrapper').scrollIntoView({ behavior: 'smooth' });
                }
            });
            
            episodeGrid.appendChild(episodeItem);
        });
        
        episodesContainer.appendChild(episodeGrid);
    }

/** 🚀 Запуск функции! */
const animeID=getAnimeIdFromUrl();

if(!animeID){
	console.error ("😢 Ошибка! Не передан ID!");
}else{
	fetchAnimeDetails(animeID);
}
});
