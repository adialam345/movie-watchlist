class MovieApp {
    constructor() {
        this.initializeElements();
        this.addEventListeners();
        this.checkAuth();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        this.searchResults = document.getElementById('searchResults');
        this.watchedMoviesElement = document.getElementById('watchedMovies');
        this.watchlistMoviesElement = document.getElementById('watchlistMovies');
        this.loginButton = document.getElementById('loginButton');
        this.logoutButton = document.getElementById('logoutButton');
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

        this.loginButton.addEventListener('click', () => this.handleLogin());
        this.logoutButton.addEventListener('click', () => this.handleLogout());
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

    async checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            this.handleAuthSuccess(user);
        }
    }

    async handleLogin() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google'
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in:', error.message);
        }
    }

    async handleLogout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            this.loginButton.style.display = 'block';
            this.logoutButton.style.display = 'none';
            this.watchedMovies = [];
            this.watchlist = [];
            this.showTab('search');
        } catch (error) {
            console.error('Error logging out:', error.message);
        }
    }

    handleAuthSuccess(user) {
        this.loginButton.style.display = 'none';
        this.logoutButton.style.display = 'block';
        this.loadUserData();
    }

    async loadUserData() {
        try {
            // Load watched movies
            let { data: watched, error } = await supabase
                .from('watched_movies')
                .select('movie_data')
                .eq('user_id', (await supabase.auth.getUser()).data.user.id);
            
            if (error) throw error;
            this.watchedMovies = watched.map(w => w.movie_data);

            // Load watchlist
            let { data: watchlist, error: watchlistError } = await supabase
                .from('watchlist')
                .select('movie_data')
                .eq('user_id', (await supabase.auth.getUser()).data.user.id);
            
            if (watchlistError) throw watchlistError;
            this.watchlist = watchlist.map(w => w.movie_data);

            this.showTab('watched');
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async addToWatched(movieId) {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) {
                alert('Please login first');
                return;
            }

            const movie = await TMDBApi.getMovieDetails(movieId);
            const { data, error } = await supabase
                .from('watched_movies')
                .insert([
                    {
                        user_id: user.id,
                        movie_id: movieId,
                        movie_data: movie
                    }
                ]);

            if (error) throw error;
            this.watchedMovies.push(movie);
            this.showTab('watched');
        } catch (error) {
            console.error('Error adding to watched:', error);
        }
    }

    async addToWatchlist(movieId) {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) {
                alert('Please login first');
                return;
            }

            const movie = await TMDBApi.getMovieDetails(movieId);
            const { data, error } = await supabase
                .from('watchlist')
                .insert([
                    {
                        user_id: user.id,
                        movie_id: movieId,
                        movie_data: movie
                    }
                ]);

            if (error) throw error;
            this.watchlist.push(movie);
            this.showTab('watchlist');
        } catch (error) {
            console.error('Error adding to watchlist:', error);
        }
    }

    async removeMovie(movieId, listType) {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) return;

            const table = listType === 'watched' ? 'watched_movies' : 'watchlist';
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('user_id', user.id)
                .eq('movie_id', movieId);

            if (error) throw error;

            if (listType === 'watched') {
                this.watchedMovies = this.watchedMovies.filter(m => m.id !== movieId);
            } else {
                this.watchlist = this.watchlist.filter(m => m.id !== movieId);
            }
            
            this.showTab(listType);
        } catch (error) {
            console.error('Error removing movie:', error);
        }
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

// Initialize auth listener
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        app.handleAuthSuccess(session.user);
    }
});

const app = new MovieApp(); 