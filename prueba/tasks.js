class UserTasks {
    constructor() {
        this.API_URL = 'http://localhost:3000';
        this.currentUser = null;
        this.init();
    }

    async init() {
        this.checkAuth();
        await this.loadUserTasks();
        this.setupEventListeners();
        this.updateMetrics();
    }

    checkAuth() {
        const user = localStorage.getItem('user');
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = JSON.parse(user);
        
        // Si es admin, redirigir a dashboard
        if (this.currentUser.role === 'admin') {
            window.location.href = 'dashboard.html';
        }
    }

    async loadUserTasks() {
        try {
            // Cargar tareas del usuario actual
            const response = await fetch(`${this.API_URL}/tasks?userId=${this.currentUser.id}`);
            const tasks = await response.json();
            
            this.populateTasksTable(tasks);
            this.updateTaskCounts(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    populateTasksTable(tasks) {
        const tableBody = document.getElementById('myTasksTable');
        tableBody.innerHTML = '';

        tasks.forEach(task => {
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
                    <select class="form-select form-select-sm status-select" 
                            data-task-id="${task.id}" 
                            style="width: 120px;">
                        <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </td>
                <td>${this.formatDate(task.dueDate)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="userTasks.editTask(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="userTasks.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Agregar event listeners para los selects de estado
        this.setupStatusChangeListeners();
    }

    setupStatusChangeListeners() {
        const statusSelects = document.querySelectorAll('.status-select');
        statusSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateTaskStatus(e.target.dataset.taskId, e.target.value);
            });
        });
    }

    async updateTaskStatus(taskId, newStatus) {
        try {
            // Obtener la tarea actual
            const taskResponse = await fetch(`${this.API_URL}/tasks/${taskId}`);
            const task = await taskResponse.json();

            // Actualizar estado
            task.status = newStatus;

            await fetch(`${this.API_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });

            // Recargar datos
            await this.loadUserTasks();
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    }

    updateTaskCounts(tasks) {
        const totalTasks = tasks.length;
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const pending = tasks.filter(t => t.status === 'Pending').length;
        
        document.getElementById('myTotalTasks').textContent = totalTasks;
        document.getElementById('myCompleted').textContent = completed;
        document.getElementById('myPending').textContent = pending;

        // Calcular progreso
        const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
        }
    }

    updateMetrics() {
        // Actualizar con datos del usuario
        const totalTasks = parseInt(document.getElementById('myTotalTasks').textContent) || 0;
        const completed = parseInt(document.getElementById('myCompleted').textContent) || 0;
        
        document.querySelector('.progress-bar').style.width = '75%';
        document.querySelector('.progress-bar').textContent = '75%';
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
                this.loadUserTasks(); // Recargar datos
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    }

    editTask(taskId) {
        // En una implementación completa, esto abriría un modal de edición
        alert(`Editar tarea ${taskId} - Función en desarrollo`);
    }

    setupEventListeners() {
        // Crear nueva tarea
        const createTaskBtn = document.querySelector('[data-bs-target="#createTaskModal"]');
        if (createTaskBtn) {
            createTaskBtn.addEventListener('click', () => {
                this.showCreateTaskModal();
            });
        }

        // Guardar tarea
        const saveTaskBtn = document.querySelector('.modal-footer .btn-primary');
        if (saveTaskBtn) {
            saveTaskBtn.addEventListener('click', () => {
                this.createNewTask();
            });
        }
    }

    showCreateTaskModal() {
        // Resetear formulario
        const form = document.getElementById('createTaskForm');
        if (form) form.reset();
    }

    async createNewTask() {
        const form = document.getElementById('createTaskForm');
        if (!form) return;

        const formData = new FormData(form);
        const taskData = {
            title: formData.get('title') || document.querySelector('#createTaskForm input[type="text"]').value,
            category: formData.get('category') || document.querySelector('#createTaskForm select').value,
            priority: formData.get('priority') || document.querySelectorAll('#createTaskForm select')[1].value,
            status: formData.get('status') || document.querySelectorAll('#createTaskForm select')[2].value,
            dueDate: formData.get('dueDate') || document.querySelector('#createTaskForm input[type="date"]').value,
            description: formData.get('description') || document.querySelector('#createTaskForm textarea').value,
            userId: this.currentUser.id,
            assignee: this.currentUser.fullName
        };

        try {
            await fetch(`${this.API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });

            // Cerrar modal y recargar
            const modal = bootstrap.Modal.getInstance(document.getElementById('createTaskModal'));
            modal.hide();
            this.loadUserTasks();
        } catch (error) {
            console.error('Error creating task:', error);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.userTasks = new UserTasks();
});