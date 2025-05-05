// Main.js - Firebase Integration with Little Bug's Planner

// Import necessary functions from auth.js and firebase-config.js
import { currentUser, addTask, updateTaskStatus, loadUserData } from './auth.js'; 
// Import Firestore functions needed for fetching single task and updating
import { getDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'; // Import serverTimestamp
import { db, updateTaskInFirestore } from './firebase-config.js'; // Import db instance AND updateTaskInFirestore

// Global variable to hold the currently fetched tasks (needed for edit lookup)
// This is a temporary measure; ideally, avoid global state if possible.
// Remove local tasks array declaration
// let currentTasks = [];

// When DOM is loaded, initialize events
document.addEventListener('DOMContentLoaded', () => {
    // Events for adding tasks
    document.querySelectorAll('.add-task-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openTaskModal(btn.getAttribute('data-status'));
        });
    });

    // Event for new task button in header
    document.getElementById('new-task-btn').addEventListener('click', () => {
        openTaskModal('todo');
    });

    // Events for exporting and importing data
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    document.getElementById('import-data-btn').addEventListener('click', importData);

    // Initialize task modal if it doesn't exist
    initTaskModal();

    // Add listener for edit task requests from auth.js
    document.addEventListener('edit-task-request', (e) => {
        const { taskId, status } = e.detail;
        console.log(`main.js received edit request for task ${taskId}`);
        openTaskModal(status, taskId);
    });

    // Add listener to update currentTasks when data is loaded in auth.js
    // This relies on auth.js dispatching an event or providing a callback
    // A simpler way for now: auth.js's renderTasks can update a global or call a function here.
    // Let's assume auth.js's renderTasks updates a global `window.currentTasks` for simplicity (not ideal)
    // A better approach would be a shared state management or event bus.
});

// Initialize task modal
const initTaskModal = () => {
    if (!document.getElementById('task-modal')) {
        const taskModalHTML = `
            <div id="task-modal" class="modal">
                <div class="modal-content">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800" id="task-modal-title">New Task</h2>
                        <button class="text-gray-500 hover:text-gray-700" id="close-task-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="task-form">
                        <input type="hidden" id="task-id">
                        <input type="hidden" id="task-status" value="todo">
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="task-title">Title</label>
                            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="task-title" type="text" placeholder="Task title">
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="task-description">Description</label>
                            <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="task-description" placeholder="Task description" rows="3"></textarea>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-gray-700 text-sm font-bold mb-2" for="task-priority">Priority</label>
                                <select class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="task-priority">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-gray-700 text-sm font-bold mb-2" for="task-due">Due date</label>
                                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="task-due" type="date">
                            </div>
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="task-type">Type</label>
                            <select class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="task-type">
                                <option value="mandatory">Mandatory</option>
                                <option value="bonus">Bonus</option>
                            </select>
                        </div>
                        
                        <div class="flex justify-end">
                            <button type="button" id="cancel-task-btn" class="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Cancel
                            </button>
                            <button type="submit" id="save-task-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', taskModalHTML);
        
        // Add event listeners
        document.getElementById('close-task-modal').addEventListener('click', closeTaskModal);
        document.getElementById('cancel-task-btn').addEventListener('click', closeTaskModal);
        document.getElementById('task-form').addEventListener('submit', handleTaskFormSubmit);
    }
};

// Open task modal - Modified to fetch task data for editing
const openTaskModal = async (status, taskId = null) => {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const titleElement = document.getElementById('task-modal-title');
    
    // Reset the form
    form.reset();
    
    // Set task status
    document.getElementById('task-status').value = status;
    
    if (taskId && currentUser) {
        // Edit existing task - Fetch data from Firestore
        titleElement.textContent = 'Edit Task';
        document.getElementById('task-id').value = taskId;
        
        try {
            const taskRef = doc(db, "users", currentUser.uid, "tasks", taskId);
            const docSnap = await getDoc(taskRef);

            if (docSnap.exists()) {
                const task = { id: docSnap.id, ...docSnap.data() };
                document.getElementById('task-title').value = task.title || '';
                document.getElementById('task-description').value = task.description || '';
                document.getElementById('task-priority').value = task.priority || 'low';
                // Handle Firestore Timestamp for due date
                let dueDate = '';
                if (task.due) {
                    if (task.due.toDate) { // Check if it's a Firestore Timestamp
                        dueDate = task.due.toDate().toISOString().split('T')[0];
                    } else if (typeof task.due === 'string') {
                        dueDate = task.due; // Assume it's already in YYYY-MM-DD format
                    }
                }
                document.getElementById('task-due').value = dueDate;
                document.getElementById('task-type').value = task.type || 'mandatory';
                // Status might be different from the column it was in if fetched directly
                document.getElementById('task-status').value = task.status || status; 
            } else {
                console.error("No such task found in Firestore!");
                alert('Error: Task not found for editing.');
                closeTaskModal();
                return;
            }
        } catch (error) {
            console.error("Error fetching task for edit: ", error);
            alert('Error loading task data.');
            closeTaskModal();
            return;
        }

    } else {
        // New task
        titleElement.textContent = 'New Task';
        document.getElementById('task-id').value = '';
        
        // Set current date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('task-due').value = today;
        document.getElementById('task-priority').value = 'medium'; // Default priority
        document.getElementById('task-type').value = 'mandatory'; // Default type
    }
    
    // Show modal
    modal.style.display = 'flex';
};

// Close task modal
const closeTaskModal = () => {
    const modal = document.getElementById('task-modal');
    modal.style.display = 'none';
};

// Handle task form submission - Modified for Firestore
const handleTaskFormSubmit = async (e) => { // Make async
    e.preventDefault();
    
    if (!currentUser) {
        alert('You must be signed in to save tasks.');
        return;
    }

    const taskId = document.getElementById('task-id').value;
    const taskData = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim(),
        priority: document.getElementById('task-priority').value,
        // Convert due date string back to a suitable format if needed, e.g., Timestamp or keep as string
        // For simplicity, let's keep it as a string 'YYYY-MM-DD' from the input
        due: document.getElementById('task-due').value, 
        type: document.getElementById('task-type').value,
        status: document.getElementById('task-status').value,
        // view: 'planner' // This might not be needed anymore
    };
    
    if (!taskData.title) {
        alert('Please enter a title for the task');
        return;
    }
    
    // Disable button to prevent multiple submissions
    const saveButton = document.getElementById('save-task-btn');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
        if (taskId) {
            // Update existing task in Firestore using centralized function
            const result = await updateTaskInFirestore(currentUser.uid, taskId, taskData);
            if (!result.success) {
                throw new Error(result.error || 'Error updating the task.');
            }
            console.log('Task updated successfully via updateTaskInFirestore:', taskId);
            
        } else {
            // Add new task - Use addTask from auth.js which calls Firestore
            await addTask(taskData); // addTask is already async and calls loadUserData on success
        }
        
        // If updating, manually reload data as addTask doesn't cover this case
        // We still need to reload after a successful update.
        if (taskId) {
            loadUserData(); // Reload data from Firestore
        }

    } catch (error) {
        console.error('Error saving task:', error);
        alert('Error saving the task: ' + error.message);
    } finally {
        // Re-enable button
        saveButton.disabled = false;
        saveButton.textContent = 'Save';
        // Close modal only on success? Or always? Let's close it always for now.
        closeTaskModal(); 
    }
};

// Export data - Needs modification for Firestore
const exportData = async () => {
    if (!currentUser) {
        alert('You must be signed in to export data.');
        return;
    }
    try {
        // Fetch current tasks directly from Firestore
        const result = await getUserTasks(currentUser.uid); // Assuming getUserTasks is available
        if (result.success) {
            // Convert Timestamps to strings for JSON compatibility
            const tasksToExport = result.tasks.map(task => ({
                ...task,
                createdAt: task.createdAt?.toDate ? task.createdAt.toDate().toISOString() : task.createdAt,
                updatedAt: task.updatedAt?.toDate ? task.updatedAt.toDate().toISOString() : task.updatedAt,
                completedDate: task.completedDate?.toDate ? task.completedDate.toDate().toISOString() : task.completedDate,
                due: task.due?.toDate ? task.due.toDate().toISOString().split('T')[0] : task.due, // Keep YYYY-MM-DD if string
            }));

            const dataStr = JSON.stringify(tasksToExport, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'little-bug-planner-data.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } else {
            alert('Error getting tasks to export: ' + result.error);
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data: ' + error.message);
    }
};

// Import data - Needs modification for Firestore
const importData = () => {
    if (!currentUser) {
        alert('You must be signed in to import data.');
        return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedTasks = JSON.parse(event.target.result);
                
                if (!Array.isArray(importedTasks)) {
                    throw new Error('The JSON file does not contain a valid task array.');
                }

                // Confirmation before proceeding (optional but recommended)
                if (!confirm(`${importedTasks.length} tasks will be imported. Do you want to continue? This will add the tasks to the existing ones.`)) {
                    return;
                }

                let successCount = 0;
                let errorCount = 0;

                // Disable import button during import
                const importButton = document.getElementById('import-data-btn');
                importButton.disabled = true;
                importButton.textContent = 'Importing...';

                for (const task of importedTasks) {
                    // Basic validation
                    if (!task.title || !task.status) {
                        console.warn('Task skipped due to missing title or status:', task);
                        errorCount++;
                        continue;
                    }

                    // Prepare data for Firestore (handle dates)
                    const taskData = {
                        title: task.title,
                        description: task.description || '',
                        priority: task.priority || 'medium',
                        due: task.due ? task.due : null, // Keep as string or null
                        type: task.type || 'mandatory',
                        status: task.status,
                        // Import original completedDate if available, otherwise null
                        completedDate: task.completedDate ? new Date(task.completedDate) : null, 
                        // Let Firestore handle createdAt/updatedAt
                    };

                    try {
                        // Use the addTask function which handles Firestore interaction
                        await addTask(taskData); 
                        successCount++;
                    } catch (err) {
                        console.error('Error importing task:', task.title, err);
                        errorCount++;
                    }
                }

                // Re-enable button
                importButton.disabled = false;
                importButton.textContent = 'Import Data';

                alert(`Import completed. ${successCount} tasks imported, ${errorCount} errors.`);
                
                // Reload data to show imported tasks
                loadUserData(); 

            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error processing JSON file: ' + error.message);
                // Re-enable button on error
                const importButton = document.getElementById('import-data-btn');
                if (importButton) {
                    importButton.disabled = false;
                    importButton.textContent = 'Import Data';
                }
            }
        };
        reader.readAsText(file);
    };
    
    fileInput.click();
};

// Helper function to get tasks (needed for edit lookup - temporary)
// This should ideally be managed within auth.js or a state manager
async function fetchTasksForEditLookup() {
    if (!currentUser) return [];
    const result = await getUserTasks(currentUser.uid);
    if (result.success) {
        return result.tasks;
    } else {
        console.error("Failed to fetch tasks for edit lookup");
        return [];
    }
}

// Make sure necessary functions are available globally if needed, or manage state better.
// Exposing openTaskModal for the event listener
window.openTaskModal = openTaskModal; 

// Import getUserTasks for exportData
import { getUserTasks } from './auth.js';