import { auth, db } from './firebase/init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Page-Specific Logic ---
// This code determines which form is on the page (login or signup) and attaches the correct event handler.
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', handleSignUp);
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

// --- Function Definitions ---
async function handleSignUp(e) {
    e.preventDefault();
    const firstName = signupForm.firstName.value;
    const lastName = signupForm.lastName.value;
    const role = signupForm.role.value;
    const email = signupForm.email.value;
    const password = signupForm.password.value;
    
    try {
        // Step 1: Create user in the Firebase Auth service using the imported 'auth' instance.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 2: Create a corresponding user profile in Firestore using the imported 'db' instance.
        await setDoc(doc(db, "users", user.uid), {
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            role,
            email
        });

        alert('Account created successfully! Please log in.');
        window.location.href = './index.html';
    } catch (error) {
        console.error("Error creating account: ", error);
        alert(`Could not create account: ${error.message}`);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // On successful login, redirect to the main application.
        window.location.href = './app.html';
    } catch (error) {
        console.error("Error logging in: ", error);
        alert(`Login failed: ${error.message}`);
    }
}