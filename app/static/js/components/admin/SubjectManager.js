// app/static/js/components/admin/SubjectManager.js
Vue.component('subject-manager', {
    data() {
        return {
            subjects: [],
            loading: false,
            error: null,
            // Form fields
            showForm: false,
            editMode: false,
            currentSubject: {
                id: null,
                name: '',
                description: ''
            },
            // Confirmation
            showDeleteConfirm: false,
            subjectToDelete: null
        };
    },
    created() {
        this.fetchSubjects();
    },
    methods: {
        async fetchSubjects() {
            this.loading = true;
            try {
                const response = await axios.get('/api/admin/subjects');
                this.subjects = response.data.subjects;
                this.error = null;
            } catch (error) {
                console.error('Error fetching subjects:', error);
                this.error = 'Failed to load subjects. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        resetForm() {
            this.currentSubject = {
                id: null,
                name: '',
                description: ''
            };
            this.editMode = false;
            this.showForm = false;
        },
        openCreateForm() {
            this.resetForm();
            this.showForm = true;
        },
        openEditForm(subject) {
            this.currentSubject = { ...subject };
            this.editMode = true;
            this.showForm = true;
        },
        openDeleteConfirm(subject) {
            this.subjectToDelete = subject;
            this.showDeleteConfirm = true;
        },
        async saveSubject() {
            try {
                if (!this.currentSubject.name) {
                    this.error = 'Subject name is required';
                    return;
                }
                
                let response;
                if (this.editMode) {
                    // Update existing subject
                    response = await axios.put(`/api/admin/subjects/${this.currentSubject.id}`, this.currentSubject);
                    
                    // Update subject in the list
                    const index = this.subjects.findIndex(s => s.id === this.currentSubject.id);
                    if (index !== -1) {
                        this.subjects.splice(index, 1, response.data.subject);
                    }
                } else {
                    // Create new subject
                    response = await axios.post('/api/admin/subjects', this.currentSubject);
                    this.subjects.push(response.data.subject);
                }
                
                this.resetForm();
                this.error = null;
            } catch (error) {
                console.error('Error saving subject:', error);
                this.error = 'Failed to save subject. Please try again.';
            }
        },
        async deleteSubject() {
            if (!this.subjectToDelete) return;
            
            try {
                await axios.delete(`/api/admin/subjects/${this.subjectToDelete.id}`);
                
                // Remove from the list
                const index = this.subjects.findIndex(s => s.id === this.subjectToDelete.id);
                if (index !== -1) {
                    this.subjects.splice(index, 1);
                }
                
                this.showDeleteConfirm = false;
                this.subjectToDelete = null;
                this.error = null;
            } catch (error) {
                console.error('Error deleting subject:', error);
                this.error = 'Failed to delete subject. Please try again.';
            }
        },
        selectSubject(subject) {
            this.$emit('subject-selected', subject.id, subject.name);
        }

    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Manage Subjects</h2>
                <button class="btn btn-success" @click="openCreateForm">
                    <i class="bi bi-plus-circle"></i> Add Subject
                </button>
            </div>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <!-- Subject Form -->
            <div v-if="showForm" class="card mb-4">
                <div class="card-header bg-primary text-white">
                    {{ editMode ? 'Edit Subject' : 'Create New Subject' }}
                </div>
                <div class="card-body">
                    <form @submit.prevent="saveSubject">
                        <div class="mb-3">
                            <label for="subjectName" class="form-label">Subject Name *</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                id="subjectName" 
                                v-model="currentSubject.name" 
                                required
                            >
                        </div>
                        <div class="mb-3">
                            <label for="subjectDescription" class="form-label">Description</label>
                            <textarea 
                                class="form-control" 
                                id="subjectDescription" 
                                v-model="currentSubject.description" 
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
                            <p>Are you sure you want to delete the subject: <strong>{{ subjectToDelete?.name }}</strong>?</p>
                            <p class="text-danger">This will also delete all chapters, quizzes, and questions associated with this subject!</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
                            <button type="button" class="btn btn-danger" @click="deleteSubject">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Subject List -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="subjects.length === 0" class="alert alert-info">
                No subjects available. Create your first subject to get started.
            </div>
            
            <div v-else class="row">
                <div class="col-md-6 col-lg-4 mb-4" v-for="subject in subjects" :key="subject.id">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">{{ subject.name }}</h5>
                            <p class="card-text">{{ subject.description || 'No description available' }}</p>
                        </div>
                        <div class="card-footer bg-white d-flex justify-content-between">
                            <button class="btn btn-sm btn-primary" @click="selectSubject(subject)">
                                <i class="bi bi-list-nested"></i> Chapters
                            </button>
                            <div>
                                <button class="btn btn-sm btn-secondary me-1" @click="openEditForm(subject)">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-danger" @click="openDeleteConfirm(subject)">
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