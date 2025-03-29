// app/static/js/components/user/ScoreList.js
Vue.component('score-list', {
    data() {
        return {
            scores: [],
            loading: false,
            error: null
        };
    },
    created() {
        this.fetchScores();
    },
    computed: {
        sortedScores() {
            return [...this.scores].sort((a, b) => {
                return new Date(b.time_stamp_of_attempt) - new Date(a.time_stamp_of_attempt);
            });
        }
    },
    methods: {
        async fetchScores() {
            this.loading = true;
            try {
                const response = await axios.get('/api/user/scores');
                this.scores = response.data.scores;
                this.error = null;
            } catch (error) {
                console.error('Error fetching scores:', error);
                this.error = 'Failed to load your scores. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        formatDate(dateString) {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        },
        getScoreClass(score) {
            const percentage = (score.total_scored / score.max_score) * 100;
            if (percentage >= 80) return 'success';
            if (percentage >= 60) return 'primary';
            if (percentage >= 40) return 'warning';
            return 'danger';
        }
    },
    template: `
        <div>
            <h2 class="mb-4">My Quiz Scores</h2>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="scores.length === 0" class="alert alert-info">
                <h5>No quiz attempts yet</h5>
                <p>You haven't attempted any quizzes yet. Start taking quizzes to see your scores here.</p>
                <button class="btn btn-primary" @click="$root.navigateTo('/user/dashboard')">
                    <i class="bi bi-book"></i> Browse Courses
                </button>
            </div>
            
            <div v-else>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Date</th>
                                <th>Subject</th>
                                <th>Chapter</th>
                                <th>Quiz</th>
                                <th>Score</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="score in sortedScores" :key="score.id">
                                <td>{{ formatDate(score.time_stamp_of_attempt) }}</td>
                                <td>{{ score.subject.name }}</td>
                                <td>{{ score.chapter.name }}</td>
                                <td>{{ formatDate(score.quiz.date_of_quiz) }}</td>
                                <td>{{ score.total_scored }} / {{ score.max_score }}</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="progress flex-grow-1 me-2" style="height: 10px">
                                            <div 
                                                class="progress-bar"
                                                :class="'bg-' + getScoreClass(score)"
                                                role="progressbar" 
                                                :style="{ width: (score.total_scored / score.max_score * 100) + '%' }" 
                                                :aria-valuenow="score.total_scored" 
                                                :aria-valuemin="0" 
                                                :aria-valuemax="score.max_score"
                                            ></div>
                                        </div>
                                        <span class="badge" :class="'bg-' + getScoreClass(score)">
                                            {{ Math.round((score.total_scored / score.max_score) * 100) }}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `
});