import { formatTimestamp } from './formatTimestamp.js';

/**
 * Renders an array of chat messages into the chat container, including user avatars.
 * @param {Array<object>} messages - The array of message objects to render.
 * @param {object} currentUser - The currently logged-in user object.
 * @param {Array<object>} allUsers - An array of all user objects in the system.
 */
export function renderChat(messages, currentUser, allUsers) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    container.innerHTML = ''; // Clear previous messages

    messages.forEach(msg => {
        const isCurrentUser = msg.authorId === currentUser.id;
        const authorData = allUsers.find(u => u.id === msg.authorId);
        
        const avatarUrl = authorData?.photoURL || './images/anonymous_image.png';

        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex items-start gap-3 mb-4 ${isCurrentUser ? 'flex-row-reverse' : ''}`;

        const avatarImg = document.createElement('img');
        avatarImg.src = avatarUrl;
        avatarImg.alt = msg.authorName;
        avatarImg.className = 'w-10 h-10 rounded-full object-cover';

        const messageBubble = document.createElement('div');
        messageBubble.className = `p-3 rounded-lg max-w-xs md:max-w-md ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-slate-200 text-ink'}`;

        const authorEl = document.createElement('p');
        authorEl.className = 'text-xs font-bold mb-1';
        authorEl.textContent = msg.authorName;

        const textEl = document.createElement('p');
        textEl.className = 'text-sm break-words';
        textEl.textContent = msg.text;

        const timeEl = document.createElement('p');
        timeEl.className = `text-xs mt-2 ${isCurrentUser ? 'text-blue-200' : 'text-slate-500'}`;
        timeEl.textContent = msg.timestamp ? formatTimestamp(msg.timestamp) : 'Sending...';

        messageBubble.appendChild(authorEl);
        messageBubble.appendChild(textEl);
        messageBubble.appendChild(timeEl);
        
        messageWrapper.appendChild(avatarImg);
        messageWrapper.appendChild(messageBubble);
        container.appendChild(messageWrapper);
    });

    // Auto-scroll to the bottom
    container.scrollTop = container.scrollHeight;
}
