// app/static/js/components/auth/LoginForm.js
Vue.component('login-form', {
    data() {
        return {
            username: '',
            password: '',
            error: '',
            loading: false
        };
    },
    methods: {
        async login() {
            if (!this.username || !this.password) {
                this.error = 'Please enter both username and password';
                return;
            }
            
            try {
                this.loading = true;
                this.error = '';
                
                const response = await axios.post('/api/auth/login', {
                    username: this.username,
                    password: this.password
                });
                
                this.$emit('login-success');
            } catch (error) {
                if (error.response && error.response.data) {
                    this.error = error.response.data.message;
                } else {
                    this.error = 'An error occurred during login';
                }
                console.error('Login error:', error);
            } finally {
                this.loading = false;
            }
        }
    },
    template: `
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h3 class="mb-0">Login</h3>
                    </div>
                    <div class="card-body">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>
                        
                        <form @submit.prevent="login">
                            <div class="mb-3">
                                <label for="username" class="form-label">Email</label>
                                <input 
                                    type="email" 
                                    class="form-control" 
                                    id="username" 
                                    v-model="username" 
                                    required
                                    autocomplete="username"
                                >
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input 
                                    type="password" 
                                    class="form-control" 
                                    id="password" 
                                    v-model="password" 
                                    required
                                    autocomplete="current-password"
                                >
                            </div>
                            <button 
                                type="submit" 
                                class="btn btn-primary" 
                                :disabled="loading"
                            >
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                Login
                            </button>
                        </form>
                        
                        <div class="mt-3">
                            <p>Don't have an account? <a href="#" @click.prevent="$root.navigateTo('/register')">Register</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});