// app/static/js/components/admin/QuestionManager.js
Vue.component('question-manager', {
    props: {
        quizId: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            questions: [],
            quiz: null,
            chapter: null,
            subject: null,
            loading: false,
            error: null,
            // Form fields
            showForm: false,
            editMode: false,
            currentQuestion: {
                id: null,
                quiz_id: this.quizId,
                question_statement: '',
                options: ['', '', '', ''],
                correct_option: 1
            },
            // Confirmation
            showDeleteConfirm: false,
            questionToDelete: null
        };
    },
    watch: {
        quizId: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.fetchQuizDetails();
                    this.fetchQuestions();
                    this.currentQuestion.quiz_id = newVal;
                }
            }
        }
    },
    methods: {
        async fetchQuizDetails() {
            try {
                const response = await axios.get(`/api/admin/quizzes/${this.quizId}`);
                this.quiz = response.data.quiz;
                
                if (this.quiz && this.quiz.chapter_id) {
                    const chapterResponse = await axios.get(`/api/admin/chapters/${this.quiz.chapter_id}`);
                    this.chapter = chapterResponse.data.chapter;
                    
                    if (this.chapter && this.chapter.subject_id) {
                        const subjectResponse = await axios.get(`/api/admin/subjects/${this.chapter.subject_id}`);
                        this.subject = subjectResponse.data.subject;
                    }
                }
            } catch (error) {
                console.error('Error fetching quiz details:', error);
                this.error = 'Failed to load quiz details. Please try again.';
            }
        },
        async fetchQuestions() {
            this.loading = true;
            try {
                const response = await axios.get(`/api/admin/questions?quiz_id=${this.quizId}`);
                this.questions = response.data.questions;
                this.error = null;
            } catch (error) {
                console.error('Error fetching questions:', error);
                this.error = 'Failed to load questions. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        resetForm() {
            this.currentQuestion = {
                id: null,
                quiz_id: this.quizId,
                question_statement: '',
                options: ['', '', '', ''],
                correct_option: 1
            };
            this.editMode = false;
            this.showForm = false;
        },
        openCreateForm() {
            this.resetForm();
            this.showForm = true;
        },
        openEditForm(question) {
            // Format the question data for the form
            this.currentQuestion = {
                id: question.id,
                quiz_id: question.quiz_id,
                question_statement: question.question_statement,
                options: [...question.options],
                correct_option: question.correct_option
            };
            this.editMode = true;
            this.showForm = true;
        },
        openDeleteConfirm(question) {
            this.questionToDelete = question;
            this.showDeleteConfirm = true;
        },
        validateQuestion() {
            if (!this.currentQuestion.question_statement) {
                this.error = 'Question statement is required';
                return false;
            }
            
            // Validate all options are filled
            for (let i = 0; i < 4; i++) {
                if (!this.currentQuestion.options[i]) {
                    this.error = `Option ${i + 1} is required`;
                    return false;
                }
            }
            
            return true;
        },
        async saveQuestion() {
            try {
                if (!this.validateQuestion()) {
                    return;
                }
                
                let response;
                if (this.editMode) {
                    // Update existing question
                    response = await axios.put(`/api/admin/questions/${this.currentQuestion.id}`, this.currentQuestion);
                    
                    // Update question in the list
                    const index = this.questions.findIndex(q => q.id === this.currentQuestion.id);
                    if (index !== -1) {
                        this.questions.splice(index, 1, response.data.question);
                    }
                } else {
                    // Create new question
                    response = await axios.post('/api/admin/questions', this.currentQuestion);
                    this.questions.push(response.data.question);
                }
                
                this.resetForm();
                this.error = null;
            } catch (error) {
                console.error('Error saving question:', error);
                this.error = 'Failed to save question. Please try again.';
            }
        },
        async deleteQuestion() {
            if (!this.questionToDelete) return;
            
            try {
                await axios.delete(`/api/admin/questions/${this.questionToDelete.id}`);
                
                // Remove from the list
                const index = this.questions.findIndex(q => q.id === this.questionToDelete.id);
                if (index !== -1) {
                    this.questions.splice(index, 1);
                }
                
                this.showDeleteConfirm = false;
                this.questionToDelete = null;
                this.error = null;
            } catch (error) {
                console.error('Error deleting question:', error);
                this.error = 'Failed to delete question. Please try again.';
            }
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
                    <h2>Questions</h2>
                    <h5 v-if="quiz && chapter && subject" class="text-muted">
                        Subject: {{ subject.name }} / Chapter: {{ chapter.name }} / Quiz: {{ formatDate(quiz.date_of_quiz) }}
                    </h5>
                </div>
                <div>
                    <button class="btn btn-outline-primary me-2" @click="$root.navigateTo('/admin/dashboard')">
                        <i class="bi bi-arrow-left"></i> Back to Quizzes
                    </button>
                    <button class="btn btn-success" @click="openCreateForm">
                        <i class="bi bi-plus-circle"></i> Add Question
                    </button>
                </div>
            </div>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <!-- Question Form -->
            <div v-if="showForm" class="card mb-4">
                <div class="card-header bg-primary text-white">
                    {{ editMode ? 'Edit Question' : 'Create New Question' }}
                </div>
                <div class="card-body">
                    <form @submit.prevent="saveQuestion">
                        <div class="mb-3">
                            <label for="questionStatement" class="form-label">Question *</label>
                            <textarea 
                                class="form-control" 
                                id="questionStatement" 
                                v-model="currentQuestion.question_statement" 
                                rows="3"
                                required
                            ></textarea>
                        </div>
                        
                        <div class="mb-3" v-for="(option, index) in currentQuestion.options" :key="index">
                            <div class="d-flex align-items-center">
                                <div class="form-check me-2">
                                    <input 
                                        class="form-check-input" 
                                        type="radio" 
                                        :id="'option' + index" 
                                        :value="index + 1" 
                                        v-model="currentQuestion.correct_option"
                                    >
                                    <label class="form-check-label" :for="'option' + index">
                                        Correct
                                    </label>
                                </div>
                                <div class="flex-grow-1">
                                    <label class="form-label">Option {{ index + 1 }} *</label>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        v-model="currentQuestion.options[index]" 
                                        required
                                    >
                                </div>
                            </div>
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
                            <p>Are you sure you want to delete this question?</p>
                            <p><strong>{{ questionToDelete?.question_statement }}</strong></p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
                            <button type="button" class="btn btn-danger" @click="deleteQuestion">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Question List -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="questions.length === 0" class="alert alert-info">
                No questions available for this quiz. Create your first question to get started.
            </div>
            
            <div v-else>
                <div class="card mb-4" v-for="(question, qIndex) in questions" :key="question.id">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Question {{ qIndex + 1 }}</h5>
                        <div>
                            <button class="btn btn-sm btn-secondary me-1" @click="openEditForm(question)">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" @click="openDeleteConfirm(question)">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="card-text mb-4"><strong>{{ question.question_statement }}</strong></p>
                        
                        <div class="list-group">
                            <div 
                                v-for="(option, oIndex) in question.options" 
                                :key="oIndex"
                                class="list-group-item list-group-item-action"
                                :class="{'list-group-item-success': oIndex + 1 === question.correct_option}"
                            >
                                <div class="d-flex align-items-center">
                                    <div class="me-2">
                                        <span class="badge" :class="oIndex + 1 === question.correct_option ? 'bg-success' : 'bg-secondary'">
                                            {{ ['A', 'B', 'C', 'D'][oIndex] }}
                                        </span>
                                    </div>
                                    <div>{{ option }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});