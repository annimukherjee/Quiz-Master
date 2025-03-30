// app/static/js/components/user/ExportManager.js
Vue.component('export-manager', {
    data() {
        return {
            exports: [],
            loading: false,
            exportInProgress: false,
            error: null,
            checkingInterval: null
        };
    },
    created() {
        this.fetchExports();
    },
    beforeDestroy() {
        if (this.checkingInterval) {
            clearInterval(this.checkingInterval);
        }
    },
    methods: {
        async fetchExports() {
            this.loading = true;
            try {
                const response = await axios.get('/api/user/exports');
                this.exports = response.data.exports;
                this.error = null;
                
                // Start checking pending exports
                this.startCheckingPendingExports();
            } catch (error) {
                console.error('Error fetching exports:', error);
                this.error = 'Failed to load export history. Please try again.';
            } finally {
                this.loading = false;
            }
        },
        startCheckingPendingExports() {
            // Clear any existing interval
            if (this.checkingInterval) {
                clearInterval(this.checkingInterval);
            }
            
            // Check if there are any pending exports
            const hasPendingExports = this.exports.some(exp => exp.status === 'pending');
            
            if (hasPendingExports) {
                // Start polling for updates every 3 seconds
                this.checkingInterval = setInterval(() => {
                    this.checkPendingExports();
                }, 3000);
            }
        },
        async checkPendingExports() {
            const pendingExports = this.exports.filter(exp => exp.status === 'pending');
            let updatedAny = false;
            
            for (const exp of pendingExports) {
                try {
                    const response = await axios.get(`/api/user/export/${exp.id}`);
                    const updated = response.data.export;
                    
                    // Update export in the list
                    if (updated.status !== 'pending') {
                        updatedAny = true;
                        const index = this.exports.findIndex(e => e.id === exp.id);
                        if (index !== -1) {
                            this.exports.splice(index, 1, updated);
                        }
                    }
                } catch (error) {
                    console.error(`Error checking export ${exp.id}:`, error);
                }
            }
            
            // If all exports are now complete, stop checking
            if (updatedAny && !this.exports.some(exp => exp.status === 'pending')) {
                clearInterval(this.checkingInterval);
                this.checkingInterval = null;
            }
        },
        async requestExport() {
            if (this.exportInProgress) return;
            
            this.exportInProgress = true;
            try {
                const response = await axios.post('/api/user/export/quiz-history');
                this.exports.unshift({
                    id: response.data.export_id,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    file_name: null,
                    completed_at: null
                });
                this.error = null;
                
                // Start checking for updates
                this.startCheckingPendingExports();
            } catch (error) {
                console.error('Error requesting export:', error);
                this.error = 'Failed to request export. Please try again.';
            } finally {
                this.exportInProgress = false;
            }
        },
        downloadExport(exportId) {
            window.location.href = `/api/user/export/${exportId}/download`;
        },
        formatDate(dateString) {
            if (!dateString) return '';
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        },
        getStatusBadgeClass(status) {
            switch (status) {
                case 'completed': return 'bg-success';
                case 'pending': return 'bg-warning';
                case 'failed': return 'bg-danger';
                default: return 'bg-secondary';
            }
        }
    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Export Quiz History</h2>
                <button 
                    class="btn btn-primary" 
                    @click="requestExport" 
                    :disabled="exportInProgress"
                >
                    <span v-if="exportInProgress" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-download me-2"></i>
                    Request CSV Export
                </button>
            </div>
            
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <div class="card mb-4">
                <div class="card-header bg-light">
                    <h5 class="mb-0">About Quiz History Exports</h5>
                </div>
                <div class="card-body">
                    <p>The CSV export includes details about all the quizzes you've taken, including:</p>
                    <ul>
                        <li>Date and time of your attempt</li>
                        <li>Subject and chapter information</li>
                        <li>Your score and performance percentage</li>
                    </ul>
                    <p class="text-muted">
                        <i class="bi bi-info-circle me-2"></i>
                        Exports are processed in the background and may take a few moments to complete.
                    </p>
                </div>
            </div>
            
            <h3 class="mb-3">Export History</h3>
            
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            
            <div v-else-if="exports.length === 0" class="alert alert-info">
                <h5>No exports yet</h5>
                <p>You haven't requested any exports yet. Click the "Request CSV Export" button to create your first export.</p>
            </div>
            
            <div v-else class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Requested</th>
                            <th>Status</th>
                            <th>Completed</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="exp in exports" :key="exp.id">
                            <td>{{ formatDate(exp.created_at) }}</td>
                            <td>
                                <span class="badge" :class="getStatusBadgeClass(exp.status)">
                                    {{ exp.status.toUpperCase() }}
                                </span>
                            </td>
                            <td>{{ exp.completed_at ? formatDate(exp.completed_at) : '—' }}</td>
                            <td>
                                <button 
                                    v-if="exp.status === 'completed'" 
                                    class="btn btn-sm btn-success" 
                                    @click="downloadExport(exp.id)"
                                >
                                    <i class="bi bi-download me-1"></i> Download
                                </button>
                                <div v-else-if="exp.status === 'pending'" class="text-muted">
                                    <span class="spinner-border spinner-border-sm me-1"></span>
                                    Processing...
                                </div>
                                <span v-else class="text-danger">
                                    <i class="bi bi-exclamation-triangle me-1"></i>
                                    Failed
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
});