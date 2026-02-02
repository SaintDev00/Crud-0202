class UserProfile {
    constructor() {
        this.API_URL = 'http://localhost:3000';
        this.currentUser = null;
        this.init();
    }

    async init() {
        this.checkAuth();
        this.loadUserProfile();
        this.setupEventListeners();
    }

    checkAuth() {
        const user = localStorage.getItem('user');
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = JSON.parse(user);
    }

    loadUserProfile() {
        if (!this.currentUser) return;

        // Actualizar información en la página
        const elements = {
            'userName': this.currentUser.fullName,
            'userRole': this.currentUser.role === 'admin' ? 'System Admin' : 'User',
            'userEmail': this.currentUser.email,
            'userPhone': this.currentUser.phone || 'No especificado',
            'userDepartment': this.currentUser.department || 'No especificado',
            'userJoinDate': this.formatDate(this.currentUser.joinDate),
            'employeeId': this.currentUser.employeeId || 'No asignado',
            'taskCount': '154' // Este dato vendría de la API
        };

        // Actualizar cada elemento
        Object.keys(elements).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = elements[key];
            }
        });

        // Actualizar avatar
        const avatar = document.querySelector('.avatar');
        if (avatar && this.currentUser.fullName) {
            const initials = this.currentUser.fullName
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase();
            avatar.textContent = initials.substring(0, 2);
        }

        // Actualizar título de la página
        document.title = `CRUDTASK - ${this.currentUser.fullName}`;
    }

    formatDate(dateString) {
        if (!dateString) return 'No fecha';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    setupEventListeners() {
        // Botón de editar perfil
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.enableEditMode();
            });
        }

        // Botón de guardar cambios
        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveProfile();
            });
        }

        // Botón de cancelar
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelEditMode();
            });
        }

        // Botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    enableEditMode() {
        // Habilitar campos editables
        const editFields = document.querySelectorAll('.editable-field');
        editFields.forEach(field => {
            field.removeAttribute('readonly');
            field.classList.add('editing');
        });

        // Mostrar botones de guardar/cancelar
        document.getElementById('editProfileBtn').classList.add('d-none');
        document.getElementById('saveProfileBtn').classList.remove('d-none');
        document.getElementById('cancelEditBtn').classList.remove('d-none');
    }

    cancelEditMode() {
        // Deshabilitar campos editables
        const editFields = document.querySelectorAll('.editable-field');
        editFields.forEach(field => {
            field.setAttribute('readonly', true);
            field.classList.remove('editing');
        });

        // Restaurar valores originales
        this.loadUserProfile();

        // Mostrar botón de editar
        document.getElementById('editProfileBtn').classList.remove('d-none');
        document.getElementById('saveProfileBtn').classList.add('d-none');
        document.getElementById('cancelEditBtn').classList.add('d-none');
    }

    async saveProfile() {
        // Recopilar datos del formulario
        const updatedData = {
            fullName: document.getElementById('fullNameInput').value,
            phone: document.getElementById('phoneInput').value,
            department: document.getElementById('departmentInput').value
        };

        try {
            // Actualizar en JSON Server
            await fetch(`${this.API_URL}/users/${this.currentUser.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            // Actualizar usuario en localStorage
            Object.assign(this.currentUser, updatedData);
            localStorage.setItem('user', JSON.stringify(this.currentUser));

            // Salir del modo edición
            this.cancelEditMode();

            // Mostrar mensaje de éxito
            this.showAlert('Perfil actualizado correctamente', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showAlert('Error al actualizar el perfil', 'danger');
        }
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new UserProfile();
});