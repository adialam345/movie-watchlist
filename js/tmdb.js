const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNDJiMDc0YWIyMTQ1ZDczYzIxMmE3Mzk3NDZhMDBiMiIsIm5iZiI6MTczNDgwOTE5Ny43NDg5OTk4LCJzdWIiOiI2NzY3MTY2ZDkxOTI4N2VmNTM5MTBmMWEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Xy6_62nR4EKspCeidmM9YcD1hsK5bX8LS4TNwTM8_tY';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

class TMDBApi {
    static async searchMovies(query) {
        try {
            console.log('Making API request...');
            const response = await fetch(
                `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=id-ID`,
                {
                    headers: {
                        'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API Response:', data);
            return data.results;
        } catch (error) {
            console.error('Error searching movies:', error);
            throw error;
        }
    }

    static async getMovieDetails(movieId) {
        try {
            const response = await fetch(
                `${BASE_URL}/movie/${movieId}?language=id-ID`,
                {
                    headers: {
                        'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error getting movie details:', error);
            throw error;
        }
    }
} 