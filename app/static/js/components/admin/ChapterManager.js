// app/static/js/components/admin/ChapterManager.js
Vue.component('chapter-manager', {
    props: {
        subjectId: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            chapters: [],
            subject: null,
            loading: false,
            error: null,
            // Form fields
            showForm: false,
            editMode: false,
            currentChapter: {
                id: null,
                name: '',
                description: '',
                subject_id: this.subjectId
            },
            // Confirmation
            showDeleteConfirm: false,
            chapterToDelete: null
        };
    },
    watch: {
        subjectId: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.fetchSubject();
                    this.fetchChapters();
                    this.currentChapter.subject_id = newVal;
                }
            }
        }
    },
    methods: {
        async fetchSubject() {
            try {
                const response = await axios.get(`/api/admin/subjects/${this.subjectId}`);
                this.subject = response.data.subject;
            } catch (error) {
                console.error('Error fetching subject:', error);
                this.error = 'Failed to load subject details. Please try again.';
            }
        },
        async fetchChapters() {
            this.loading = true;
            try {
                const response = await axios.get(`/api/admin/chapters?subject_id=${this.subjectId}`);
                this.chapters = response.data.chapters;
                this.error = null;
            } catch (error) {
                console.error('Error fetching chapters:', error);
                this.error = 'Failed to load chapters. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        resetForm() {
            this.currentChapter = {
                id: null,
                name: '',
                description: '',
                subject_id: this.subjectId
            };
            this.editMode = false;
            this.showForm = false;
        },
        openCreateForm() {
            this.resetForm();
            this.showForm = true;
        },
        openEditForm(chapter) {
            this.currentChapter = { ...chapter };
            this.editMode = true;
            this.showForm = true;
        },
        openDeleteConfirm(chapter) {
            this.chapterToDelete = chapter;
            this.showDeleteConfirm = true;
        },
        async saveChapter() {
            try {
                if (!this.currentChapter.name) {
                    this.error = 'Chapter name is required';
                    return;
                }
                
                let response;
                if (this.editMode) {
                    // Update existing chapter
                    response = await axios.put(`/api/admin/chapters/${this.currentChapter.id}`, this.currentChapter);
                    
                    // Update chapter in the list
                    const index = this.chapters.findIndex(c => c.id === this.currentChapter.id);
                    if (index !== -1) {
                        this.chapters.splice(index, 1, response.data.chapter);
                    }
                } else {
                    // Create new chapter
                    response = await axios.post('/api/admin/chapters', this.currentChapter);
                    this.chapters.push(response.data.chapter);
                }
                
                this.resetForm();
                this.error = null;
            } catch (error) {
                console.error('Error saving chapter:', error);
                this.error = 'Failed to save chapter. Please try again.';
            }
        },
        async deleteChapter() {
            if (!this.chapterToDelete) return;
            
            try {
                await axios.delete(`/api/admin/chapters/${this.chapterToDelete.id}`);
                
                // Remove from the list
                const index = this.chapters.findIndex(c => c.id === this.chapterToDelete.id);
                if (index !== -1) {
                    this.chapters.splice(index, 1);
                }
                
                this.showDeleteConfirm = false;
                this.chapterToDelete = null;
                this.error = null;
            } catch (error) {
                console.error('Error deleting chapter:', error);
                this.error = 'Failed to delete chapter. Please try again.';
            }
        },
        selectChapter(chapter) {
            this.$emit('chapter-selected', chapter.id, chapter.name);
        }
    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Chapters</h2>
                    <h5 v-if="subject" class="text-muted">Subject: {{ subject.name }}</h5>
                </div>
                <div>
                    <button class="btn btn-outline-primary me-2" @click="$root.navigateTo('/admin/dashboard')">
                        <i class="bi bi-arrow-left"></i> Back to Subjects
                    </button>
                    <button class="btn btn-success" @click="openCreateForm">
                        <i class="bi bi-plus-circle"></i> Add Chapter
                    </button>
                </div>
            </div>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <!-- Chapter Form -->
            <div v-if="showForm" class="card mb-4">
                <div class="card-header bg-primary text-white">
                    {{ editMode ? 'Edit Chapter' : 'Create New Chapter' }}
                </div>
                <div class="card-body">
                    <form @submit.prevent="saveChapter">
                        <div class="mb-3">
                            <label for="chapterName" class="form-label">Chapter Name *</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                id="chapterName" 
                                v-model="currentChapter.name" 
                                required
                            >
                        </div>
                        <div class="mb-3">
                            <label for="chapterDescription" class="form-label">Description</label>
                            <textarea 
                                class="form-control" 
                                id="chapterDescription" 
                                v-model="currentChapter.description" 
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
                            <p>Are you sure you want to delete the chapter: <strong>{{ chapterToDelete?.name }}</strong>?</p>
                            <p class="text-danger">This will also delete all quizzes and questions associated with this chapter!</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
                            <button type="button" class="btn btn-danger" @click="deleteChapter">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Chapter List -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="chapters.length === 0" class="alert alert-info">
                No chapters available for this subject. Create your first chapter to get started.
            </div>
            
            <div v-else class="row">
                <div class="col-md-6 col-lg-4 mb-4" v-for="chapter in chapters" :key="chapter.id">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">{{ chapter.name }}</h5>
                            <p class="card-text">{{ chapter.description || 'No description available' }}</p>
                        </div>
                        <div class="card-footer bg-white d-flex justify-content-between">
                            <button class="btn btn-sm btn-primary" @click="selectChapter(chapter)">
                                <i class="bi bi-question-circle"></i> Quizzes
                            </button>
                            <div>
                                <button class="btn btn-sm btn-secondary me-1" @click="openEditForm(chapter)">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-danger" @click="openDeleteConfirm(chapter)">
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