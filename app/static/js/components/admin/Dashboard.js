// app/static/js/components/admin/Dashboard.js
Vue.component('admin-dashboard', {
    data() {
        return {
            activeView: 'stats', // Change default to stats
            views: [
                { id: 'stats', name: 'Statistics', icon: 'bi-bar-chart-fill' },
                { id: 'subjects', name: 'Subjects', icon: 'bi-book' },
                { id: 'users', name: 'Users', icon: 'bi-people' }
            ],
            breadcrumbs: [],
            subjectId: null,
            subjectName: '',
            chapterId: null,
            chapterName: '',
            quizId: null,
            quizDate: ''
        };
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
                } else if (view === 'questions') {
                    this.quizId = id;
                    this.quizDate = name;
                }
            }
            
            // Now set the breadcrumbs with updated context
            if (view === 'subjects') {
                this.breadcrumbs = [];
                // Reset other state
                this.subjectId = null;
                this.subjectName = '';
                this.chapterId = null;
                this.chapterName = '';
                this.quizId = null;
                this.quizDate = '';
            } else if (view === 'chapters') {
                this.breadcrumbs = [
                    { label: this.subjectName, view: 'subjects', id: this.subjectId, name: this.subjectName }
                ];
                // Reset child state
                this.chapterId = null;
                this.chapterName = '';
                this.quizId = null;
                this.quizDate = '';
            } else if (view === 'quizzes') {
                this.breadcrumbs = [
                    { label: this.subjectName, view: 'chapters', id: this.subjectId, name: this.subjectName },
                    { label: this.chapterName, view: 'chapters', id: this.chapterId, name: this.chapterName }
                ];
                // Reset child state
                this.quizId = null;
                this.quizDate = '';
            } else if (view === 'questions') {
                this.breadcrumbs = [
                    { label: this.subjectName, view: 'chapters', id: this.subjectId, name: this.subjectName },
                    { label: this.chapterName, view: 'quizzes', id: this.chapterId, name: this.chapterName },
                    { label: 'Quiz ' + this.quizDate, view: 'questions', id: this.quizId, name: this.quizDate }
                ];
            }
            
            this.activeView = view;
        },
        
        navigateToBreadcrumb(breadcrumb, index) {
            // When clicking a breadcrumb, go to that view specifically
            if (index === 0) {
                // First level - go to chapters under the subject
                this.navigateTo('chapters', breadcrumb.id, breadcrumb.name);
            } else if (index === 1) {
                // Second level - go to quizzes under the chapter
                this.navigateTo('quizzes', breadcrumb.id, breadcrumb.name);
            }
        },
        handleSubjectSelected(subjectId, subjectName) {
            this.navigateTo('chapters', subjectId, subjectName);
        },
        handleChapterSelected(chapterId, chapterName) {
            this.navigateTo('quizzes', chapterId, chapterName);
        },
        handleQuizSelected(quizId, quizDate) {
            this.navigateTo('questions', quizId, quizDate);
        },
        navigateToBreadcrumb(breadcrumb) {
            this.navigateTo(breadcrumb.view, breadcrumb.id);
        }
    },
    template: `
        <div>
            <h1 class="mb-4">Admin Dashboard</h1>
            
            <!-- Main dashboard navigation -->
            <div class="row mb-4" v-if="activeView === 'subjects' || activeView === 'users'">
                <div class="col-12">
                    <div class="btn-group w-100">
                        <button 
                            class="btn"
                            :class="[activeView === 'subjects' ? 'btn-primary' : 'btn-outline-primary']"
                            @click="navigateTo('subjects')"
                        >
                            <i class="bi bi-book"></i> Subjects
                        </button>
                        <button 
                            class="btn"
                            :class="[activeView === 'users' ? 'btn-primary' : 'btn-outline-primary']"
                            @click="navigateTo('users')"
                        >
                            <i class="bi bi-people"></i> Users
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Breadcrumb navigation for hierarchical views -->
            <div v-if="activeView !== 'subjects' && activeView !== 'users'" class="mb-4">
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item">
                            <a href="#" @click.prevent="navigateTo('subjects')">
                                <i class="bi bi-house"></i> Dashboard
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

                    <admin-stats-dashboard
                    v-if="activeView === 'stats'"
                ></admin-stats-dashboard>
                    
                    <subject-manager 
                        v-if="activeView === 'subjects'"
                        @subject-selected="handleSubjectSelected"
                    ></subject-manager>
                    
                    <chapter-manager 
                        v-if="activeView === 'chapters'"
                        :subject-id="subjectId"
                        @chapter-selected="handleChapterSelected"
                        @back-to-subjects="navigateTo('subjects')"
                    ></chapter-manager>
                    
                    <quiz-manager 
                        v-if="activeView === 'quizzes'"
                        :chapter-id="chapterId"
                        @quiz-selected="handleQuizSelected"
                        @back-to-chapters="navigateTo('chapters')"
                    ></quiz-manager>
                    
                    <question-manager 
                        v-if="activeView === 'questions'"
                        :quiz-id="quizId"
                        @back-to-quizzes="navigateTo('quizzes')"
                    ></question-manager>
                    
                    <user-manager 
                        v-if="activeView === 'users'"
                    ></user-manager>
                </div>
            </div>
        </div>
    `
});