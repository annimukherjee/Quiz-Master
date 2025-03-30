// app/static/js/components/user/Dashboard.js
Vue.component('user-dashboard', {
    data() {
        return {
            activeView: 'stats', // Change default to stats
            subjectId: null,
            subjectName: '',
            chapterId: null,
            chapterName: '',
            breadcrumbs: [],
            user: null
        };
    },
    created() {
        // Get user details from the parent component
        this.user = this.$root.user;
    },
    methods: {
        navigateTo(view, id, name) {
            // First update the context if provided
            if (id !== undefined) {
                if (view === 'chapters') {
                    this.subjectId = id;
                    this.subjectName = name;
                } else if (view === 'quizzes') {
                    this.chapterId = id;
                    this.chapterName = name;
                }
            }
            
            // Now set the breadcrumbs with updated context
            if (view === 'subjects') {
                this.breadcrumbs = [];
                this.subjectId = null;
                this.subjectName = '';
                this.chapterId = null;
                this.chapterName = '';
            } else if (view === 'chapters') {
                this.breadcrumbs = [
                    { label: this.subjectName, view: 'subjects', id: this.subjectId, name: this.subjectName }
                ];
                this.chapterId = null;
                this.chapterName = '';
            } else if (view === 'quizzes') {
                this.breadcrumbs = [
                    { label: this.subjectName, view: 'chapters', id: this.subjectId, name: this.subjectName },
                    { label: this.chapterName, view: 'chapters', id: this.chapterId, name: this.chapterName }
                ];
            }
            
            this.activeView = view;
        },
        navigateToBreadcrumb(breadcrumb, index) {
            if (index === 0) {
                // First level - go to chapters under the subject
                this.navigateTo('chapters', breadcrumb.id, breadcrumb.name);
            }
        },
        handleSubjectSelected(subjectId, subjectName) {
            this.navigateTo('chapters', subjectId, subjectName);
        },
        handleChapterSelected(chapterId, chapterName) {
            this.navigateTo('quizzes', chapterId, chapterName);
        },
        startQuiz(quizId) {
            this.$emit('start-quiz', quizId);
        }
    },
    template: `
        <div>
            <h1 class="mb-4">Welcome, {{ user.full_name }}</h1>
            
            <!-- Dashboard tabs for different sections -->
            <ul class="nav nav-tabs mb-4">
                <li class="nav-item">
                    <a class="nav-link" :class="{ active: activeView === 'subjects' || activeView === 'chapters' || activeView === 'quizzes' }" href="#" @click.prevent="navigateTo('subjects')">
                        <i class="bi bi-book"></i> Courses
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{ active: activeView === 'scores' }" href="#" @click.prevent="navigateTo('scores')">
                        <i class="bi bi-bar-chart"></i> My Scores
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{ active: activeView === 'exports' }" href="#" @click.prevent="navigateTo('exports')">
                        <i class="bi bi-file-earmark-spreadsheet"></i> Exports
                    </a>
                </li>
            </ul>
            
            <!-- Breadcrumb navigation for hierarchical views -->
            <div v-if="activeView !== 'subjects' && activeView !== 'scores'" class="mb-4">
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item">
                            <a href="#" @click.prevent="navigateTo('subjects')">
                                <i class="bi bi-collection"></i> All Courses
                            </a>
                        </li>
                        <li 
                            v-for="(crumb, index) in breadcrumbs" 
                            :key="index" 
                            class="breadcrumb-item"
                            :class="{ 'active': index === breadcrumbs.length - 1 }"
                        >
                            <a 
                                v-if="index !== breadcrumbs.length - 1" 
                                href="#" 
                                @click.prevent="navigateToBreadcrumb(crumb, index)"
                            >
                                {{ crumb.label }}
                            </a>
                            <span v-else>{{ crumb.label }}</span>
                        </li>
                    </ol>
                </nav>
            </div>
            
            <!-- Content area -->
            <div class="row">
                <div class="col-12">
                    <!-- Components for each view -->

                    <user-stats-dashboard 
                        v-if="activeView === 'stats'"
                    ></user-stats-dashboard>
                    
                    <subject-list 
                        v-if="activeView === 'subjects'"
                        @subject-selected="handleSubjectSelected"
                    ></subject-list>
                    
                    <chapter-list 
                        v-if="activeView === 'chapters'"
                        :subject-id="subjectId"
                        @chapter-selected="handleChapterSelected"
                    ></chapter-list>
                    
                    <quiz-list 
                        v-if="activeView === 'quizzes'"
                        :chapter-id="chapterId"
                        @start-quiz="startQuiz"
                    ></quiz-list>
                    
                    <score-list 
                        v-if="activeView === 'scores'"
                    ></score-list>

                    <export-manager 
                        v-if="activeView === 'exports'"
                    ></export-manager>
                    
                </div>
            </div>
        </div>
    `
});