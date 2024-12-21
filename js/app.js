class MovieApp {
    constructor() {
        this.watchedMovies = JSON.parse(localStorage.getItem('watchedMovies')) || [];
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        
        this.initializeElements();
        this.addEventListeners();
        
        // Tampilkan tab pencarian saat pertama kali load
        document.querySelector('[data-tab="search"]').classList.add('active');
        document.getElementById('searchResults').classList.add('active');
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        this.searchResults = document.getElementById('searchResults');
        this.watchedMoviesElement = document.getElementById('watchedMovies');
        this.watchlistMoviesElement = document.getElementById('watchlistMovies');
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
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
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

    displayMovies(movies, container, isSearch = false) {
        container.innerHTML = '';
        
        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            
            const posterPath = movie.poster_path
                ? `${IMAGE_BASE_URL}${movie.poster_path}`
                : 'https://via.placeholder.com/500x750?text=No+Poster';

            card.innerHTML = `
                <img src="${posterPath}" alt="${movie.title}">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
                </div>
                <div class="movie-actions">
                    ${this.getActionButtons(movie, isSearch)}
                </div>
            `;

            container.appendChild(card);
        });
    }

    getActionButtons(movie, isSearch) {
        if (isSearch) {
            return `
                <button class="action-btn" onclick="app.addToWatched(${movie.id})">
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

    async addToWatched(movieId) {
        const movie = await TMDBApi.getMovieDetails(movieId);
        if (!this.watchedMovies.find(m => m.id === movie.id)) {
            this.watchedMovies.push(movie);
            this.saveToLocalStorage('watchedMovies', this.watchedMovies);
            this.showTab('watched');
        }
    }

    async addToWatchlist(movieId) {
        const movie = await TMDBApi.getMovieDetails(movieId);
        if (!this.watchlist.find(m => m.id === movie.id)) {
            this.watchlist.push(movie);
            this.saveToLocalStorage('watchlist', this.watchlist);
            this.showTab('watchlist');
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
            this.displayMovies(this.watchedMovies, this.watchedMoviesElement);
        } else if (tabName === 'watchlist') {
            this.displayMovies(this.watchlist, this.watchlistMoviesElement);
        }
    }
}

// Initialize the app
const app = new MovieApp(); 