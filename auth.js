// Authentication and User Management for Little Bug's Planner

import { registerUser, loginUser, logoutUser, saveUserTasks, getUserTasks, onAuthStateChange } from './firebase-config.js';

// DOM Elements
let currentUser = null;
let tasks = [];

// Initialize auth UI
const initAuthUI = () => {
  // Create auth modal if it doesn't exist
  if (!document.getElementById('auth-modal')) {
    const authModalHTML = `
      <div id="auth-modal" class="modal">
        <div class="modal-content">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800" id="auth-modal-title">Iniciar Sesión</h2>
            <button class="text-gray-500 hover:text-gray-700" id="close-auth-modal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div id="auth-error" class="hidden bg-red-100 text-red-700 p-3 rounded-lg mb-4"></div>
          
          <div id="login-form">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="email@ejemplo.com">
            </div>
            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Contraseña</label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="********">
            </div>
            <div class="flex items-center justify-between">
              <button id="login-button" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Iniciar Sesión
              </button>
              <button id="switch-to-register" class="inline-block align-baseline font-bold text-sm text-green-600 hover:text-green-800">
                Crear Cuenta
              </button>
            </div>
          </div>
          
          <div id="register-form" class="hidden">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="register-email">Email</label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="register-email" type="email" placeholder="email@ejemplo.com">
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="register-password">Contraseña</label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="register-password" type="password" placeholder="********">
            </div>
            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="register-password-confirm">Confirmar Contraseña</label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="register-password-confirm" type="password" placeholder="********">
            </div>
            <div class="flex items-center justify-between">
              <button id="register-button" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Registrarse
              </button>
              <button id="switch-to-login" class="inline-block align-baseline font-bold text-sm text-green-600 hover:text-green-800">
                Ya tengo cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', authModalHTML);
    
    // Add event listeners
    document.getElementById('close-auth-modal').addEventListener('click', closeAuthModal);
    document.getElementById('login-button').addEventListener('click', handleLogin);
    document.getElementById('register-button').addEventListener('click', handleRegister);
    document.getElementById('switch-to-register').addEventListener('click', switchToRegister);
    document.getElementById('switch-to-login').addEventListener('click', switchToLogin);
  }
  
  // Add auth buttons to header if they don't exist
  if (!document.getElementById('auth-buttons')) {
    const headerButtonsContainer = document.querySelector('.header-bg .flex.space-x-2');
    const authButtonsHTML = `
      <div id="auth-buttons" class="flex space-x-2">
        <button id="login-btn" class="bg-white text-green-700 px-4 py-2 rounded-full font-bold hover:bg-gray-100 transition">
          <i class="fas fa-sign-in-alt mr-2"></i> Iniciar Sesión
        </button>
      </div>
      <div id="user-menu" class="hidden flex space-x-2">
        <div class="bg-white bg-opacity-20 px-4 py-2 rounded-full flex items-center">
          <i class="fas fa-user mr-2"></i>
          <span id="user-email"></span>
        </div>
        <button id="logout-btn" class="bg-red-500 text-white px-3 py-2 rounded-full font-bold hover:bg-red-600 transition text-sm">
          <i class="fas fa-sign-out-alt mr-1"></i> Salir
        </button>
      </div>
    `;
    
    headerButtonsContainer.insertAdjacentHTML('beforebegin', authButtonsHTML);
    
    // Add event listeners
    document.getElementById('login-btn').addEventListener('click', openAuthModal);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
  }
};

// Auth UI functions
const openAuthModal = () => {
  const modal = document.getElementById('auth-modal');
  modal.style.display = 'flex';
};

const closeAuthModal = () => {
  const modal = document.getElementById('auth-modal');
  modal.style.display = 'none';
  clearAuthForms();
};

const switchToRegister = () => {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
  document.getElementById('auth-modal-title').textContent = 'Crear Cuenta';
  document.getElementById('auth-error').classList.add('hidden');
};

const switchToLogin = () => {
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('auth-modal-title').textContent = 'Iniciar Sesión';
  document.getElementById('auth-error').classList.add('hidden');
};

const clearAuthForms = () => {
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
  document.getElementById('register-email').value = '';
  document.getElementById('register-password').value = '';
  document.getElementById('register-password-confirm').value = '';
  document.getElementById('auth-error').classList.add('hidden');
};

const showAuthError = (message) => {
  const errorElement = document.getElementById('auth-error');
  errorElement.textContent = message;
  errorElement.classList.remove('hidden');
};

const updateUIForAuthState = (user) => {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  
  if (user) {
    // User is signed in
    authButtons.classList.add('hidden');
    userMenu.classList.remove('hidden');
    document.getElementById('user-email').textContent = user.email;
    closeAuthModal();
  } else {
    // User is signed out
    authButtons.classList.remove('hidden');
    userMenu.classList.add('hidden');
  }
};

// Auth handlers
const handleLogin = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    showAuthError('Por favor, completa todos los campos');
    return;
  }
  
  try {
    const result = await loginUser(email, password);
    if (result.success) {
      // Login successful
      currentUser = result.user;
      loadUserData();
    } else {
      showAuthError(result.error || 'Error al iniciar sesión');
    }
  } catch (error) {
    showAuthError('Error al iniciar sesión: ' + error.message);
  }
};

const handleRegister = async () => {
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-password-confirm').value;
  
  if (!email || !password || !confirmPassword) {
    showAuthError('Por favor, completa todos los campos');
    return;
  }
  
  if (password !== confirmPassword) {
    showAuthError('Las contraseñas no coinciden');
    return;
  }
  
  try {
    const result = await registerUser(email, password);
    if (result.success) {
      // Registration successful
      currentUser = result.user;
      // Initialize with empty tasks
      await saveUserTasks(currentUser.uid, tasks);
      loadUserData();
    } else {
      showAuthError(result.error || 'Error al registrarse');
    }
  } catch (error) {
    showAuthError('Error al registrarse: ' + error.message);
  }
};

const handleLogout = async () => {
  try {
    await logoutUser();
    currentUser = null;
    // Reset to default tasks or empty
    loadDefaultTasks();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};

// Data management
const loadUserData = async () => {
  if (!currentUser) return;
  
  try {
    const result = await getUserTasks(currentUser.uid);
    if (result.success && result.tasks) {
      tasks = result.tasks;
      renderTasks();
    } else {
      console.error('Error al cargar tareas:', result.error);
    }
  } catch (error) {
    console.error('Error al cargar datos del usuario:', error);
  }
};

const saveTasksToFirebase = async () => {
  if (!currentUser) return;
  
  try {
    await saveUserTasks(currentUser.uid, tasks);
  } catch (error) {
    console.error('Error al guardar tareas:', error);
  }
};

// Load default tasks from JSON file
const loadDefaultTasks = async () => {
  try {
    const response = await fetch('little-bug-planner-data.json');
    tasks = await response.json();
    renderTasks();
  } catch (error) {
    console.error('Error al cargar tareas predeterminadas:', error);
    tasks = [];
    renderTasks();
  }
};

// Render tasks to UI
const renderTasks = () => {
  // Clear all task lists
  document.querySelectorAll('.task-list').forEach(list => {
    list.innerHTML = '';
  });
  
  // Group tasks by status
  const todoTasks = tasks.filter(task => task.status === 'todo');
  const progressTasks = tasks.filter(task => task.status === 'progress');
  const doneTasks = tasks.filter(task => task.status === 'done');
  
  // Update counters
  document.getElementById('todo-count').textContent = todoTasks.length;
  document.getElementById('progress-count').textContent = progressTasks.length;
  document.getElementById('done-count').textContent = doneTasks.length;
  document.getElementById('todo-count-badge').textContent = `${todoTasks.length} tasks`;
  document.getElementById('progress-count-badge').textContent = `${progressTasks.length} tasks`;
  document.getElementById('done-count-badge').textContent = `${doneTasks.length} tasks`;
  
  // Calculate completion percentage
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;
  document.getElementById('completion-percentage').textContent = `${completionPercentage}%`;
  document.getElementById('progress-fill').style.width = `${completionPercentage}%`;
  
  // Update last completed, current task, and next priority
  if (doneTasks.length > 0) {
    const lastCompleted = doneTasks.sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))[0];
    document.getElementById('last-completed').textContent = lastCompleted.title;
  }
  
  if (progressTasks.length > 0) {
    document.getElementById('current-task').textContent = progressTasks[0].title;
  }
  
  if (todoTasks.length > 0) {
    const nextPriority = todoTasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })[0];
    document.getElementById('next-priority').textContent = nextPriority.title;
  }
  
  // Render tasks to their respective columns
  renderTasksToColumn(todoTasks, 'todo');
  renderTasksToColumn(progressTasks, 'progress');
  renderTasksToColumn(doneTasks, 'done');
};

const renderTasksToColumn = (tasks, status) => {
  const column = document.querySelector(`.task-list[data-status="${status}"]`);
  
  tasks.forEach(task => {
    const taskCard = createTaskCard(task);
    column.appendChild(taskCard);
  });
};

const createTaskCard = (task) => {
  const taskCard = document.createElement('div');
  taskCard.className = `task-card p-4 bg-white rounded-lg shadow-sm ${task.priority ? 'priority-' + task.priority : ''}`;
  taskCard.setAttribute('data-id', task.id);
  taskCard.setAttribute('draggable', 'true');
  
  taskCard.innerHTML = `
    <div class="flex justify-between items-start mb-2">
      <h4 class="font-bold">${task.title}</h4>
      <div class="flex space-x-1">
        <button class="edit-task-btn text-gray-500 hover:text-blue-500">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-task-btn text-gray-500 hover:text-red-500">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <p class="text-sm text-gray-600 mb-3">${task.description}</p>
    <div class="flex justify-between items-center text-xs">
      <span class="${task.priority ? 'priority-' + task.priority : ''} px-2 py-1 rounded-full">
        ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
      </span>
      <span class="text-gray-500">
        <i class="far fa-calendar-alt mr-1"></i> ${task.due}
      </span>
    </div>
  `;
  
  // Add event listeners
  taskCard.addEventListener('dragstart', handleDragStart);
  taskCard.addEventListener('dragend', handleDragEnd);
  
  taskCard.querySelector('.edit-task-btn').addEventListener('click', () => {
    editTask(task.id);
  });
  
  taskCard.querySelector('.delete-task-btn').addEventListener('click', () => {
    deleteTask(task.id);
  });
  
  return taskCard;
};

// Task CRUD operations
const addTask = (taskData) => {
  // Generate a new ID
  const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
  
  const newTask = {
    id: newId,
    ...taskData,
    completedDate: null
  };
  
  tasks.push(newTask);
  renderTasks();
  saveTasksToFirebase();
};

const editTask = (taskId) => {
  // Implementation for editing a task
  // This would open a modal with the task data for editing
};

const deleteTask = (taskId) => {
  tasks = tasks.filter(task => task.id !== taskId);
  renderTasks();
  saveTasksToFirebase();
};

const updateTaskStatus = (taskId, newStatus) => {
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    tasks[taskIndex].status = newStatus;
    
    // If task is marked as done, set completed date
    if (newStatus === 'done') {
      tasks[taskIndex].completedDate = new Date().toISOString().split('T')[0];
    } else {
      tasks[taskIndex].completedDate = null;
    }
    
    renderTasks();
    saveTasksToFirebase();
  }
};

// Drag and drop functionality
let draggedTask = null;

const handleDragStart = (e) => {
  draggedTask = e.target;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
};

const handleDragEnd = (e) => {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.dropzone').forEach(zone => {
    zone.classList.remove('active');
  });
};

const setupDropzones = () => {
  const dropzones = document.querySelectorAll('.dropzone');
  
  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('active');
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('active');
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('active');
      
      const taskId = parseInt(e.dataTransfer.getData('text/plain'));
      const newStatus = zone.getAttribute('data-status');
      
      updateTaskStatus(taskId, newStatus);
    });
  });
};

// Initialize auth state observer
const initAuthObserver = () => {
  onAuthStateChange((user) => {
    currentUser = user;
    updateUIForAuthState(user);
    
    if (user) {
      loadUserData();
    } else {
      loadDefaultTasks();
    }
  });
};

// Initialize the app
const initApp = () => {
  initAuthUI();
  setupDropzones();
  initAuthObserver();
  
  // Initial load of tasks
  loadDefaultTasks();
};

// Export functions for use in main script
export { initApp, addTask, editTask, deleteTask, updateTaskStatus, tasks, currentUser, saveTasksToFirebase, renderTasks };

// Auto-initialize when imported directly
initApp();