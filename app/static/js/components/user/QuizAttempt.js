// app/static/js/components/user/QuizAttempt.js
Vue.component('quiz-attempt', {
    props: {
        quizId: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            quiz: null,
            questions: [],
            currentQuestionIndex: 0,
            userAnswers: {},
            loading: true,
            error: null,
            timeLeft: 0, // in seconds
            quizStarted: false,
            quizCompleted: false,
            score: null,
            // Confirmation
            showConfirmSubmit: false,
            // Immediate feedback
            showFeedback: false,
            feedbackCorrect: false,
            feedbackMessage: ''
        };
    },
    computed: {
        currentQuestion() {
            return this.questions[this.currentQuestionIndex] || null;
        },
        formattedTimeLeft() {
            const hours = Math.floor(this.timeLeft / 3600);
            const minutes = Math.floor((this.timeLeft % 3600) / 60);
            const seconds = this.timeLeft % 60;
            
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        },
        progressPercentage() {
            return this.questions.length > 0 
                ? (this.currentQuestionIndex / this.questions.length) * 100 
                : 0;
        },
        isLastQuestion() {
            return this.currentQuestionIndex === this.questions.length - 1;
        },
        canSubmit() {
            // Check if all questions have been answered
            console.log('Checking if can submit:', Object.keys(this.userAnswers).length, '===', this.questions.length);
            return Object.keys(this.userAnswers).length >= this.questions.length;
        }

        
    },
    watch: {
        quizId: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.fetchQuizData();
                }
            }
        }
    },
    methods: {
        async fetchQuizData() {
            this.loading = true;
            try {
                const response = await axios.get(`/api/user/quiz/${this.quizId}`);
                this.quiz = response.data.quiz;
                this.questions = response.data.questions;
                
                // Reset user answers
                this.userAnswers = {};
                this.currentQuestionIndex = 0;
                this.quizStarted = false;
                this.quizCompleted = false;
                this.score = null;
                
                // Set up timer based on quiz duration
                if (this.quiz.time_duration) {
                    const [hours, minutes] = this.quiz.time_duration.split(':').map(Number);
                    this.timeLeft = (hours * 3600) + (minutes * 60);
                }
                
                this.error = null;
            } catch (error) {
                console.error('Error fetching quiz data:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    this.error = error.response.data.message;
                } else {
                    this.error = 'Failed to load quiz. Please try again.';
                }
                
                // Add a button to go back to dashboard
                setTimeout(() => {
                    if (this.error) {
                        this.$root.navigateTo('/user/dashboard');
                    }
                }, 3000);
            } finally {
                this.loading = false;
            }
        },
        startQuiz() {
            this.quizStarted = true;
            
            // Start the timer
            this.startTimer();
        },
        startTimer() {
            this.timer = setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                } else {
                    // Time's up - auto submit
                    this.submitQuiz();
                }
            }, 1000);
        },
        selectAnswer(questionId, optionIndex) {
            // Set the answer in the userAnswers object
            Vue.set(this.userAnswers, questionId, optionIndex);
            // or use this.$set(this.userAnswers, questionId, optionIndex);
            
            console.log('Selected answer:', questionId, optionIndex);
            console.log('Current answers:', this.userAnswers);
            console.log('Questions answered:', Object.keys(this.userAnswers).length, 'of', this.questions.length);
            
            // Show immediate feedback
            this.showFeedback = true;
            
            // Reset feedback after 2 seconds
            setTimeout(() => {
                this.showFeedback = false;
            }, 2000);
        },
        nextQuestion() {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
            }
        },
        previousQuestion() {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex--;
            }
        },
        openConfirmSubmit() {
            this.showConfirmSubmit = true;
        },
        closeConfirmSubmit() {
            this.showConfirmSubmit = false;
        },
        async submitQuiz() {
            // Clear the timer
            clearInterval(this.timer);
            
            // Close confirmation dialog if open
            this.showConfirmSubmit = false;
            
            this.loading = true;
            try {
                // Submit answers to the server
                const response = await axios.post(`/api/user/quiz/${this.quizId}/submit`, {
                    answers: this.userAnswers
                });
                
                // Show score
                this.score = response.data.score;
                this.quizCompleted = true;
            } catch (error) {
                console.error('Error submitting quiz:', error);
                this.error = 'Failed to submit quiz. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        finishQuiz() {
            // Navigate back to dashboard
            this.$root.navigateTo('/user/dashboard');
        },
        formatDate(dateString) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }
    },
    beforeDestroy() {
        // Clear the timer when component is destroyed
        if (this.timer) {
            clearInterval(this.timer);
        }
    },
    template: `
        <div>
            <div v-if="error" class="alert alert-danger text-center">
                <h3><i class="bi bi-exclamation-triangle"></i> {{ error }}</h3>
                <p class="mt-3">Redirecting back to dashboard...</p>
            </div>
            
            <div v-if="loading && !quizCompleted" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <!-- Quiz information and start screen -->
            <div v-else-if="!quizStarted && !quizCompleted" class="card">
                <div class="card-header bg-primary text-white">
                    <h3 class="mb-0">Quiz: {{ formatDate(quiz.date_of_quiz) }}</h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <h4 class="alert-heading">Quiz Instructions</h4>
                        <p>Please read the following instructions before starting the quiz:</p>
                        <ul>
                            <li>The quiz has {{ questions.length }} multiple-choice questions</li>
                            <li>You have {{ quiz.time_duration }} (hh:mm) to complete the quiz</li>
                            <li>Once started, the timer cannot be paused</li>
                            <li>You can navigate between questions using the Next and Previous buttons</li>
                            <li>Your answers are saved as you progress</li>
                            <li>You can submit your quiz at any time by clicking the Submit button</li>
                        </ul>
                        <p v-if="quiz.remarks" class="mb-0"><strong>Additional instructions:</strong> {{ quiz.remarks }}</p>
                    </div>
                    
                    <div class="text-center mt-4">
                        <button class="btn btn-lg btn-success" @click="startQuiz">
                            <i class="bi bi-play-circle"></i> Start Quiz
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Quiz in progress -->
            <div v-else-if="quizStarted && !quizCompleted && currentQuestion">
                <!-- Timer and progress bar -->
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <span class="badge bg-primary p-2">Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-clock me-1"></i>
                        <span :class="{'text-danger': timeLeft < 60}" class="fw-bold">{{ formattedTimeLeft }}</span>
                    </div>
                </div>
                
                <div class="progress mb-4" style="height: 10px">
                    <div class="progress-bar" role="progressbar" :style="{ width: progressPercentage + '%' }" 
                        :aria-valuenow="progressPercentage" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                
                <!-- Current question -->
                <div class="card mb-4">
                    <div class="card-header bg-light">
                        <h4 class="mb-0">{{ currentQuestion.question_statement }}</h4>
                    </div>
                    <div class="card-body">
                        <div class="list-group">
                            <button 
                                v-for="(option, index) in currentQuestion.options" 
                                :key="index"
                                class="list-group-item list-group-item-action d-flex align-items-center py-3"
                                :class="{ 'active': userAnswers[currentQuestion.id] === index + 1 }"
                                @click="selectAnswer(currentQuestion.id, index + 1)"
                            >
                                <div class="me-3">
                                    <span class="badge rounded-pill" :class="userAnswers[currentQuestion.id] === index + 1 ? 'bg-light text-primary' : 'bg-primary'">
                                        {{ ['A', 'B', 'C', 'D'][index] }}
                                    </span>
                                </div>
                                <div>{{ option }}</div>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Immediate feedback toast -->
                <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5">
                    <div class="toast show" v-if="showFeedback" :class="feedbackCorrect ? 'bg-success text-white' : 'bg-light'">
                        <div class="toast-header">
                            <strong class="me-auto">{{ feedbackCorrect ? 'Correct!' : 'Answer Recorded' }}</strong>
                            <button type="button" class="btn-close" @click="showFeedback = false"></button>
                        </div>
                        <div class="toast-body">
                            {{ feedbackMessage || 'Your answer has been saved. Continue to the next question.' }}
                        </div>
                    </div>
                </div>
                
                <!-- Navigation buttons -->
                <div class="d-flex justify-content-between">
                    <button class="btn btn-outline-primary" @click="previousQuestion" :disabled="currentQuestionIndex === 0">
                        <i class="bi bi-arrow-left"></i> Previous
                    </button>
                    
                    <div>
                        <button class="btn btn-danger me-2" @click="openConfirmSubmit" :disabled="!canSubmit">
                            <i class="bi bi-check-circle"></i> Submit Quiz
                        </button>
                        
                        <button v-if="!isLastQuestion" class="btn btn-primary" @click="nextQuestion">
                            Next <i class="bi bi-arrow-right"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Submit Confirmation Modal -->
                <div v-if="showConfirmSubmit" class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-warning">
                                <h5 class="modal-title">Confirm Submission</h5>
                                <button type="button" class="btn-close" @click="closeConfirmSubmit"></button>
                            </div>
                            <div class="modal-body">
                                <p>Are you sure you want to submit this quiz?</p>
                                <p v-if="!canSubmit" class="text-danger">
                                    <strong>Warning:</strong> You haven't answered all questions yet.
                                </p>
                                <p v-else>Once submitted, you won't be able to change your answers.</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" @click="closeConfirmSubmit">Cancel</button>
                                <button type="button" class="btn btn-danger" @click="submitQuiz">Submit Quiz</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quiz completion screen -->
            <div v-else-if="quizCompleted && score" class="card">
                <div class="card-header bg-success text-white">
                    <h3 class="mb-0">Quiz Completed!</h3>
                </div>
                <div class="card-body text-center">
                    <div class="display-1 mb-4">
                        {{ Math.round((score.total_scored / score.max_score) * 100) }}%
                    </div>
                    
                    <div class="mb-4">
                        <h4>Your Score: {{ score.total_scored }} / {{ score.max_score }}</h4>
                        <p class="text-muted">Completed on {{ formatDate(score.time_stamp_of_attempt) }}</p>
                    </div>
                    
                    <div class="d-flex justify-content-center">
                        <button class="btn btn-primary btn-lg" @click="finishQuiz">
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
});