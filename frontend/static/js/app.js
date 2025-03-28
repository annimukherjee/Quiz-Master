// Vue App
new Vue({
    el: '#app',
    data: {
        user: null,
        currentView: 'landing',  // Start with landing page
        adminView: 'dashboard',
        userView: 'dashboard',
        userAuthTab: 'login',    // Default to login tab for user
        
        // Forms
        adminLoginForm: {
            email: '',
            password: ''
        },
        userLoginForm: {
            email: '',
            password: ''
        },
        userSignupForm: {
            email: '',
            full_name: '',
            qualification: '',
            dob: '',
            password: ''
        },
        
        // Data storage
        users: [],
        subjects: [],
        chapters: [],
        quizzes: [],
        scores: []
    },
    created() {
        // Check if user is logged in
        this.fetchUserProfile();
    },
    methods: {
        // Authentication methods
        adminLogin() {
            axios.post('/api/auth/admin-login', this.adminLoginForm)
                .then(response => {
                    this.user = response.data.user;
                    this.adminView = 'dashboard';
                })
                .catch(error => {
                    alert('Admin login failed: ' + (error.response?.data?.message || 'Invalid credentials'));
                });
        },
        userLogin() {
            axios.post('/api/auth/login', this.userLoginForm)
                .then(response => {
                    this.user = response.data.user;
                    this.userView = 'dashboard';
                })
                .catch(error => {
                    alert('Login failed: ' + (error.response?.data?.message || 'Invalid credentials'));
                });
        },
        userSignup() {
            axios.post('/api/auth/register', this.userSignupForm)
                .then(response => {
                    alert('Registration successful! Please login.');
                    this.userAuthTab = 'login';
                    // Clear form
                    this.userSignupForm = {
                        email: '',
                        full_name: '',
                        qualification: '',
                        dob: '',
                        password: ''
                    };
                })
                .catch(error => {
                    alert('Registration failed: ' + (error.response?.data?.message || 'Unknown error'));
                });
        },
        logout() {
            axios.post('/api/auth/logout')
                .then(() => {
                    this.user = null;
                    this.currentView = 'landing';
                })
                .catch(error => {
                    console.error('Logout error:', error);
                    // Force logout even if there's an error
                    this.user = null;
                    this.currentView = 'landing';
                });
        },
        fetchUserProfile() {
            axios.get('/api/auth/me')
                .then(response => {
                    this.user = response.data;
                })
                .catch(() => {
                    // Not logged in, that's fine
                    this.user = null;
                });
        },
        
        // Admin methods
        fetchUsers() {
            if (this.user?.role !== 'admin') return;
            
            axios.get('/api/admin/users')
                .then(response => {
                    this.users = response.data;
                })
                .catch(error => {
                    console.error('Error fetching users:', error);
                });
        },
        
        // User methods
        fetchSubjects() {
            axios.get('/api/user/subjects')
                .then(response => {
                    this.subjects = response.data;
                })
                .catch(error => {
                    console.error('Error fetching subjects:', error);
                });
        }
        
        // Other methods remain the same
    }
});