class Auth {
    constructor() {
        this.API_URL = 'http://localhost:3000';
        this.init();
    }

    init() {
        this.checkSession();
        this.setupEventListeners();
    }

    checkSession() {
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            this.redirectBasedOnRole(userData.role);
        }
    }

    redirectBasedOnRole(role) {
        if (role === 'admin') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'tasks.html';
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.API_URL}/users?email=${email}`);
            const users = await response.json();

            if (users.length === 0) {
                this.showAlert('Usuario no encontrado', 'danger');
                return;
            }

            const user = users[0];

            if (user.password === password) {
                // Guardar sesión
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('isLoggedIn', 'true');
                
                // Redirigir según rol
                this.redirectBasedOnRole(user.role);
            } else {
                this.showAlert('Contraseña incorrecta', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error del servidor', 'danger');
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const department = document.getElementById('department').value;
        const phone = document.getElementById('phone').value;

        // Validaciones
        if (password !== confirmPassword) {
            this.showAlert('Las contraseñas no coinciden', 'danger');
            return;
        }

        // Verificar si el usuario ya existe
        try {
            const response = await fetch(`${this.API_URL}/users?email=${email}`);
            const existingUsers = await response.json();

            if (existingUsers.length > 0) {
                this.showAlert('El email ya está registrado', 'danger');
                return;
            }

            // Crear nuevo usuario
            const newUser = {
                fullName,
                email,
                password,
                role: 'user',
                department,
                phone,
                employeeId: `CZ-${Math.floor(100000 + Math.random() * 900000)}`,
                joinDate: new Date().toISOString().split('T')[0]
            };

            const postResponse = await fetch(`${this.API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });

            if (postResponse.ok) {
                this.showAlert('Registro exitoso', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error del servidor', 'danger');
        }
    }

    showAlert(message, type) {
        // Crear alerta Bootstrap
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
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    static logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new Auth();
    
    // Manejar logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
});