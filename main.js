// Main.js - Integración de Firebase con Little Bug's Planner

import { addTask, editTask, deleteTask, updateTaskStatus } from './auth.js';

// Cuando el DOM esté cargado, inicializar los eventos
document.addEventListener('DOMContentLoaded', () => {
    // Eventos para agregar tareas
    document.querySelectorAll('.add-task-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openTaskModal(btn.getAttribute('data-status'));
        });
    });

    // Evento para el botón de nueva tarea en el header
    document.getElementById('new-task-btn').addEventListener('click', () => {
        openTaskModal('todo');
    });

    // Eventos para exportar e importar datos
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    document.getElementById('import-data-btn').addEventListener('click', importData);

    // Inicializar el modal de tareas si no existe
    initTaskModal();
});

// Inicializar el modal de tareas
const initTaskModal = () => {
    if (!document.getElementById('task-modal')) {
        const taskModalHTML = `
            <div id="task-modal" class="modal">
                <div class="modal-content">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-800" id="task-modal-title">Nueva Tarea</h2>
                        <button class="text-gray-500 hover:text-gray-700" id="close-task-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="task-form">
                        <input type="hidden" id="task-id">
                        <input type="hidden" id="task-status" value="todo">
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="task-title">Título</label>
                            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="task-title" type="text" placeholder="Título de la tarea">
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="task-description">Descripción</label>
                            <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="task-description" placeholder="Descripción de la tarea" rows="3"></textarea>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-gray-700 text-sm font-bold mb-2" for="task-priority">Prioridad</label>
                                <select class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="task-priority">
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-gray-700 text-sm font-bold mb-2" for="task-due">Fecha límite</label>
                                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="task-due" type="date">
                            </div>
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="task-type">Tipo</label>
                            <select class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="task-type">
                                <option value="mandatory">Obligatorio</option>
                                <option value="bonus">Bonus</option>
                            </select>
                        </div>
                        
                        <div class="flex justify-end">
                            <button type="button" id="cancel-task-btn" class="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Cancelar
                            </button>
                            <button type="submit" id="save-task-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', taskModalHTML);
        
        // Agregar event listeners
        document.getElementById('close-task-modal').addEventListener('click', closeTaskModal);
        document.getElementById('cancel-task-btn').addEventListener('click', closeTaskModal);
        document.getElementById('task-form').addEventListener('submit', handleTaskFormSubmit);
    }
};

// Abrir el modal de tareas
const openTaskModal = (status, taskId = null) => {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const titleElement = document.getElementById('task-modal-title');
    
    // Resetear el formulario
    form.reset();
    
    // Establecer el estado de la tarea
    document.getElementById('task-status').value = status;
    
    if (taskId) {
        // Editar tarea existente
        titleElement.textContent = 'Editar Tarea';
        document.getElementById('task-id').value = taskId;
        
        // Buscar la tarea y llenar el formulario
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-due').value = task.due;
            document.getElementById('task-type').value = task.type;
        }
    } else {
        // Nueva tarea
        titleElement.textContent = 'Nueva Tarea';
        document.getElementById('task-id').value = '';
        
        // Establecer fecha actual como predeterminada
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('task-due').value = today;
    }
    
    // Mostrar el modal
    modal.style.display = 'flex';
};

// Cerrar el modal de tareas
const closeTaskModal = () => {
    const modal = document.getElementById('task-modal');
    modal.style.display = 'none';
};

// Manejar el envío del formulario de tareas
const handleTaskFormSubmit = (e) => {
    e.preventDefault();
    
    const taskId = document.getElementById('task-id').value;
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        priority: document.getElementById('task-priority').value,
        due: document.getElementById('task-due').value,
        type: document.getElementById('task-type').value,
        status: document.getElementById('task-status').value,
        view: 'planner'
    };
    
    if (!taskData.title) {
        alert('Por favor, ingresa un título para la tarea');
        return;
    }
    
    if (taskId) {
        // Actualizar tarea existente
        const taskIndex = tasks.findIndex(t => t.id === parseInt(taskId));
        if (taskIndex !== -1) {
            const updatedTask = {
                ...tasks[taskIndex],
                ...taskData
            };
            
            // Usar la función de edición de auth.js
            editTask(updatedTask);
        }
    } else {
        // Agregar nueva tarea
        addTask(taskData);
    }
    
    closeTaskModal();
};

// Exportar datos
const exportData = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'little-bug-planner-data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};

// Importar datos
const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedTasks = JSON.parse(event.target.result);
                    
                    if (Array.isArray(importedTasks)) {
                        // Reemplazar tareas actuales con las importadas
                        tasks = importedTasks;
                        renderTasks();
                        
                        // Si el usuario está autenticado, guardar en Firebase
                        if (currentUser) {
                            saveTasksToFirebase();
                        }
                        
                        alert('Datos importados correctamente');
                    } else {
                        alert('El archivo no contiene un formato válido de tareas');
                    }
                } catch (error) {
                    console.error('Error al importar datos:', error);
                    alert('Error al importar datos: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        }
    };
    
    input.click();
};