// app/static/js/components/user/QuizList.js
Vue.component('quiz-list', {
    props: {
        chapterId: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            quizzes: [],
            chapter: null,
            subject: null,
            loading: false,
            error: null,
            previousScores: {},
            now: new Date()
        };
    },
    computed: {
        sortedQuizzes() {
            return [...this.quizzes].sort((a, b) => {
                return new Date(a.date_of_quiz) - new Date(b.date_of_quiz);
            });
        }
    },
    watch: {
        chapterId: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.fetchChapterAndSubject();
                    this.fetchQuizzes();
                    this.fetchPreviousScores();
                }
            }
        }
    },
    created() {
        // Update current time every second
        this.timer = setInterval(() => {
            this.now = new Date();
        }, 1000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
    methods: {
        async fetchChapterAndSubject() {
            try {
                const response = await axios.get(`/api/user/chapters/${this.chapterId}`);
                this.chapter = response.data.chapter;
                
                if (this.chapter && this.chapter.subject_id) {
                    const subjectResponse = await axios.get(`/api/user/subjects/${this.chapter.subject_id}`);
                    this.subject = subjectResponse.data.subject;
                }
            } catch (error) {
                console.error('Error fetching chapter/subject details:', error);
                this.error = 'Failed to load chapter details. Please try again.';
            }
        },
        async fetchQuizzes() {
            this.loading = true;
            try {
                const response = await axios.get(`/api/user/quizzes?chapter_id=${this.chapterId}`);
                this.quizzes = response.data.quizzes;
                this.error = null;
            } catch (error) {
                console.error('Error fetching quizzes:', error);
                this.error = 'Failed to load quizzes. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        async fetchPreviousScores() {
            try {
                const response = await axios.get('/api/user/scores');
                const scores = response.data.scores;
                
                // Create a map of quiz_id to score details
                this.previousScores = {};
                scores.forEach(score => {
                    this.previousScores[score.quiz_id] = {
                        score: score.total_scored,
                        maxScore: score.max_score,
                        date: new Date(score.time_stamp_of_attempt)
                    };
                });
            } catch (error) {
                console.error('Error fetching scores:', error);
            }
        },
        formatDate(dateString) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        },
        formatTime(timeString) {
            // Convert HH:MM to readable format
            const [hours, minutes] = timeString.split(':');
            let formatted = '';
            if (parseInt(hours) > 0) {
                formatted += parseInt(hours) + (parseInt(hours) === 1 ? ' hour ' : ' hours ');
            }
            if (parseInt(minutes) > 0) {
                formatted += parseInt(minutes) + (parseInt(minutes) === 1 ? ' minute' : ' minutes');
            }
            return formatted.trim();
        },
        isQuizAvailable(quiz) {
            const quizDate = new Date(quiz.date_of_quiz);
            return quizDate <= this.now;
        },
        isQuizTaken(quizId) {
            return this.previousScores.hasOwnProperty(quizId);
        },
        startQuiz(quizId) {
            this.$emit('start-quiz', quizId);
        }
    },
    template: `
        <div>
            <h2 class="mb-2">Quizzes</h2>
            <h5 v-if="chapter && subject" class="text-muted mb-4">{{ subject.name }} / {{ chapter.name }}</h5>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="quizzes.length === 0" class="alert alert-info">
                No quizzes are available for this chapter yet.
            </div>
            
            <div v-else>
                <div class="card mb-4" v-for="quiz in sortedQuizzes" :key="quiz.id">
                    <div class="card-header d-flex justify-content-between align-items-center" 
                         :class="{'bg-light': !isQuizAvailable(quiz), 'bg-primary text-white': isQuizAvailable(quiz)}">
                        <h5 class="mb-0">Quiz: {{ formatDate(quiz.date_of_quiz) }}</h5>
                        <span class="badge rounded-pill" 
                              :class="{'bg-success': isQuizTaken(quiz.id), 'bg-warning': !isQuizTaken(quiz.id) && isQuizAvailable(quiz), 'bg-secondary': !isQuizAvailable(quiz)}">
                            {{ isQuizTaken(quiz.id) ? 'Completed' : (isQuizAvailable(quiz) ? 'Available' : 'Upcoming') }}
                        </span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <p v-if="quiz.remarks"><strong>Instructions:</strong> {{ quiz.remarks }}</p>
                                <p><strong>Duration:</strong> {{ formatTime(quiz.time_duration) }}</p>
                                
                                <div v-if="isQuizTaken(quiz.id)" class="alert alert-success">
                                    <strong>Your Score:</strong> {{ previousScores[quiz.id].score }} / {{ previousScores[quiz.id].maxScore }}
                                    ({{ Math.round((previousScores[quiz.id].score / previousScores[quiz.id].maxScore) * 100) }}%)
                                    <div><small>Completed on {{ formatDate(previousScores[quiz.id].date) }}</small></div>
                                </div>
                            </div>
                            <div class="col-md-4 text-end">
                                <button 
                                    v-if="isQuizAvailable(quiz)"
                                    class="btn btn-lg" 
                                    :class="{'btn-success': !isQuizTaken(quiz.id), 'btn-outline-success': isQuizTaken(quiz.id)}"
                                    @click="startQuiz(quiz.id)"
                                >
                                    {{ isQuizTaken(quiz.id) ? 'Retake Quiz' : 'Start Quiz' }}
                                </button>
                                <div v-else class="text-muted">
                                    <i class="bi bi-clock"></i> Available on {{ formatDate(quiz.date_of_quiz) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});