// app/static/js/components/user/ChapterList.js
Vue.component('chapter-list', {
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
            error: null
        };
    },
    watch: {
        subjectId: {
            immediate: true,
            handler(newVal) {
                if (newVal) {
                    this.fetchSubject();
                    this.fetchChapters();
                }
            }
        }
    },
    methods: {
        async fetchSubject() {
            try {
                const response = await axios.get(`/api/user/subjects/${this.subjectId}`);
                this.subject = response.data.subject;
            } catch (error) {
                console.error('Error fetching subject:', error);
                this.error = 'Failed to load subject details. Please try again.';
            }
        },
        async fetchChapters() {
            this.loading = true;
            try {
                const response = await axios.get(`/api/user/chapters?subject_id=${this.subjectId}`);
                this.chapters = response.data.chapters;
                this.error = null;
            } catch (error) {
                console.error('Error fetching chapters:', error);
                this.error = 'Failed to load chapters. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        selectChapter(chapter) {
            this.$emit('chapter-selected', chapter.id, chapter.name);
        }
    },
    template: `
        <div>
            <h2 class="mb-2">Chapters</h2>
            <h5 v-if="subject" class="text-muted mb-4">{{ subject.name }}</h5>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="chapters.length === 0" class="alert alert-info">
                No chapters are available for this course yet.
            </div>
            
            <div v-else class="row">
                <div class="col-md-6 col-lg-4 mb-4" v-for="chapter in chapters" :key="chapter.id">
                    <div class="card h-100 hover-shadow">
                        <div class="card-body">
                            <h5 class="card-title">{{ chapter.name }}</h5>
                            <p class="card-text">{{ chapter.description || 'No description available' }}</p>
                        </div>
                        <div class="card-footer bg-white">
                            <button class="btn btn-primary w-100" @click="selectChapter(chapter)">
                                <i class="bi bi-list-check"></i> View Quizzes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});