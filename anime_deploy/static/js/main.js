document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure styles are applied correctly after page load
    setTimeout(() => {
        // Force card styles to apply correctly
        const animeCards = document.querySelectorAll('.anime-card');
        animeCards.forEach(card => {
            card.style.background = '#1a1a1a';
            
            // Make sure genre tags are styled correctly
            const genreTags = card.querySelectorAll('.genre-tag');
            genreTags.forEach(tag => {
                tag.style.background = '#f39c12';
                tag.style.color = 'white';
                tag.style.padding = '5px 15px';
                tag.style.borderRadius = '20px';
                tag.style.display = 'block';
                tag.style.marginBottom = '8px';
                tag.style.width = 'fit-content';
            });
            
            // Make sure watch button is styled correctly
            const watchBtn = card.querySelector('.watch-btn');
            if (watchBtn) {
                watchBtn.style.display = 'block';
                watchBtn.style.padding = '10px';
                watchBtn.style.backgroundColor = '#f39c12';
                watchBtn.style.color = 'white';
                watchBtn.style.borderRadius = '25px';
                watchBtn.style.textAlign = 'center';
                watchBtn.style.marginTop = 'auto';
                watchBtn.style.width = '100%';
            }
        });
    }, 100);
    
    // Fetch anime data from API
    fetch('/api/anime/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const animeList = document.getElementById('anime_deploy-list');
            if (animeList) {
            data.forEach(anime => {
                const animeItem = document.createElement('div');
                animeItem.classList.add('anime_deploy-item');
                animeItem.innerHTML = `
                    <h2>${anime.title}</h2>
                    <p>${anime.description}</p>
                `;
                animeList.appendChild(animeItem);
            });
            }
        })
        .catch(error => {
            console.error('Error fetching anime_deploy data:', error);
        });

    // Improved gradient effect for hero section - more subtle
    const hero = document.querySelector('.hero');
    
    if (hero) {
        console.log('Hero element found, initializing improved gradient effect');
        
        // Initial position
        let mouseX = 50, mouseY = 50;
        let currentX = 50, currentY = 50;
        let rafId = null;
        let isFollowingMouse = false;
        
        // Remove any existing gradient overlay
        const existingOverlay = hero.querySelector('.hero-gradient-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create a new gradient overlay div
        const gradientOverlay = document.createElement('div');
        gradientOverlay.classList.add('hero-gradient-overlay');
        gradientOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 0;
        pointer-events: none;
            opacity: 0.9;
            transition: background 0.5s ease-out;
        background: radial-gradient(
                800px circle at 50% 50%,
                rgba(255, 107, 0, 0.35) 0%,
                rgba(255, 149, 0, 0.25) 40%,
            transparent 80%
        );
    `;
    
        // Insert before other hero content
        hero.insertBefore(gradientOverlay, hero.firstChild);
        
        // Function to update the gradient position with smooth animation
        function updateGradient() {
            // Smooth animation with easing (slower, more subtle)
            currentX += (mouseX - currentX) * 0.05;
            currentY += (mouseY - currentY) * 0.05;
            
            gradientOverlay.style.background = `radial-gradient(
                800px circle at ${currentX}% ${currentY}%,
                rgba(255, 107, 0, 0.35) 0%,
                rgba(255, 149, 0, 0.25) 40%,
            transparent 80%
        )`;
            
            // Continue animation
            rafId = requestAnimationFrame(updateGradient);
        }
        
        // Start animation loop
        rafId = requestAnimationFrame(updateGradient);
        
        // Track mouse movement only sometimes
        function handleMouseMove(e) {
            // Only follow mouse 30% of the time
            if (Math.random() > 0.7 || isFollowingMouse) {
                const rect = hero.getBoundingClientRect();
                mouseX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                mouseY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                
                // Follow mouse for a short time
                if (!isFollowingMouse) {
                    isFollowingMouse = true;
                    setTimeout(() => {
                        isFollowingMouse = false;
                    }, 2000 + Math.random() * 3000); // Follow for 2-5 seconds
                }
            }
        }
        
        // Add event listeners
    hero.addEventListener('mousemove', handleMouseMove);
    hero.addEventListener('touchmove', function(e) {
        if (e.touches && e.touches[0]) {
            const touch = e.touches[0];
            handleMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
        }, { passive: true });
        
        // Enhanced autonomous animation
        let autoAnimationActive = true;
        let angle = 0;
        let targetX = 50, targetY = 50;
        let lastTargetChange = Date.now();
        
        function updateAutonomousTarget() {
            // Change target position every 4-8 seconds
            if (Date.now() - lastTargetChange > 4000 + Math.random() * 4000) {
                // Pick a new random target
                targetX = 30 + Math.random() * 40; // Keep targets within center area (30-70%)
                targetY = 30 + Math.random() * 40;
                lastTargetChange = Date.now();
            }
        }
        
        function autoAnimate() {
            if (autoAnimationActive && !isFollowingMouse) {
                updateAutonomousTarget();
                
                // Move toward the target
                mouseX += (targetX - mouseX) * 0.02;
                mouseY += (targetY - mouseY) * 0.02;
                
                // Add subtle circular motion
                mouseX += Math.sin(angle) * 0.5;
                mouseY += Math.cos(angle) * 0.5;
                angle += 0.01;
                
                setTimeout(autoAnimate, 50);
            } else if (!autoAnimationActive && !isFollowingMouse) {
                // If not active but also not following mouse, restart
                autoAnimationActive = true;
                autoAnimate();
            }
        }
        
        // Start autonomous animation
        autoAnimate();
        
        // Temporarily stop autonomous animation when user interacts
        hero.addEventListener('mousemove', () => {
            autoAnimationActive = false;
            
            // Auto-restart animation after some time with no interaction
            clearTimeout(window.autoAnimationTimer);
            window.autoAnimationTimer = setTimeout(() => {
                if (!isFollowingMouse) {
                    autoAnimationActive = true;
                    autoAnimate();
                }
            }, 5000);
        });
        
        console.log('Improved gradient effect initialized');
    } else {
        console.warn('Hero element not found on this page');
    }

    // Populate anime cards from API data
    function populateAnimeCards() {
        fetch('/api/anime/')
            .then(response => response.json())
            .then(data => {
                // Check if we have anime sections
                const updateSection = document.querySelector('.updates .anime-list');
                const popularSection = document.querySelector('.popular-anime .anime-list');
                
                if (updateSection && data.results && data.results.length > 0) {
                    // Clear placeholder content
                    updateSection.innerHTML = '';
                    
                    // Add real anime cards
                    data.results.slice(0, 3).forEach(anime => {
                        updateSection.appendChild(createAnimeCard(anime));
                    });
                }
                
                if (popularSection && data.results && data.results.length > 0) {
                    // Clear placeholder content
                    popularSection.innerHTML = '';
                    
                    // Add real anime cards for popular section
                    data.results.slice(3, 6).forEach(anime => {
                        popularSection.appendChild(createAnimeCard(anime));
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching anime data:', error);
                // If API fails, try using test data to display cards
                createTestAnimeCards();
            });
    }
    
    // Fallback function to create test anime cards
    function createTestAnimeCards() {
        const updateSection = document.querySelector('.updates .anime-list');
        const popularSection = document.querySelector('.popular-anime .anime-list');
        
        const placeholderImage = 'https://placehold.co/200x300/1a1a1a/ff6b00?text=Аниме';
        
        const testData = [
            {
                title: "Attack on Titan",
                description: "Humans fight against giant humanoid Titans",
                poster: placeholderImage,
                genres: ["Action", "Drama"],
                rating: 9.8
            },
            {
                title: "Demon Slayer",
                description: "A boy fights demons to avenge his family",
                poster: placeholderImage,
                genres: ["Action", "Fantasy"],
                rating: 9.7
            },
            {
                title: "My Hero Academia",
                description: "A boy without powers in a superhero world",
                poster: placeholderImage,
                genres: ["Shonen", "Superpower"],
                rating: 9.5
            },
            {
                title: "One Piece",
                description: "Pirates search for the ultimate treasure",
                poster: placeholderImage,
                genres: ["Adventure", "Fantasy"],
                rating: 9.9
            },
            {
                title: "Jujutsu Kaisen",
                description: "A boy joins a school for sorcerers",
                poster: placeholderImage,
                genres: ["Action", "Horror"],
                rating: 9.6
            },
            {
                title: "Spy x Family",
                description: "A spy creates a fake family for his mission",
                poster: placeholderImage,
                genres: ["Comedy", "Action"],
                rating: 9.4
            }
        ];
        
        if (updateSection) {
            updateSection.innerHTML = '';
            testData.slice(0, 3).forEach(anime => {
                updateSection.appendChild(createAnimeCard(anime));
            });
        }
        
        if (popularSection) {
            popularSection.innerHTML = '';
            testData.slice(3, 6).forEach(anime => {
                popularSection.appendChild(createAnimeCard(anime));
            });
        }
    }
    
    // Helper function to create anime card element
    function createAnimeCard(anime) {
        const card = document.createElement('div');
        card.classList.add('anime-card');
        
        // Get data from API or use fallback
        const title = anime.title || anime.name || 'Unknown Anime';
        const description = anime.description || anime.short_description || 'Краткое описание аниме';
        let imageUrl = null;
        if (anime.poster_url && !anime.poster_url.includes('screenshots')) {
            imageUrl = anime.poster_url;
        } else if (anime.material_data && anime.material_data.poster_url) {
            imageUrl = anime.material_data.poster_url;
        } else if (anime.poster && !anime.poster.includes('screenshots')) {
            imageUrl = anime.poster;
        } else if (anime.image && !anime.image.includes('screenshots')) {
            imageUrl = anime.image;
        } else if (anime.shikimori_id) {
            setTimeout(() => {
                fetch(`https://shikimori.one/api/animes/${anime.shikimori_id}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.image && data.image.original) {
                            const img = card.querySelector('img');
                            if (img) {
                                img.src = `https://shikimori.one${data.image.original}`;
                            }
                        }
                    })
                    .catch(err => console.warn('Failed to fetch Shikimori image:', err));
            }, 100);
            imageUrl = 'https://placehold.co/200x300/1a1a1a/f39c12?text=Аниме';
        } else {
            imageUrl = 'https://placehold.co/200x300/1a1a1a/f39c12?text=Аниме';
        }
        const genres = anime.genres || anime.genreList || ['Unknown'];
        const rating = anime.rating || anime.score || '9.0';
        const id = anime.id || anime.link || '1';
        const status = anime.status || (anime.material_data && anime.material_data.anime_status) || 'ongoing';
        const statusText = status === 'released' ? 'Завершено' : 'В процессе';
        const statusClass = status === 'released' ? 'released' : 'ongoing';

        card.innerHTML = `
            <div class="anime-poster">
                <img src="${imageUrl}" alt="${title}" onerror="this.src='https://placehold.co/200x300/1a1a1a/f39c12?text=Аниме'">
                <div class="status ${statusClass}">${statusText}</div>
                <div class="rating">${rating}</div>
            </div>
            <div class="anime-info">
                <h3 class="anime-title">${title}</h3>
                <p class="anime-description">${description.substring(0, 60)}${description.length > 60 ? '...' : ''}</p>
                <div class="genres-container">
                    ${Array.isArray(genres) ? genres.slice(0, 2).map(genre => 
                        `<span class='genre-tag'>${genre}</span>`
                    ).join('') : ''}
                </div>
                <a href="/anime/${id}" class="watch-btn">Смотреть</a>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('watch-btn')) {
                window.location.href = `/anime/${id}`;
            }
        });
        card.style.cursor = 'pointer';
        return card;
    }
    
    // Call function to populate anime cards
    populateAnimeCards();
});
