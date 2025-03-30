Vue.component('user-stats-dashboard', {
    data() {
        return {
            stats: null,
            loading: true,
            error: null,
            chartObjects: {
                progressChart: null,
                subjectsChart: null,
                historyChart: null
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
                const response = await axios.get('/api/user/statistics');
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
            console.log("Initializing charts");
            try {
                this.initProgressChart();
                console.log("Progress chart initialized");
            } catch (error) {
                console.error("Error initializing progress chart:", error);
            }
            
            try {
                this.initSubjectsChart();
                console.log("Subjects chart initialized");
            } catch (error) {
                console.error("Error initializing subjects chart:", error);
            }
            
            try {
                this.initHistoryChart();
                console.log("History chart initialized");
            } catch (error) {
                console.error("Error initializing history chart:", error);
            }
        },
        initProgressChart() {
            if (this.chartObjects.progressChart) {
                this.chartObjects.progressChart.destroy();
            }
            
            const canvas = document.getElementById('progressChart');
            if (!canvas) {
                console.error("Canvas element 'progressChart' not found");
                return;
            }
            
            console.log("Canvas element found:", canvas);
            const ctx = canvas.getContext('2d');
            
            // Log chart data for debugging
            console.log("Chart data:", {
                correct: this.stats.total_correct,
                incorrect: this.stats.total_questions - this.stats.total_correct
            });
            
            // Create doughnut chart showing overall progress
            this.chartObjects.progressChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Correct', 'Incorrect'],
                    datasets: [{
                        data: [
                            this.stats.total_correct || 0,
                            (this.stats.total_questions - this.stats.total_correct) || 0
                        ],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(255, 99, 132, 0.7)'
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 99, 132, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
            console.log("Chart created:", this.chartObjects.progressChart);
        },
        initSubjectsChart() {
            if (this.chartObjects.subjectsChart) {
                this.chartObjects.subjectsChart.destroy();
            }
            
            if (!this.stats.subject_stats || this.stats.subject_stats.length === 0) {
                return;
            }
            
            const ctx = document.getElementById('subjectsChart').getContext('2d');
            
            // Prepare data
            const labels = this.stats.subject_stats.map(item => item.subject_name);
            const data = this.stats.subject_stats.map(item => item.percentage);
            const backgroundColors = this.stats.subject_stats.map(item => {
                const percentage = item.percentage;
                if (percentage >= 80) return 'rgba(75, 192, 192, 0.7)'; // Good
                if (percentage >= 60) return 'rgba(54, 162, 235, 0.7)'; // Okay
                if (percentage >= 40) return 'rgba(255, 206, 86, 0.7)'; // Warning
                return 'rgba(255, 99, 132, 0.7)'; // Poor
            });
            
            this.chartObjects.subjectsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Performance by Subject (%)',
                        data: data,
                        backgroundColor: backgroundColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        },
        initHistoryChart() {
            if (this.chartObjects.historyChart) {
                this.chartObjects.historyChart.destroy();
            }
            
            if (!this.stats.score_history || this.stats.score_history.length === 0) {
                return;
            }
            
            // Sort by timestamp
            const sortedHistory = [...this.stats.score_history].sort((a, b) => {
                return new Date(a.timestamp) - new Date(b.timestamp);
            });
            
            const ctx = document.getElementById('historyChart').getContext('2d');
            
            // Prepare data - last 10 attempts
            const recentHistory = sortedHistory.slice(-10);
            const labels = recentHistory.map(item => 
                `${item.subject_name.substring(0, 10)}... (${new Date(item.timestamp).toLocaleDateString()})`
            );
            const data = recentHistory.map(item => item.percentage);
            
            this.chartObjects.historyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Score Percentage',
                        data: data,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
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
            <h2 class="mb-4">My Performance Dashboard</h2>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="!stats.total_attempts" class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-bar-chart text-muted display-1"></i>
                </div>
                <h3 class="text-muted">No Quiz Attempts Yet</h3>
                <p class="text-muted mb-4">Complete some quizzes to see your performance statistics.</p>
                <button class="btn btn-primary" @click="$root.navigateTo('/user/dashboard')">
                    <i class="bi bi-book"></i> Browse Courses
                </button>
            </div>
            
            <div v-else>
                <!-- Key statistics cards -->
                <div class="row mb-4">
                    <div class="col-md-3 mb-3">
                        <div class="card text-center h-100 bg-light">
                            <div class="card-body">
                                <h5 class="card-title text-primary">Total Attempts</h5>
                                <h2 class="display-4">{{ stats.total_attempts }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card text-center h-100 bg-light">
                            <div class="card-body">
                                <h5 class="card-title text-primary">Average Score</h5>
                                <h2 class="display-4">{{ stats.average_score }}%</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card text-center h-100 bg-light">
                            <div class="card-body">
                                <h5 class="card-title text-primary">Total Correct</h5>
                                <h2 class="display-4">{{ stats.total_correct }}</h2>
                                <p class="text-muted">out of {{ stats.total_questions }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card text-center h-100" :class="stats.average_score >= 60 ? 'bg-success text-white' : 'bg-warning'">
                            <div class="card-body">
                                <h5 class="card-title">Performance</h5>
                                <h2 class="display-4">
                                    <i :class="[stats.average_score >= 80 ? 'bi-emoji-laughing' : 
                                              stats.average_score >= 60 ? 'bi-emoji-smile' : 
                                              stats.average_score >= 40 ? 'bi-emoji-neutral' : 
                                              'bi-emoji-frown']"></i>
                                </h2>
                                <p>{{ stats.average_score >= 80 ? 'Excellent!' : 
                                      stats.average_score >= 60 ? 'Good' : 
                                      stats.average_score >= 40 ? 'Fair' : 
                                      'Needs Improvement' }}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Charts -->
                <div class="row">
                    <!-- Overall Progress Chart -->
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Overall Progress</h5>
                            </div>
                            <div class="card-body">
                                <div style="height: 250px">
                                    <canvas id="progressChart"></canvas>
                                </div>
                                <div class="text-center mt-3">
                                    <h3>{{ stats.average_score }}%</h3>
                                    <p class="text-muted">Overall Accuracy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Performance by Subject -->
                    <div class="col-md-8 mb-4">
                        <div class="card h-100">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Performance by Subject</h5>
                            </div>
                            <div class="card-body">
                                <div v-if="stats.subject_stats && stats.subject_stats.length > 0" style="height: 300px">
                                    <canvas id="subjectsChart"></canvas>
                                </div>
                                <div v-else class="text-center py-5 text-muted">
                                    <p>No subject performance data available yet.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Score History Chart -->
                    <div class="col-md-12 mb-4">
                        <div class="card">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Score History (Last 10 Attempts)</h5>
                            </div>
                            <div class="card-body">
                                <div v-if="stats.score_history && stats.score_history.length > 0" style="height: 300px">
                                    <canvas id="historyChart"></canvas>
                                </div>
                                <div v-else class="text-center py-5 text-muted">
                                    <p>No score history available yet.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Attempts Table -->
                <div class="card mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Recent Quiz Attempts</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Subject</th>
                                        <th>Chapter</th>
                                        <th>Score</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, index) in stats.score_history.slice().reverse().slice(0, 5)" :key="index">
                                        <td>{{ formatDate(item.timestamp) }}</td>
                                        <td>{{ item.subject_name }}</td>
                                        <td>{{ item.chapter_name }}</td>
                                        <td>{{ item.score }} / {{ item.max_score }}</td>
                                        <td>
                                            <div class="progress" style="height: 20px">
                                                <div 
                                                    class="progress-bar" 
                                                    :class="{
                                                        'bg-success': item.percentage >= 80,
                                                        'bg-primary': item.percentage >= 60 && item.percentage < 80,
                                                        'bg-warning': item.percentage >= 40 && item.percentage < 60,
                                                        'bg-danger': item.percentage < 40
                                                    }"
                                                    role="progressbar" 
                                                    :style="{ width: item.percentage + '%' }" 
                                                    :aria-valuenow="item.percentage" 
                                                    aria-valuemin="0" 
                                                    aria-valuemax="100"
                                                >{{ item.percentage }}%</div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});