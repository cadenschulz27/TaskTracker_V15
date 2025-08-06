/**
 * Triggers a confetti burst animation from the center of the screen.
 * This function is self-contained and does not require any external libraries.
 */
export function triggerConfetti() {
    const confettiCount = 150;
    const colors = ['#FFC828', '#2C4465', '#C1E0F9', '#EF4444', '#22C55E'];

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Style the confetti piece
        confetti.style.position = 'fixed';
        confetti.style.left = '50%';
        confetti.style.top = '50%';
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = `${Math.random() * 10 + 5}px`;
        confetti.style.backgroundColor = color;
        confetti.style.opacity = '1';
        confetti.style.zIndex = '1000'; // Ensure it's on top of other content
        confetti.style.pointerEvents = 'none'; // Prevent confetti from blocking clicks

        document.body.appendChild(confetti);

        // Animate the confetti piece
        const angle = Math.random() * 2 * Math.PI; // Random direction
        const distance = Math.random() * 200 + 150;  // Random distance
        const translateX = Math.cos(angle) * distance;
        const translateY = Math.sin(angle) * distance * 2; // Make it fall down more
        const rotation = Math.random() * 720 - 360; // Random rotation

        const animation = confetti.animate([
            { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
            { transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${rotation}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 1500 + 1000, // Random duration
            easing: 'cubic-bezier(0.1, 0.5, 0.5, 1)',
            fill: 'forwards'
        });

        // Clean up the DOM by removing the element after the animation finishes
        animation.onfinish = () => {
            confetti.remove();
        };
    }
}