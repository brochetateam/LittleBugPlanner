<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

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
  const analytics = getAnalytics(app);
</script>