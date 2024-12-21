class MovieApp {
    constructor() {
        this.watchedMovies = JSON.parse(localStorage.getItem('watchedMovies')) || [];
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        this.searchResults = document.getElementById('searchResults');
        this.watchedMoviesContainer = document.getElementById('watchedMovies');
        this.watchlistMoviesContainer = document.getElementById('watchlistMovies');
        this.tabButtons = document.querySelectorAll('.tab-btn');

        this.addEventListeners();
        
        // Tampilkan tab pencarian saat pertama kali load
        document.querySelector('[data-tab="search"]').classList.add('active');
        document.getElementById('searchResults').classList.add('active');
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        this.searchResults = document.getElementById('searchResults');
        this.watchedMoviesContainer = document.getElementById('watchedMovies');
        this.watchlistMoviesContainer = document.getElementById('watchlistMovies');
    }

    addEventListeners() {
        // Event listener untuk tombol search
        this.searchButton.addEventListener('click', () => this.searchMovies());
        
        // Event listener untuk input field (search saat enter)
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchMovies();
            }
        });

        // Event listener untuk tab buttons
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.showTab(tabName);
            });
        });
    }

    async searchMovies() {
        const query = this.searchInput.value.trim();
        if (!query) return;

        try {
            // Tampilkan loading state
            this.searchResults.innerHTML = '<p>Mencari film...</p>';
            
            console.log('Searching for:', query);
            const movies = await TMDBApi.searchMovies(query);
            console.log('Found movies:', movies);
            
            // Tampilkan hasil pencarian
            if (movies && movies.length > 0) {
                this.displayMovies(movies, this.searchResults, true);
            } else {
                this.searchResults.innerHTML = '<p>Tidak ada film yang ditemukan</p>';
            }
        } catch (error) {
            console.error('Error in searchMovies:', error);
            this.searchResults.innerHTML = '<p>Terjadi kesalahan saat mencari film</p>';
        }
    }

    async displayMovies(movies, container, isSearch = false) {
        container.innerHTML = '';
        
        for (const movie of movies) {
            const card = document.createElement('div');
            card.className = 'movie-card';
            
            const posterPath = movie.poster_path
                ? `${IMAGE_BASE_URL}${movie.poster_path}`
                : 'https://via.placeholder.com/500x750?text=No+Poster';

            const buttons = await this.getActionButtons(movie, isSearch);

            card.innerHTML = `
                <img src="${posterPath}" alt="${movie.title}">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
                </div>
                <div class="movie-actions">
                    ${buttons}
                </div>
            `;

            container.appendChild(card);
        }
    }

    async getActionButtons(movie, isSearch) {
        if (isSearch) {
            try {
                // Tambahkan header yang benar untuk request
                const { data: watchedMovie, error: watchedError } = await window.supabase
                    .from('watchlist')
                    .select('*')
                    .eq('movie_id', movie.id.toString())
                    .eq('is_watched', true)
                    .maybeSingle(); // Gunakan maybeSingle() alih-alih single()

                const { data: watchlistMovie, error: watchlistError } = await window.supabase
                    .from('watchlist')
                    .select('*')
                    .eq('movie_id', movie.id.toString())
                    .eq('is_watched', false)
                    .maybeSingle(); // Gunakan maybeSingle() alih-alih single()

                // Handle error jika ada
                if (watchedError || watchlistError) {
                    console.error('Error checking movie status:', watchedError || watchlistError);
                    return '';
                }

                const movieJSON = JSON.stringify(movie).replace(/'/g, "\\'");
                
                if (watchedMovie) {
                    return `
                        <button class="action-btn" disabled>
                            <i class="fas fa-check"></i> Sudah Ditonton
                        </button>
                    `;
                } else if (watchlistMovie) {
                    return `
                        <button class="action-btn" disabled>
                            <i class="fas fa-clock"></i> Di Watchlist
                        </button>
                    `;
                } else {
                    return `
                        <button class="action-btn" onclick='app.addToWatched(${movieJSON})'>
                            <i class="fas fa-check"></i> Sudah Ditonton
                        </button>
                        <button class="action-btn" onclick="app.addToWatchlist(${movie.id})">
                            <i class="fas fa-clock"></i> Watchlist
                        </button>
                    `;
                }
            } catch (error) {
                console.error('Error checking movie status:', error);
                return '';
            }
        } else {
            // Kode untuk tab Watchlist dan Sudah Ditonton tetap sama
            const movieId = typeof movie.movie_id === 'string' ? movie.movie_id : movie.movie_id.toString();
            if (!movie.is_watched) {
                return `
                    <button class="action-btn" onclick="app.markAsWatched('${movieId}')">
                        <i class="fas fa-check"></i> Sudah Ditonton
                    </button>
                    <button class="action-btn" onclick="app.removeMovie('${movieId}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                `;
            } else {
                return `
                    <button class="action-btn" onclick="app.removeMovie('${movieId}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                `;
            }
        }
    }

    async addToWatched(movie) {
        try {
            // Cek apakah film sudah ada di watchlist
            const { data: watchlistMovie, error: watchlistError } = await window.supabase
                .from('watchlist')
                .select('*')
                .eq('movie_id', movie.id.toString())
                .eq('is_watched', false)
                .maybeSingle();

            if (watchlistError) throw watchlistError;

            // Cek apakah film sudah ada di watched
            const { data: watchedMovie, error: watchedError } = await window.supabase
                .from('watchlist')
                .select('*')
                .eq('movie_id', movie.id.toString())
                .eq('is_watched', true)
                .maybeSingle();

            if (watchedError) throw watchedError;

            if (watchedMovie) {
                const alert = document.createElement('div');
                alert.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ff9800;
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    z-index: 1000;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;
                alert.textContent = '⚠️ Film ini sudah ada di daftar Sudah Ditonton';
                document.body.appendChild(alert);
                
                setTimeout(() => {
                    alert.remove();
                }, 3000);
                return;
            }

            if (watchlistMovie) {
                // Update status film dari watchlist ke watched
                const { error: updateError } = await window.supabase
                    .from('watchlist')
                    .update({ is_watched: true })
                    .eq('movie_id', movie.id.toString());

                if (updateError) throw updateError;

                const alert = document.createElement('div');
                alert.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #4CAF50;
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    z-index: 1000;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;
                alert.textContent = `✅ "${movie.title}" dipindahkan ke Sudah Ditonton`;
                document.body.appendChild(alert);

                setTimeout(() => {
                    alert.remove();
                }, 3000);
            } else {
                // Tambahkan film baru ke watched
                const { error: insertError } = await window.supabase
                    .from('watchlist')
                    .insert([{
                        movie_id: movie.id.toString(),
                        title: movie.title,
                        poster_path: movie.poster_path || '',
                        release_date: movie.release_date || '',
                        is_watched: true
                    }]);

                if (insertError) throw insertError;

                const alert = document.createElement('div');
                alert.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #4CAF50;
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    z-index: 1000;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;
                alert.textContent = `✅ "${movie.title}" ditambahkan ke Sudah Ditonton`;
                document.body.appendChild(alert);

                setTimeout(() => {
                    alert.remove();
                }, 3000);
            }

            // Refresh tampilan
            this.loadWatchedMovies();
            this.loadWatchlist();
        } catch (error) {
            console.error('Error adding movie to watched:', error);
            const alert = document.createElement('div');
            alert.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #f44336;
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            alert.textContent = '❌ Gagal menambahkan film ke Sudah Ditonton';
            document.body.appendChild(alert);

            setTimeout(() => {
                alert.remove();
            }, 3000);
        }
    }

    async loadWatchedMovies() {
        console.log('Loading watched movies...');
        try {
            const { data, error } = await window.supabase
                .from('watchlist')
                .select('*')
                .eq('is_watched', true);

            if (error) throw error;

            if (data) {
                this.displayMovies(data, this.watchedMoviesContainer);
            }
        } catch (error) {
            console.error('Error loading watched movies:', error);
            this.watchedMoviesContainer.innerHTML = '<p>Error loading movies</p>';
        }
    }

    async addToWatchlist(movieId) {
        try {
            // Cek apakah film sudah ada di watched
            const { data: watchedMovie, error: watchedError } = await window.supabase
                .from('watchlist')
                .select('*')
                .eq('movie_id', movieId.toString())
                .eq('is_watched', true)
                .maybeSingle(); // Gunakan maybeSingle() alih-alih single()

            if (watchedError) throw watchedError;

            if (watchedMovie) {
                const alert = document.createElement('div');
                alert.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ff9800;
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    z-index: 1000;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;
                alert.textContent = '⚠️ Film ini sudah ada di daftar Sudah Ditonton';
                document.body.appendChild(alert);
                
                setTimeout(() => {
                    alert.remove();
                }, 3000);
                return;
            }

            // Cek apakah film sudah ada di watchlist
            const { data: existingMovie, error: existingError } = await window.supabase
                .from('watchlist')
                .select('*')
                .eq('movie_id', movieId.toString())
                .eq('is_watched', false)
                .maybeSingle();

            if (existingError) throw existingError;

            if (existingMovie) {
                const alert = document.createElement('div');
                alert.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ff9800;
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    z-index: 1000;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;
                alert.textContent = '⚠️ Film ini sudah ada di Watchlist';
                document.body.appendChild(alert);
                
                setTimeout(() => {
                    alert.remove();
                }, 3000);
                return;
            }

            const movie = await TMDBApi.getMovieDetails(movieId);
            
            const { error: insertError } = await window.supabase
                .from('watchlist')
                .insert([{ 
                    movie_id: movie.id.toString(),
                    title: movie.title,
                    poster_path: movie.poster_path || '',
                    release_date: movie.release_date || '',
                    is_watched: false
                }]);

            if (insertError) throw insertError;

            // Tampilkan alert sukses
            const alert = document.createElement('div');
            alert.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #4CAF50;
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            alert.textContent = `✅ "${movie.title}" ditambahkan ke Watchlist`;
            document.body.appendChild(alert);

            setTimeout(() => {
                alert.remove();
            }, 3000);
            
            this.loadWatchlist();
        } catch (error) {
            console.error('Error adding movie to watchlist:', error);
            // Tampilkan alert error
            const alert = document.createElement('div');
            alert.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #f44336;
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            alert.textContent = '❌ Gagal menambahkan film ke Watchlist';
            document.body.appendChild(alert);

            setTimeout(() => {
                alert.remove();
            }, 3000);
        }
    }

    async loadWatchlist() {
        console.log('Loading watchlist...');
        try {
            const { data, error } = await window.supabase
                .from('watchlist')
                .select('*')
                .eq('is_watched', false);

            if (error) throw error;

            if (data) {
                this.displayMovies(data, this.watchlistMoviesContainer);
            }
        } catch (error) {
            console.error('Error loading watchlist:', error);
        }
    }

    async removeMovie(movieId) {
        try {
            console.log('Removing movie:', movieId);
            const { error } = await window.supabase
                .from('watchlist')
                .delete()
                .eq('movie_id', movieId);

            if (error) throw error;

            // Refresh tampilan sesuai tab yang aktif
            const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
            if (activeTab === 'watched') {
                this.loadWatchedMovies();
            } else if (activeTab === 'watchlist') {
                this.loadWatchlist();
            }
        } catch (error) {
            console.error('Error removing movie:', error);
        }
    }

    saveToLocalStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    showTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Hide all content
        document.querySelectorAll('.movie-grid').forEach(grid => {
            grid.classList.remove('active');
        });

        // Show selected content
        const activeGrid = document.getElementById(`${tabName}Results`) || 
                          document.getElementById(`${tabName}Movies`);
        if (activeGrid) {
            activeGrid.classList.add('active');
        }

        // Update content if needed
        if (tabName === 'watched') {
            this.loadWatchedMovies();
        } else if (tabName === 'watchlist') {
            this.loadWatchlist();
        }
    }

    // Tambahkan method baru untuk menandai film sebagai sudah ditonton
    async markAsWatched(movieId) {
        try {
            const { data: movie } = await window.supabase
                .from('watchlist')
                .select('*')
                .eq('movie_id', movieId)
                .single();

            if (!movie) throw new Error('Movie not found');

            const { error } = await window.supabase
                .from('watchlist')
                .update({ is_watched: true })
                .eq('movie_id', movieId);

            if (error) throw error;

            // Tampilkan alert sukses
            const alert = document.createElement('div');
            alert.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #4CAF50;
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            alert.textContent = `✅ "${movie.title}" telah dipindahkan ke Sudah Ditonton`;
            document.body.appendChild(alert);

            setTimeout(() => {
                alert.remove();
            }, 3000);

            // Refresh tampilan
            this.loadWatchedMovies();
            this.loadWatchlist();
        } catch (error) {
            console.error('Error marking movie as watched:', error);
            const alert = document.createElement('div');
            alert.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #f44336;
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            alert.textContent = '❌ Gagal memperbarui status film';
            document.body.appendChild(alert);

            setTimeout(() => {
                alert.remove();
            }, 3000);
        }
    }
}

// Initialize the app
const app = new MovieApp(); 