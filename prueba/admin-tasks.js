class AdminTasks {
    constructor() {
        this.API_URL = 'http://localhost:3000';
        this.currentUser = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalTasks = 0;
        this.init();
    }

    async init() {
        this.checkAuth();
        await this.loadUsers();
        await this.loadTasks();
        this.setupEventListeners();
    }

    checkAuth() {
        const user = localStorage.getItem('user');
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = JSON.parse(user);
        
        if (this.currentUser.role !== 'admin') {
            window.location.href = 'tasks.html';
        }
    }

    async loadUsers() {
        try {
            const response = await fetch(`${this.API_URL}/users`);
            const users = await response.json();
            
            const assigneeSelect = document.getElementById('taskAssignee');
            if (assigneeSelect) {
                assigneeSelect.innerHTML = '<option value="">Select assignee...</option>';
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.fullName;
                    assigneeSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async loadTasks(page = 1) {
        try {
            const response = await fetch(`${this.API_URL}/tasks`);
            const tasks = await response.json();
            
            this.totalTasks = tasks.length;
            this.currentPage = page;
            
            // Aplicar filtros
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const statusFilter = document.getElementById('filterStatus').value;
            
            let filteredTasks = tasks;
            
            if (searchTerm) {
                filteredTasks = filteredTasks.filter(task => 
                    task.title.toLowerCase().includes(searchTerm) ||
                    task.category.toLowerCase().includes(searchTerm)
                );
            }
            
            if (statusFilter) {
                filteredTasks = filteredTasks.filter(task => 
                    task.status === statusFilter
                );
            }
            
            // Paginación
            const startIndex = (page - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
            
            this.populateTasksTable(paginatedTasks);
            this.updatePagination(filteredTasks.length, page);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    populateTasksTable(tasks) {
        const tableBody = document.getElementById('adminTasksTable');
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
                <td>${task.id}</td>
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
                    <button class="btn btn-sm btn-outline-primary me-1" 
                            onclick="adminTasks.editTask(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="adminTasks.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Actualizar contadores
        document.getElementById('showingCount').textContent = tasks.length;
        document.getElementById('totalCount').textContent = this.totalTasks;
    }

    updatePagination(totalItems, currentPage) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
        // Botón anterior
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `
            <a class="page-link" href="#" ${currentPage > 1 ? `onclick="adminTasks.loadTasks(${currentPage - 1})"` : ''}>
                Previous
            </a>
        `;
        pagination.appendChild(prevLi);
        
        // Números de página
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" onclick="adminTasks.loadTasks(${i})">${i}</a>`;
            pagination.appendChild(li);
        }
        
        // Botón siguiente
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `
            <a class="page-link" href="#" ${currentPage < totalPages ? `onclick="adminTasks.loadTasks(${currentPage + 1})"` : ''}>
                Next
            </a>
        `;
        pagination.appendChild(nextLi);
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
                this.loadTasks(this.currentPage);
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    }

    async editTask(taskId) {
        try {
            // Cargar datos de la tarea
            const response = await fetch(`${this.API_URL}/tasks/${taskId}`);
            const task = await response.json();
            
            // Llenar el modal con los datos
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskDueDate').value = task.dueDate;
            document.getElementById('taskDescription').value = task.description;
            
            // Guardar el ID de la tarea en un data attribute
            const saveBtn = document.getElementById('saveTaskBtn');
            saveBtn.dataset.taskId = taskId;
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('taskModal'));
            modal.show();
        } catch (error) {
            console.error('Error loading task:', error);
        }
    }

    async saveTask() {
        const formData = {
            title: document.getElementById('taskTitle').value,
            category: document.getElementById('taskCategory').value,
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            dueDate: document.getElementById('taskDueDate').value,
            description: document.getElementById('taskDescription').value,
            assignee: document.getElementById('taskAssignee').options[document.getElementById('taskAssignee').selectedIndex].text
        };

        const taskId = document.getElementById('saveTaskBtn').dataset.taskId;
        const method = taskId ? 'PUT' : 'POST';
        const url = taskId ? `${this.API_URL}/tasks/${taskId}` : `${this.API_URL}/tasks`;

        try {
            await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskId ? { id: parseInt(taskId), ...formData } : formData)
            });

            // Cerrar modal y recargar
            const modal = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
            modal.hide();
            this.loadTasks(this.currentPage);
            
            // Limpiar datos del modal
            this.resetModal();
        } catch (error) {
            console.error('Error saving task:', error);
        }
    }

    resetModal() {
        document.getElementById('modalTitle').textContent = 'Create New Task';
        document.getElementById('taskForm').reset();
        delete document.getElementById('saveTaskBtn').dataset.taskId;
    }

    setupEventListeners() {
        // Buscador
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.loadTasks(1);
            });
        }

        // Filtro de estado
        const filterStatus = document.getElementById('filterStatus');
        if (filterStatus) {
            filterStatus.addEventListener('change', () => {
                this.loadTasks(1);
            });
        }

        // Guardar tarea
        const saveTaskBtn = document.getElementById('saveTaskBtn');
        if (saveTaskBtn) {
            saveTaskBtn.addEventListener('click', () => {
                this.saveTask();
            });
        }

        // Resetear modal cuando se cierre
        const taskModal = document.getElementById('taskModal');
        if (taskModal) {
            taskModal.addEventListener('hidden.bs.modal', () => {
                this.resetModal();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.adminTasks = new AdminTasks();
});