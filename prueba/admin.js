class AdminDashboard {
    constructor() {
        this.API_URL = 'http://localhost:3000';
        this.currentUser = null;
        this.init();
    }

    async init() {
        this.checkAuth();
        await this.loadDashboardData();
        this.setupEventListeners();
    }

    checkAuth() {
        const user = localStorage.getItem('user');
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = JSON.parse(user);
        
        // verify that you are admin
        if (this.currentUser.role !== 'admin') {
            window.location.href = 'tasks.html';
        }
    }

    async loadDashboardData() {
        try {
            // Upload tasks
            const tasksResponse = await fetch(`${this.API_URL}/tasks`);
            const tasks = await tasksResponse.json();
            
            // Upload users
            const usersResponse = await fetch(`${this.API_URL}/users`);
            const users = await usersResponse.json();

            this.updateMetrics(tasks);
            this.populateTasksTable(tasks);
            this.updateUserInfo();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    updateMetrics(tasks) {
        const totalTasks = tasks.length;
        const inProgress = tasks.filter(t => t.status === 'In Progress').length;
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const pendingReview = tasks.filter(t => t.status === 'Pending').length;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('inProgress').textContent = inProgress;
        document.getElementById('completed').textContent = completed;
        document.getElementById('pendingReview').textContent = pendingReview;
        document.getElementById('totalResults').textContent = totalTasks;
    }

    populateTasksTable(tasks) {
        const tableBody = document.getElementById('tasksTable');
        tableBody.innerHTML = '';

        // Mostrar solo las primeras 5 tareas
        const tasksToShow = tasks.slice(0, 5);

        tasksToShow.forEach(task => {
            const row = document.createElement('tr');
            
            // Determinar clase de prioridad
            let priorityClass = '';
            switch(task.priority) {
                case 'High': priorityClass = 'danger'; break;
                case 'Medium': priorityClass = 'warning'; break;
                case 'Low': priorityClass = 'info'; break;
            }

            // Determinar clase de estado
            let statusClass = '';
            switch(task.status) {
                case 'Completed': statusClass = 'success'; break;
                case 'In Progress': statusClass = 'warning'; break;
                case 'Pending': statusClass = 'secondary'; break;
            }

            row.innerHTML = `
                <td>${task.title}</td>
                <td>${task.category}</td>
                <td>
                    <span class="badge bg-${priorityClass}">${task.priority}</span>
                </td>
                <td>
                    <span class="badge bg-${statusClass}">${task.status}</span>
                </td>
                <td>${task.assignee || 'No asignado'}</td>
                <td>${this.formatDate(task.dueDate)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="admin.editTask(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="admin.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    updateUserInfo() {
        if (this.currentUser) {
            const avatar = document.querySelector('.avatar');
            if (avatar) {
                const initials = this.currentUser.fullName
                    .split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase();
                avatar.textContent = initials.substring(0, 2);
            }
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'No fecha';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    async deleteTask(taskId) {
        if (confirm('¿Estás seguro de eliminar esta tarea?')) {
            try {
                await fetch(`${this.API_URL}/tasks/${taskId}`, {
                    method: 'DELETE'
                });
                this.loadDashboardData(); // Recargar datos
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    }

    editTask(taskId) {
        // Redirigir a la página de edición
        window.location.href = `admin-tasks.html?edit=${taskId}`;
    }

    setupEventListeners() {
        // Buscador de tareas
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTasks(e.target.value);
            });
        }

        // Botón de exportar
        const exportBtn = document.querySelector('.btn-outline-primary');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    }

    async searchTasks(query) {
        try {
            const response = await fetch(`${this.API_URL}/tasks?q=${query}`);
            const tasks = await response.json();
            this.populateTasksTable(tasks);
        } catch (error) {
            console.error('Error searching tasks:', error);
        }
    }

    exportData() {
        alert('Función de exportación en desarrollo');
        // En un proyecto real, aquí se implementaría la exportación a CSV/Excel
    }
}

// Inicializar dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminDashboard();
});