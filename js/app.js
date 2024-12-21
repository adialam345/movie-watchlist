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

    getActionButtons(movie, isSearch) {
        if (isSearch) {
            const movieJSON = JSON.stringify(movie).replace(/'/g, "\\'");
            return `
                <button class="action-btn" onclick='app.addToWatched(${movieJSON})'>
                    <i class="fas fa-check"></i> Sudah Ditonton
                </button>
                <button class="action-btn" onclick="app.addToWatchlist(${movie.id})">
                    <i class="fas fa-clock"></i> Watchlist
                </button>
            `;
        } else {
            return `
                <button class="action-btn" onclick="app.removeMovie(${movie.id})">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            `;
        }
    }

    async addToWatched(movie) {
        console.log('Adding movie:', movie);
        
        try {
            const { data, error } = await window.supabase
                .from('watchlist')
                .insert([
                    { 
                        movie_id: movie.id.toString(),
                        is_watched: true,
                        title: movie.title,
                        poster_path: movie.poster_path,
                        release_date: movie.release_date
                    }
                ]);

            if (error) throw error;
            
            console.log('Insert response:', data);
            this.loadWatchedMovies();
        } catch (error) {
            console.error('Error adding movie to watched:', error);
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
            const movie = await TMDBApi.getMovieDetails(movieId);
            console.log('Adding to watchlist:', movie);
            
            const { data, error } = await window.supabase
                .from('watchlist')
                .insert([
                    { 
                        movie_id: movie.id.toString(),
                        title: movie.title,
                        poster_path: movie.poster_path || '',
                        release_date: movie.release_date || '',
                        is_watched: false
                    }
                ]);

            if (error) throw error;
            
            console.log('Insert response:', data);
            this.loadWatchlist();
        } catch (error) {
            console.error('Error adding movie to watchlist:', error);
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

    removeMovie(movieId) {
        this.watchedMovies = this.watchedMovies.filter(m => m.id !== movieId);
        this.watchlist = this.watchlist.filter(m => m.id !== movieId);
        this.saveToLocalStorage('watchedMovies', this.watchedMovies);
        this.saveToLocalStorage('watchlist', this.watchlist);
        this.showTab(document.querySelector('.tab-btn.active').dataset.tab);
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
}

// Initialize the app
const app = new MovieApp(); 