// Authentication and User Management for Little Bug's Planner

// Import necessary functions from firebase-config.js
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getUserTasks, // Updated function
    addTaskToFirestore, // New function
    updateTaskInFirestore, // New function
    deleteTaskFromFirestore, // New function
    onAuthStateChange 
} from './firebase-config.js';
// Import getDoc and doc for getTaskData
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js'; // Import db instance

// DOM Elements
let currentUser = null;
// let tasks = []; // Remove local tasks array, data will be fetched from Firestore

// Initialize auth UI
const initAuthUI = () => {
  // Create auth modal if it doesn't exist
  if (!document.getElementById('auth-modal')) {
    const authModalHTML = `
      <div id="auth-modal" class="modal">
        <div class="modal-content">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800" id="auth-modal-title">Sign In</h2>
            <button class="text-gray-500 hover:text-gray-700" id="close-auth-modal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div id="auth-error" class="hidden bg-red-100 text-red-700 p-3 rounded-lg mb-4"></div>
          
          <div id="login-form">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="email@example.com">
            </div>
            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="********">
            </div>
            <div class="flex items-center justify-between">
              <button id="login-button" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Sign In
              </button>
              <button id="switch-to-register" class="inline-block align-baseline font-bold text-sm text-green-600 hover:text-green-800">
                Create Account
              </button>
            </div>
          </div>
          
          <div id="register-form" class="hidden">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="register-email">Email</label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="register-email" type="email" placeholder="email@example.com">
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="register-password">Password</label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="register-password" type="password" placeholder="********">
            </div>
            <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="register-password-confirm">Confirm Password</label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="register-password-confirm" type="password" placeholder="********">
            </div>
            <div class="flex items-center justify-between">
              <button id="register-button" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Register
              </button>
              <button id="switch-to-login" class="inline-block align-baseline font-bold text-sm text-green-600 hover:text-green-800">
                I already have an account
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
          <i class="fas fa-sign-in-alt mr-2"></i> Sign In
        </button>
      </div>
      <div id="user-menu" class="hidden flex space-x-2">
        <div class="bg-white bg-opacity-20 px-4 py-2 rounded-full flex items-center">
          <i class="fas fa-user mr-2"></i>
          <span id="user-email"></span>
        </div>
        <button id="logout-btn" class="bg-red-500 text-white px-3 py-2 rounded-full font-bold hover:bg-red-600 transition text-sm">
          <i class="fas fa-sign-out-alt mr-1"></i> Sign Out
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
  document.getElementById('auth-modal-title').textContent = 'Create Account';
  document.getElementById('auth-error').classList.add('hidden');
};

const switchToLogin = () => {
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('auth-modal-title').textContent = 'Sign In';
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
    showAuthError('Please complete all fields');
    return;
  }
  
  try {
    const result = await loginUser(email, password);
    if (result.success) {
      // Login successful - User state change will trigger loadUserData via observer
      // currentUser = result.user; // Set by observer
      // loadUserData(); // Triggered by observer
    } else {
      showAuthError(result.error || 'Error signing in');
    }
  } catch (error) {
    showAuthError('Error signing in: ' + error.message);
  }
};

const handleRegister = async () => {
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-password-confirm').value;
  
  if (!email || !password || !confirmPassword) {
    showAuthError('Please complete all fields');
    return;
  }
  
  if (password !== confirmPassword) {
    showAuthError('Passwords do not match');
    return;
  }
  
  try {
    const result = await registerUser(email, password);
    if (result.success) {
      // Registration successful - User state change will trigger loadUserData via observer
      // currentUser = result.user; // Set by observer
      // Initialize with empty tasks - No longer needed, Firestore handles this
      // await saveUserTasks(currentUser.uid, tasks); // Removed function
      // loadUserData(); // Triggered by observer
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
    // Reset to default tasks or empty - Clear UI instead of loading defaults
    // loadDefaultTasks(); // Remove loading default tasks on logout
    clearTasksUI(); // Add a function to clear the UI
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

// Data management
const loadUserData = async () => {
  if (!currentUser) return;
  
  try {
    const result = await getUserTasks(currentUser.uid);
    if (result.success && result.tasks) {
      // tasks = result.tasks; // Don't store globally
      
      // Call the rendering and stats functions exposed by index.html
      if (window.renderPlannerUI) {
        window.renderPlannerUI(result.tasks); 
      }
      if (window.updatePlannerStats) {
        window.updatePlannerStats(result.tasks);
      }
      
      // Setup dropzones after tasks are rendered
      // REMOVED: setupDropzones(); // This should be handled by index.html's init

    } else if (result.success && !result.tasks) {
      // User has no tasks yet
      console.log('User has no tasks yet.');
      // Clear UI and update stats (with empty array)
      if (window.renderPlannerUI) window.renderPlannerUI([]);
      if (window.updatePlannerStats) window.updatePlannerStats([]);
      // setupDropzones();
    } else {
      // Handle error getting tasks
      console.error('Error loading user tasks:', result.error);
      // Maybe show an error to the user
      // Clear UI and update stats (with empty array) as a fallback
      if (window.renderPlannerUI) window.renderPlannerUI([]);
      if (window.updatePlannerStats) window.updatePlannerStats([]);
    }
  } catch (error) {
    console.error('Critical error in loadUserData:', error);
    // Clear UI and update stats (with empty array) as a fallback
    if (window.renderPlannerUI) window.renderPlannerUI([]);
    if (window.updatePlannerStats) window.updatePlannerStats([]);
  }
};

// Remove saveTasksToFirebase as it's replaced by individual CRUD operations
/*
const saveTasksToFirebase = async () => {
  if (!currentUser) return;
  
  try {
    await saveUserTasks(currentUser.uid, tasks);
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
};
*/

// Load default tasks from JSON file - Remove this, handle logged-out state differently
/*
const loadDefaultTasks = async () => {
  try {
    const response = await fetch('little-bug-planner-data.json');
    tasks = await response.json();
    renderTasks();
  } catch (error) {
    console.error('Error loading default tasks:', error);
    tasks = [];
    renderTasks();
  }
};
*/

// Clear the tasks UI (called on logout)
const clearTasksUI = () => {
  if (window.renderPlannerUI) {
      window.renderPlannerUI([]); // Render empty array
  }
  if (window.updatePlannerStats) {
      window.updatePlannerStats([]); // Update stats with empty array
  }
  // Potentially clear other UI elements if needed
};

// Function to add a new task - uses Firestore
const addTask = async (taskData) => {
  if (!currentUser) {
    alert('You must be signed in to add tasks.');
    return { success: false, error: 'User not logged in' };
  }
  
  try {
    // Add status if missing (might happen from import)
    if (!taskData.status) taskData.status = 'todo'; 
    
    const result = await addTaskToFirestore(currentUser.uid, taskData);
    if (result.success) {
      console.log('Task added to Firestore:', result.taskId);
      loadUserData(); // Reload data to update UI
      return { success: true, taskId: result.taskId };
    } else {
      throw new Error(result.error || 'Error adding task to Firestore');
    }
  } catch (error) {
    console.error('Error in addTask:', error);
    alert('Error adding task: ' + error.message);
    return { success: false, error: error.message };
  }
};

// Function to trigger the edit modal in index.html
// MODIFIED: Calls window.handleEditRequest
const editTask = (taskId, taskStatus) => { // Accept status or fetch it if needed
  console.log(`Auth.js received edit request for task ${taskId}, status: ${taskStatus}`);
  if (window.handleEditRequest) {
    // Pass the status along if available, otherwise index.html might need to fetch it again
    window.handleEditRequest(taskId, taskStatus); 
  } else {
    console.error('handleEditRequest function not found on window object.');
  }
};

// Function to delete a task - uses Firestore
const deleteTask = async (taskId) => {
  if (!currentUser) {
    alert('You must be signed in to delete tasks.');
    return;
  }
  
  if (confirm('Are you sure you want to delete this task?')) {
    try {
      const result = await deleteTaskFromFirestore(currentUser.uid, taskId);
      if (result.success) {
        console.log('Task deleted from Firestore:', taskId);
        loadUserData(); // Reload data to update UI
      } else {
        throw new Error(result.error || 'Error deleting task from Firestore');
      }
    } catch (error) {
      console.error('Error in deleteTask:', error);
      alert('Error deleting the task: ' + error.message);
    }
  }
};

// Function to update task status - uses Firestore
const updateTaskStatus = async (taskId, newStatus) => {
  if (!currentUser) {
    alert('You must be signed in to update tasks.');
    return;
  }
  
  try {
    // Prepare partial task data for update
    const taskData = { 
        status: newStatus 
    };
    // Add completedDate if moving to 'done'
    if (newStatus === 'done') {
        // Use serverTimestamp for completedDate for consistency
        // Or new Date() if serverTimestamp is complex to get here.
        // Let's assume updateTaskInFirestore handles updatedAt, but not completedDate.
        // We might need a specific function or adjust updateTaskInFirestore.
        // For now, let's just update status. index.html handles completedDate visually?
        // taskData.completedDate = serverTimestamp(); // Needs import
    } else {
        // taskData.completedDate = null; // If moving away from done, clear it? Firestore rule?
    }

    const result = await updateTaskInFirestore(currentUser.uid, taskId, taskData);
    
    if (result.success) {
      console.log(`Task ${taskId} status updated to ${newStatus} in Firestore.`);
      loadUserData(); // Reload data to update UI
    } else {
      throw new Error(result.error || 'Error updating task status in Firestore');
    }
  } catch (error) {
    console.error('Error in updateTaskStatus:', error);
    alert('Error updating task status: ' + error.message);
  }
};

// Function to update a task completely - uses Firestore
const updateTask = async (taskId, taskData) => {
  if (!currentUser) {
    alert('You must be signed in to update tasks.');
    return { success: false, error: 'User not logged in' };
  }

  try {
    // Ensure status is included if provided, default otherwise? 
    // The taskData should come complete from the form.
    if (!taskData.status) {
        console.warn('Status missing in taskData for update, defaulting to todo');
        taskData.status = 'todo';
    }
    
    const result = await updateTaskInFirestore(currentUser.uid, taskId, taskData);
    if (result.success) {
      console.log('Task updated in Firestore:', taskId);
      loadUserData(); // Reload data to update UI
      return { success: true };
    } else {
      throw new Error(result.error || 'Error updating task in Firestore');
    }
  } catch (error) {
    console.error('Error in updateTask:', error);
    alert('Error updating task: ' + error.message);
    return { success: false, error: error.message };
  }
};

// Function to get a single task's data
const getTaskData = async (taskId) => {
  if (!currentUser) {
    console.error('Cannot get task data: User not logged in.');
    return { success: false, error: 'User not logged in' };
  }
  try {
    const taskRef = doc(db, "users", currentUser.uid, "tasks", taskId);
    const docSnap = await getDoc(taskRef);
    if (docSnap.exists()) {
      return { success: true, task: { id: docSnap.id, ...docSnap.data() } };
    } else {
      console.error("No such task found in Firestore!");
      return { success: false, error: 'Task not found' };
    }
  } catch (error) {
    console.error("Error getting task data: ", error);
    return { success: false, error: error.message };
  }
};

// Initialize auth state observer
const initAuthObserver = () => {
  onAuthStateChange((user) => {
    currentUser = user;
    updateUIForAuthState(user);
    
    if (user) {
      loadUserData();
    } else {
      // loadDefaultTasks(); // Don't load defaults
      clearTasksUI(); // Clear the UI when logged out
    }
  });
};

// Initialize the app
const initApp = () => {
  initAuthUI();
  // setupDropzones(); // Setup dropzones after initial render
  initAuthObserver();
  
  // Initial load of tasks - Handled by auth observer
  // loadDefaultTasks(); 
};

// Export functions for use in main script (or potentially index.html if needed)
// !! Removed renderTasks, createTaskCard etc. !!
export { 
    initApp, 
    addTask, 
    editTask, 
    deleteTask, 
    updateTask, 
    updateTaskStatus, // Keep exporting this one
    currentUser, 
    clearTasksUI, 
    loadUserData, 
    getTaskData // Export getTaskData
};

// Expose functions globally for index.html script
import { getUserTasks as getUserTasksFirestore } from './firebase-config.js';
window.addTask = addTask;
window.deleteTask = deleteTask;
window.updateTask = updateTask;
window.updateTaskStatus = updateTaskStatus; // Expose this function
window.getUserTasks = async () => { // Wrap getUserTasks to ensure currentUser is checked
    if (!currentUser) {
        console.error('Cannot get tasks: User not logged in.');
        return { success: false, tasks: [] };
    }
    return await getUserTasksFirestore(currentUser.uid);
};
window.getTaskData = getTaskData; // Expose getTaskData

// Auto-initialize when imported directly
initApp();