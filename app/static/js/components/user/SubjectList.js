// app/static/js/components/user/SubjectList.js
Vue.component('subject-list', {
    data() {
        return {
            subjects: [],
            loading: false,
            error: null
        };
    },
    created() {
        this.fetchSubjects();
    },
    methods: {
        async fetchSubjects() {
            this.loading = true;
            try {
                const response = await axios.get('/api/user/subjects');
                this.subjects = response.data.subjects;
                this.error = null;
            } catch (error) {
                console.error('Error fetching subjects:', error);
                this.error = 'Failed to load subjects. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        selectSubject(subject) {
            this.$emit('subject-selected', subject.id, subject.name);
        }
    },
    template: `
        <div>
            <h2 class="mb-4">Available Courses</h2>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="subjects.length === 0" class="alert alert-info">
                No courses available at the moment. Please check back later.
            </div>
            
            <div v-else class="row">
                <div class="col-md-6 col-lg-4 mb-4" v-for="subject in subjects" :key="subject.id">
                    <div class="card h-100 hover-shadow">
                        <div class="card-body">
                            <h5 class="card-title">{{ subject.name }}</h5>
                            <p class="card-text">{{ subject.description || 'No description available' }}</p>
                        </div>
                        <div class="card-footer bg-white">
                            <button class="btn btn-primary w-100" @click="selectSubject(subject)">
                                <i class="bi bi-arrow-right-circle"></i> Browse Chapters
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});