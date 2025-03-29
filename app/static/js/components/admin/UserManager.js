// app/static/js/components/admin/UserManager.js
Vue.component('user-manager', {
    data() {
        return {
            users: [],
            loading: false,
            error: null,
            searchQuery: '',
            selectedUser: null,
            showUserDetails: false
        };
    },
    created() {
        this.fetchUsers();
    },
    computed: {
        filteredUsers() {
            if (!this.searchQuery) return this.users;
            
            const query = this.searchQuery.toLowerCase();
            return this.users.filter(user => 
                user.username.toLowerCase().includes(query) ||
                user.full_name.toLowerCase().includes(query) ||
                (user.qualification && user.qualification.toLowerCase().includes(query))
            );
        }
    },
    methods: {
        async fetchUsers() {
            this.loading = true;
            try {
                const response = await axios.get('/api/admin/users');
                this.users = response.data.users;
                this.error = null;
            } catch (error) {
                console.error('Error fetching users:', error);
                this.error = 'Failed to load users. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        viewUserDetails(user) {
            this.selectedUser = { ...user };
            this.showUserDetails = true;
        },
        closeUserDetails() {
            this.showUserDetails = false;
            this.selectedUser = null;
        },
        formatDate(dateString) {
            if (!dateString) return 'Not specified';
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        },
        getRoleBadgeClass(role) {
            return role === 'admin' ? 'bg-danger' : 'bg-primary';
        }
    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>User Management</h2>
                <div class="d-flex">
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input 
                            type="text" 
                            class="form-control" 
                            placeholder="Search users..." 
                            v-model="searchQuery"
                        >
                    </div>
                </div>
            </div>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <!-- User Details Modal -->
            <div v-if="showUserDetails" class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">User Details</h5>
                            <button type="button" class="btn-close" @click="closeUserDetails"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <h6 class="text-muted">Full Name</h6>
                                    <p class="lead">{{ selectedUser.full_name }}</p>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <h6 class="text-muted">Email</h6>
                                    <p class="lead">{{ selectedUser.username }}</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <h6 class="text-muted">Role</h6>
                                    <p>
                                        <span class="badge" :class="getRoleBadgeClass(selectedUser.role)">
                                            {{ selectedUser.role.toUpperCase() }}
                                        </span>
                                    </p>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <h6 class="text-muted">Date of Birth</h6>
                                    <p>{{ formatDate(selectedUser.dob) }}</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <h6 class="text-muted">Qualification</h6>
                                    <p>{{ selectedUser.qualification || 'Not specified' }}</p>
                                </div>
                            </div>
                            
                            <!-- Future section for user quiz scores -->
                            <div class="mt-4">
                                <h6 class="border-bottom pb-2">Quiz Performance</h6>
                                <p class="text-muted fst-italic">Quiz history will be added in a future update.</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="closeUserDetails">Close</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- User List -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="users.length === 0" class="alert alert-info">
                No users found in the system.
            </div>
            
            <div v-else-if="filteredUsers.length === 0" class="alert alert-info">
                No users match your search query.
            </div>
            
            <div v-else class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Qualification</th>
                            <th>Date of Birth</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in filteredUsers" :key="user.id">
                            <td>{{ user.full_name }}</td>
                            <td>{{ user.username }}</td>
                            <td>{{ user.qualification || '—' }}</td>
                            <td>{{ formatDate(user.dob) }}</td>
                            <td>
                                <span class="badge" :class="getRoleBadgeClass(user.role)">
                                    {{ user.role.toUpperCase() }}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-info" @click="viewUserDetails(user)">
                                    <i class="bi bi-eye"></i> View
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
});