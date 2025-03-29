// app/static/js/components/admin/QuizManager.js
Vue.component('quiz-manager', {
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
            // Form fields
            showForm: false,
            editMode: false,
            currentQuiz: {
                id: null,
                chapter_id: this.chapterId,
                date_of_quiz: new Date().toISOString().split('T')[0], // Default to today
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 7 days later
                time_duration: '01:00', // Default to 1 hour
                remarks: ''
            },
            // Confirmation
            showDeleteConfirm: false,
            quizToDelete: null
        };
    },
    watch: {
        chapterId: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.fetchChapterAndSubject();
                    this.fetchQuizzes();
                    this.currentQuiz.chapter_id = newVal;
                }
            }
        }
    },
    methods: {
        async fetchChapterAndSubject() {
            try {
                const response = await axios.get(`/api/admin/chapters/${this.chapterId}`);
                this.chapter = response.data.chapter;
                
                if (this.chapter && this.chapter.subject_id) {
                    const subjectResponse = await axios.get(`/api/admin/subjects/${this.chapter.subject_id}`);
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
                const response = await axios.get(`/api/admin/quizzes?chapter_id=${this.chapterId}`);
                this.quizzes = response.data.quizzes;
                this.error = null;
            } catch (error) {
                console.error('Error fetching quizzes:', error);
                this.error = 'Failed to load quizzes. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        resetForm() {
            this.currentQuiz = {
                id: null,
                chapter_id: this.chapterId,
                date_of_quiz: new Date().toISOString().split('T')[0],
                time_duration: '01:00',
                remarks: ''
            };
            this.editMode = false;
            this.showForm = false;
        },
        openCreateForm() {
            this.resetForm();
            this.showForm = true;
        },
        openEditForm(quiz) {
            this.currentQuiz = { ...quiz };
            this.editMode = true;
            this.showForm = true;
        },
        openDeleteConfirm(quiz) {
            this.quizToDelete = quiz;
            this.showDeleteConfirm = true;
        },
        validateQuiz() {
            if (!this.currentQuiz.date_of_quiz) {
                this.error = 'Quiz date is required';
                return false;
            }
            
            // Validate time duration format (HH:MM)
            const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timePattern.test(this.currentQuiz.time_duration)) {
                this.error = 'Time duration must be in HH:MM format';
                return false;
            }
            
            return true;
        },
        async saveQuiz() {
            try {
                if (!this.validateQuiz()) {
                    return;
                }
                
                let response;
                if (this.editMode) {
                    // Update existing quiz
                    response = await axios.put(`/api/admin/quizzes/${this.currentQuiz.id}`, this.currentQuiz);
                    
                    // Update quiz in the list
                    const index = this.quizzes.findIndex(q => q.id === this.currentQuiz.id);
                    if (index !== -1) {
                        this.quizzes.splice(index, 1, response.data.quiz);
                    }
                } else {
                    // Create new quiz
                    response = await axios.post('/api/admin/quizzes', this.currentQuiz);
                    this.quizzes.push(response.data.quiz);
                }
                
                this.resetForm();
                this.error = null;
            } catch (error) {
                console.error('Error saving quiz:', error);
                this.error = 'Failed to save quiz. Please try again.';
            }
        },
        async deleteQuiz() {
            if (!this.quizToDelete) return;
            
            try {
                await axios.delete(`/api/admin/quizzes/${this.quizToDelete.id}`);
                
                // Remove from the list
                const index = this.quizzes.findIndex(q => q.id === this.quizToDelete.id);
                if (index !== -1) {
                    this.quizzes.splice(index, 1);
                }
                
                this.showDeleteConfirm = false;
                this.quizToDelete = null;
                this.error = null;
            } catch (error) {
                console.error('Error deleting quiz:', error);
                this.error = 'Failed to delete quiz. Please try again.';
            }
        },
        selectQuiz(quiz) {
            // Format the date nicely for display
            const formattedDate = this.formatDate(quiz.date_of_quiz);
            this.$emit('quiz-selected', quiz.id, formattedDate);
        },
        formatDate(dateString) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }
    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Quizzes</h2>
                    <h5 v-if="chapter && subject" class="text-muted">
                        Subject: {{ subject.name }} / Chapter: {{ chapter.name }}
                    </h5>
                </div>
                <div>
                    <button class="btn btn-outline-primary me-2" @click="$root.navigateTo('/admin/dashboard')">
                        <i class="bi bi-arrow-left"></i> Back to Chapters
                    </button>
                    <button class="btn btn-success" @click="openCreateForm">
                        <i class="bi bi-plus-circle"></i> Add Quiz
                    </button>
                </div>
            </div>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <!-- Quiz Form -->
            <div v-if="showForm" class="card mb-4">
                <div class="card-header bg-primary text-white">
                    {{ editMode ? 'Edit Quiz' : 'Create New Quiz' }}
                </div>
                <div class="card-body">
                    <form @submit.prevent="saveQuiz">
                        <div class="mb-3">
                            <label for="quizDate" class="form-label">Start Date *</label>
                            <input 
                                type="date" 
                                class="form-control" 
                                id="quizDate" 
                                v-model="currentQuiz.date_of_quiz" 
                                required
                            >
                        </div>
                        <div class="mb-3">
                            <label for="quizEndDate" class="form-label">End Date *</label>
                            <input 
                                type="date" 
                                class="form-control" 
                                id="quizEndDate" 
                                v-model="currentQuiz.end_date" 
                                required
                            >
                            <div class="form-text">Quizzes cannot be started after this date</div>
                        </div>
                        <div class="mb-3">
                            <label for="timeDuration" class="form-label">Time Duration (HH:MM) *</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                id="timeDuration" 
                                v-model="currentQuiz.time_duration" 
                                placeholder="01:00"
                                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                                required
                            >
                            <div class="form-text">Format: HH:MM (e.g., 01:30 for 1 hour and 30 minutes)</div>
                        </div>
                        <div class="mb-3">
                            <label for="quizRemarks" class="form-label">Remarks</label>
                            <textarea 
                                class="form-control" 
                                id="quizRemarks" 
                                v-model="currentQuiz.remarks" 
                                rows="3"
                            ></textarea>
                        </div>
                        <div class="d-flex justify-content-end">
                            <button type="button" class="btn btn-secondary me-2" @click="resetForm">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Delete Confirmation Modal -->
            <div v-if="showDeleteConfirm" class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Confirm Delete</h5>
                            <button type="button" class="btn-close" @click="showDeleteConfirm = false"></button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete this quiz scheduled for: <strong>{{ formatDate(quizToDelete?.date_of_quiz) }}</strong>?</p>
                            <p class="text-danger">This will also delete all questions and scores associated with this quiz!</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
                            <button type="button" class="btn btn-danger" @click="deleteQuiz">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quiz List -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="quizzes.length === 0" class="alert alert-info">
                No quizzes available for this chapter. Create your first quiz to get started.
            </div>
            
            <div v-else class="row">
                <div class="col-md-6 col-lg-4 mb-4" v-for="quiz in quizzes" :key="quiz.id">
                    <div class="card h-100">
                        <div class="card-header bg-light">
                            <h5 class="card-title mb-0">Quiz on {{ formatDate(quiz.date_of_quiz) }}</h5>
                        </div>
                        <div class="card-body">
                            <p class="card-text"><strong>Duration:</strong> {{ quiz.time_duration }}</p>
                            <p class="card-text" v-if="quiz.remarks">{{ quiz.remarks }}</p>
                            <p class="card-text" v-else><em>No remarks available</em></p>
                        </div>
                        <div class="card-footer bg-white d-flex justify-content-between">
                            <button class="btn btn-sm btn-primary" @click="selectQuiz(quiz)">
                                <i class="bi bi-pencil-square"></i> Questions
                            </button>
                            <div>
                                <button class="btn btn-sm btn-secondary me-1" @click="openEditForm(quiz)">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-danger" @click="openDeleteConfirm(quiz)">
                                    <i class="bi bi-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});