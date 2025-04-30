// Firebase configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// Update Firestore imports for CRUD operations
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, getDocs, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyByM4xZXjTZU5zKx7F_EPPHUXwhO6rObzs",
    authDomain: "littlebugplanner.firebaseapp.com",
    projectId: "littlebugplanner",
    storageBucket: "littlebugplanner.firebasestorage.app",
    messagingSenderId: "805622750088",
    appId: "1:805622750088:web:4fb24c3e0ca95d1fa2783d",
    measurementId: "G-VSQLFGGNZZ"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth functions
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create user document in Firestore (without initial tasks array)
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: email,
      createdAt: serverTimestamp() // Use server timestamp
      // tasks: [] // Removed initial empty tasks array
    });
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Data functions (Task CRUD)

// Get all tasks for a user from the 'tasks' subcollection
export const getUserTasks = async (userId) => {
  try {
    const tasksCol = collection(db, "users", userId, "tasks");
    const q = query(tasksCol); // Add ordering later if needed, e.g., orderBy('createdAt')
    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, tasks: tasks };
  } catch (error) {
    console.error("Error getting tasks: ", error);
    return { success: false, error: error.message };
  }
};

// Add a new task to the 'tasks' subcollection
export const addTaskToFirestore = async (userId, taskData) => {
  try {
    const tasksCol = collection(db, "users", userId, "tasks");
    const docRef = await addDoc(tasksCol, {
      ...taskData,
      createdAt: serverTimestamp() // Add creation timestamp
    });
    return { success: true, taskId: docRef.id };
  } catch (error) {
    console.error("Error adding task: ", error);
    return { success: false, error: error.message };
  }
};

// Update an existing task in the 'tasks' subcollection
export const updateTaskInFirestore = async (userId, taskId, taskData) => {
  try {
    const taskRef = doc(db, "users", userId, "tasks", taskId);
    await updateDoc(taskRef, {
        ...taskData,
        updatedAt: serverTimestamp() // Add update timestamp
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating task: ", error);
    return { success: false, error: error.message };
  }
};

// Delete a task from the 'tasks' subcollection
export const deleteTaskFromFirestore = async (userId, taskId) => {
  try {
    const taskRef = doc(db, "users", userId, "tasks", taskId);
    await deleteDoc(taskRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting task: ", error);
    return { success: false, error: error.message };
  }
};


// Remove the old saveUserTasks function as it's replaced by individual CRUD
/*
export const saveUserTasks = async (userId, tasks) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      tasks: tasks
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
*/

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};