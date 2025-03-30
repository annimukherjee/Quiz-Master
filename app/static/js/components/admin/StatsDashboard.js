// app/static/js/components/admin/StatsDashboard.js
Vue.component('admin-stats-dashboard', {
    data() {
        return {
            stats: null,
            loading: true,
            error: null,
            chartObjects: {
                subjectsChart: null,
                quizAttemptsChart: null,
                scoresChart: null
            }
        };
    },
    created() {
        this.fetchStatistics();
    },
    updated() {
        // Re-initialize charts whenever the component updates
        // This helps when DOM elements might not be available immediately
        this.$nextTick(() => {
            if (this.stats && !this.loading) {
                this.initCharts();
            }
        });
    },
    
    methods: {
        async fetchStatistics() {
            this.loading = true;
            try {
                const response = await axios.get('/api/admin/statistics');
                this.stats = response.data;
                this.error = null;
                
                // Initialize charts after data is loaded
                this.$nextTick(() => {
                    this.initCharts();
                });
            } catch (error) {
                console.error('Error fetching statistics:', error);
                this.error = 'Failed to load statistics. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        initCharts() {
            this.initSubjectsChart();
            this.initQuizAttemptsChart();
            this.initScoresChart();
        },
        initSubjectsChart() {
            if (this.chartObjects.subjectsChart) {
                this.chartObjects.subjectsChart.destroy();
            }
            
            const ctx = document.getElementById('subjectsChart').getContext('2d');
            
            // Prepare data
            const labels = this.stats.subject_stats.map(item => item.subject_name);
            const chapterData = this.stats.subject_stats.map(item => item.chapter_count);
            const quizData = this.stats.subject_stats.map(item => item.quiz_count);
            
            this.chartObjects.subjectsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Chapters',
                            data: chapterData,
                            backgroundColor: 'rgba(54, 162, 235, 0.7)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Quizzes',
                            data: quizData,
                            backgroundColor: 'rgba(255, 99, 132, 0.7)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        },
        initQuizAttemptsChart() {
            if (this.chartObjects.quizAttemptsChart) {
                this.chartObjects.quizAttemptsChart.destroy();
            }
            
            if (!this.stats.top_quizzes || this.stats.top_quizzes.length === 0) {
                return;
            }
            
            const ctx = document.getElementById('quizAttemptsChart').getContext('2d');
            
            // Prepare data
            const labels = this.stats.top_quizzes.map(item => 
                `${item.subject_name} - ${item.chapter_name} (${new Date(item.quiz_date).toLocaleDateString()})`
            );
            const data = this.stats.top_quizzes.map(item => item.attempt_count);
            
            this.chartObjects.quizAttemptsChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        title: {
                            display: true,
                            text: 'Quiz Attempts Distribution'
                        }
                    }
                }
            });
        },
        initScoresChart() {
            if (this.chartObjects.scoresChart) {
                this.chartObjects.scoresChart.destroy();
            }
            
            if (!this.stats.top_quizzes || this.stats.top_quizzes.length === 0) {
                return;
            }
            
            const ctx = document.getElementById('scoresChart').getContext('2d');
            
            // Prepare data
            const labels = this.stats.top_quizzes.map(item => 
                `${item.subject_name} - ${item.chapter_name}`
            );
            const data = this.stats.top_quizzes.map(item => item.avg_score);
            
            this.chartObjects.scoresChart = new Chart(ctx, {
                type: 'horizontalBar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Average Score (%)',
                        data: data,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Average Scores by Quiz'
                        }
                    }
                }
            });
        },
        formatDate(dateString) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }
    },
    beforeDestroy() {
        // Clean up chart instances when component is destroyed
        Object.values(this.chartObjects).forEach(chart => {
            if (chart) chart.destroy();
        });
    },
    template: `
        <div>
            <h2 class="mb-4">Admin Statistics Dashboard</h2>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else>
                <!-- Key statistics cards -->
                <div class="row mb-4">
                    <div class="col-md-4 col-lg-2 mb-3">
                        <div class="card text-center h-100 bg-light">
                            <div class="card-body">
                                <h5 class="card-title text-primary">Subjects</h5>
                                <h2 class="display-4">{{ stats.counts.subjects }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 col-lg-2 mb-3">
                        <div class="card text-center h-100 bg-light">
                            <div class="card-body">
                                <h5 class="card-title text-primary">Chapters</h5>
                                <h2 class="display-4">{{ stats.counts.chapters }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 col-lg-2 mb-3">
                        <div class="card text-center h-100 bg-light">
                            <div class="card-body">
                                <h5 class="card-title text-primary">Quizzes</h5>
                                <h2 class="display-4">{{ stats.counts.quizzes }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 col-lg-2 mb-3">
                        <div class="card text-center h-100 bg-light">
                            <div class="card-body">
                                <h5 class="card-title text-primary">Questions</h5>
                                <h2 class="display-4">{{ stats.counts.questions }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 col-lg-2 mb-3">
                        <div class="card text-center h-100 bg-light">
                            <div class="card-body">
                                <h5 class="card-title text-primary">Users</h5>
                                <h2 class="display-4">{{ stats.counts.users }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 col-lg-2 mb-3">
                        <div class="card text-center h-100 bg-light">
                            <div class="card-body">
                                <h5 class="card-title text-primary">Quiz Attempts</h5>
                                <h2 class="display-4">{{ stats.counts.attempts }}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Charts -->
                <div class="row">
                    <!-- Subjects, Chapters, and Quizzes chart -->
                    <div class="col-lg-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Subjects Overview</h5>
                            </div>
                            <div class="card-body">
                                <div style="height: 300px">
                                    <canvas id="subjectsChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Quiz Attempts Distribution chart -->
                    <div class="col-lg-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Quiz Attempts Distribution</h5>
                            </div>
                            <div class="card-body">
                                <div v-if="stats.top_quizzes && stats.top_quizzes.length > 0" style="height: 300px">
                                    <canvas id="quizAttemptsChart"></canvas>
                                </div>
                                <div v-else class="text-center py-5 text-muted">
                                    <i class="bi bi-info-circle display-1"></i>
                                    <p class="mt-3">No quiz attempts recorded yet.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Users -->
                    <div class="col-lg-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Recent Users</h5>
                            </div>
                            <div class="card-body">
                                <div v-if="stats.recent_users.length > 0">
                                    <ul class="list-group">
                                        <li v-for="user in stats.recent_users" :key="user.id" class="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{{ user.full_name }}</strong>
                                                <div class="text-muted small">{{ user.username }}</div>
                                            </div>
                                            <span v-if="user.dob" class="badge bg-secondary">
                                                DOB: {{ formatDate(user.dob) }}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                <div v-else class="text-center py-5 text-muted">
                                    <p>No users registered yet.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Average Scores by Quiz -->
                    <div class="col-lg-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Average Scores by Quiz</h5>
                            </div>
                            <div class="card-body">
                                <div v-if="stats.top_quizzes && stats.top_quizzes.length > 0" style="height: 300px">
                                    <canvas id="scoresChart"></canvas>
                                </div>
                                <div v-else class="text-center py-5 text-muted">
                                    <i class="bi bi-info-circle display-1"></i>
                                    <p class="mt-3">No quiz scores recorded yet.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});