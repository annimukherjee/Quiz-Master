// app/static/js/components/auth/RegisterForm.js
Vue.component('register-form', {
    data() {
        return {
            username: '',
            password: '',
            confirmPassword: '',
            fullName: '',
            qualification: '',
            dob: '',
            error: '',
            loading: false
        };
    },
    methods: {
        async register() {
            // Validation
            if (!this.username || !this.password || !this.confirmPassword || !this.fullName) {
                this.error = 'Please fill in all required fields';
                return;
            }
            
            if (this.password !== this.confirmPassword) {
                this.error = 'Passwords do not match';
                return;
            }
            
            try {
                this.loading = true;
                this.error = '';
                
                const response = await axios.post('/api/auth/register', {
                    username: this.username,
                    password: this.password,
                    full_name: this.fullName,
                    qualification: this.qualification,
                    dob: this.dob
                });
                
                this.$emit('register-success');
            } catch (error) {
                if (error.response && error.response.data) {
                    this.error = error.response.data.message;
                } else {
                    this.error = 'An error occurred during registration';
                }
                console.error('Registration error:', error);
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
                        <h3 class="mb-0">Register</h3>
                    </div>
                    <div class="card-body">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>
                        
                        <form @submit.prevent="register">
                            <div class="mb-3">
                                <label for="username" class="form-label">Email *</label>
                                <input 
                                    type="email" 
                                    class="form-control" 
                                    id="username" 
                                    v-model="username" 
                                    required
                                    autocomplete="email"
                                >
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password *</label>
                                <input 
                                    type="password" 
                                    class="form-control" 
                                    id="password" 
                                    v-model="password" 
                                    required
                                    minlength="6"
                                    autocomplete="new-password"
                                >
                            </div>
                            <div class="mb-3">
                                <label for="confirmPassword" class="form-label">Confirm Password *</label>
                                <input 
                                    type="password" 
                                    class="form-control" 
                                    id="confirmPassword" 
                                    v-model="confirmPassword" 
                                    required
                                    autocomplete="new-password"
                                >
                            </div>
                            <div class="mb-3">
                                <label for="fullName" class="form-label">Full Name *</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="fullName" 
                                    v-model="fullName" 
                                    required
                                >
                            </div>
                            <div class="mb-3">
                                <label for="qualification" class="form-label">Qualification</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="qualification" 
                                    v-model="qualification"
                                >
                            </div>
                            <div class="mb-3">
                                <label for="dob" class="form-label">Date of Birth</label>
                                <input 
                                    type="date" 
                                    class="form-control" 
                                    id="dob" 
                                    v-model="dob"
                                >
                            </div>
                            <button 
                                type="submit" 
                                class="btn btn-primary" 
                                :disabled="loading"
                            >
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                Register
                            </button>
                        </form>
                        
                        <div class="mt-3">
                            <p>Already have an account? <a href="#" @click.prevent="$root.navigateTo('/login')">Login</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});