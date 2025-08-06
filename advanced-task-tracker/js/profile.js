import { auth, db, storage } from './firebase/init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const displayNameHeader = document.getElementById('display-name-header');
    const userRoleEl = document.getElementById('user-role');
    const profileBanner = document.getElementById('profile-banner');
    const colorSwatchesContainer = document.getElementById('color-swatches');
    const saveStatus = document.getElementById('save-status');
    const saveProfileBtn = document.getElementById('save-profile-btn');

    let currentUser = null;
    let selectedBannerColor = '#2C4465'; // Default
    let newAvatarFile = null;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            loadUserProfile(user.uid);
        } else {
            // If no user is logged in, redirect to the login page
            window.location.href = './index.html';
        }
    });

    async function loadUserProfile(userId) {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Populate form fields
            profileForm.elements['firstName'].value = userData.firstName || '';
            profileForm.elements['lastName'].value = userData.lastName || '';
            profileForm.elements['bio'].value = userData.bio || '';
            
            // Update UI elements
            displayNameHeader.textContent = userData.displayName || 'User';
            userRoleEl.textContent = userData.role || 'N/A';
            avatarPreview.src = userData.photoURL || './images/anonymous_image.png';
            
            // Set banner color
            selectedBannerColor = userData.bannerColor || '#2C4465';
            profileBanner.style.backgroundColor = selectedBannerColor;
            
            // Update color swatch selection
            updateColorSwatchSelection(selectedBannerColor);
        } else {
            console.error("No user profile found!");
        }
    }

    // Handle avatar preview
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            newAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                avatarPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle color swatch clicks
    colorSwatchesContainer.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (swatch) {
            selectedBannerColor = swatch.dataset.color;
            profileBanner.style.backgroundColor = selectedBannerColor;
            updateColorSwatchSelection(selectedBannerColor);
        }
    });

    function updateColorSwatchSelection(color) {
        document.querySelectorAll('.color-swatch').forEach(s => {
            s.classList.remove('selected');
            if (s.dataset.color === color) {
                s.classList.add('selected');
            }
        });
    }

    // Handle profile form submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = 'Saving...';

        try {
            let photoURL = avatarPreview.src;
            // If a new avatar file was selected, upload it
            if (newAvatarFile) {
                const avatarRef = ref(storage, `avatars/${currentUser.uid}`);
                await uploadBytes(avatarRef, newAvatarFile);
                photoURL = await getDownloadURL(avatarRef);
                newAvatarFile = null; // Reset after upload
            }

            const firstName = profileForm.elements['firstName'].value;
            const lastName = profileForm.elements['lastName'].value;
            const updatedData = {
                firstName: firstName,
                lastName: lastName,
                displayName: `${firstName} ${lastName}`,
                bio: profileForm.elements['bio'].value,
                bannerColor: selectedBannerColor,
                photoURL: photoURL
            };

            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, updatedData);
            
            // Update header immediately for better UX
            displayNameHeader.textContent = updatedData.displayName;

            // Show success message
            saveStatus.classList.remove('opacity-0');
            setTimeout(() => {
                saveStatus.classList.add('opacity-0');
            }, 3000);

        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Save Changes';
        }
    });
});
