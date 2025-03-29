// app/static/js/app.js
// Define your Vue routes
const routes = {
    '/': 'home',
    '/login': 'login',
    '/register': 'register',
    '/admin/dashboard': 'admin-dashboard',
    '/user/dashboard': 'user-dashboard',
    '/user/quiz': 'quiz-attempt',
};



const style = document.createElement('style');
style.textContent = `
    .hover-shadow {
        transition: all 0.3s ease;
    }
    .hover-shadow:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
`;
document.head.appendChild(style);


// Create Vue app
const app = new Vue({
    el: '#app',
    data: {
        currentRoute: window.location.pathname,
        user: null,
        authenticated: false,
        isAdmin: false,
        loading: true,
        currentQuizId: null,
    },
    computed: {
        currentView() {
            return routes[this.currentRoute] || 'not-found';
        }
    },
    methods: {
        navigateTo(route) {
            this.currentRoute = route;
            window.history.pushState(null, null, route);
        },
        async checkAuth() {
            try {
                this.loading = true;
                const response = await axios.get('/api/auth/current_user');
                this.authenticated = response.data.authenticated;
                if (this.authenticated) {
                    this.user = response.data.user;
                    this.isAdmin = this.user.role === 'admin';
                    
                    // Redirect to appropriate dashboard if on home, login or register
                    if (['/', '/login', '/register'].includes(this.currentRoute)) {
                        if (this.isAdmin) {
                            this.navigateTo('/admin/dashboard');
                        } else {
                            this.navigateTo('/user/dashboard');
                        }
                    }
                } else {
                    // If not authenticated and not on login or register, redirect to login
                    if (!['/login', '/register'].includes(this.currentRoute)) {
                        this.navigateTo('/login');
                    }
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                this.authenticated = false;
                this.navigateTo('/login');
            } finally {
                this.loading = false;
            }
        },
        async logout() {
            try {
                await axios.post('/api/auth/logout');
                this.authenticated = false;
                this.user = null;
                this.isAdmin = false;
                this.navigateTo('/login');
            } catch (error) {
                console.error('Error logging out:', error);
            }
        },
        startQuiz(quizId) {
            this.currentQuizId = quizId;
            this.navigateTo('/user/quiz');
        }
    },
    created() {
        // Handle back/forward browser buttons
        window.addEventListener('popstate', () => {
            this.currentRoute = window.location.pathname;
        });
        
        // Check authentication status
        this.checkAuth();
    },
    template: `
        <div>
            <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
                <div class="container">
                    <a class="navbar-brand" href="#" @click.prevent="navigateTo('/')">Quiz Master</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            <template v-if="authenticated">
                                <li class="nav-item">
                                    <span class="nav-link">Welcome, {{ user.full_name }}</span>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" @click.prevent="isAdmin ? navigateTo('/admin/dashboard') : navigateTo('/user/dashboard')">Dashboard</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" @click.prevent="logout">Logout</a>
                                </li>
                            </template>
                            <template v-else>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" @click.prevent="navigateTo('/login')">Login</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" @click.prevent="navigateTo('/register')">Register</a>
                                </li>
                            </template>
                        </ul>
                    </div>
                </div>
            </nav>
            
            <div class="container">
            <div v-if="loading" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            <template v-else>
                <home-view v-if="currentView === 'home'"></home-view>
                <login-form v-else-if="currentView === 'login'" @login-success="checkAuth"></login-form>
                <register-form v-else-if="currentView === 'register'" @register-success="navigateTo('/login')"></register-form>
                <admin-dashboard v-else-if="currentView === 'admin-dashboard' && isAdmin"></admin-dashboard>
                <user-dashboard v-else-if="currentView === 'user-dashboard' && !isAdmin" @start-quiz="startQuiz"></user-dashboard>
                <quiz-attempt v-else-if="currentView === 'quiz-attempt' && !isAdmin" :quiz-id="currentQuizId"></quiz-attempt>
                <div v-else class="alert alert-danger">
                    <h3>Page Not Found or Access Denied</h3>
                    <p>The page you're looking for doesn't exist or you don't have permission to access it.</p>
                    <button class="btn btn-primary" @click="navigateTo('/')">Go Home</button>
                </div>
            </template>
        </div>
            
            <footer class="bg-light py-4 mt-5">
                <div class="container text-center">
                    <p class="mb-0">&copy; 2025 Quiz Master. All rights reserved.</p>
                </div>
            </footer>
        </div>
    `
});

// Home view component
Vue.component('home-view', {
    template: `
        <div class="jumbotron py-5">
            <h1 class="display-4">Welcome to Quiz Master</h1>
            <p class="lead">An exam preparation platform for multiple courses.</p>
            <hr class="my-4">
            <p>Test your knowledge, track your progress, and improve your skills.</p>
        </div>
    `
});