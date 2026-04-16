const API_BASE = 'http://localhost:3000';

// Utility to humanize time
function timeSince(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yıl";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ay";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gün";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " saat";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " dakika";
    return "Şimdi";
}

// Function to fake random avatars consistently based on username string
function getAvatar(username) {
    if (!username) return 'https://i.pravatar.cc/150';
    let sum = 0;
    for(let i=0; i<username.length; i++) sum += username.charCodeAt(i);
    return `https://i.pravatar.cc/150?img=${(sum % 70) + 1}`;
}

// Check login
let currentUser = localStorage.getItem('fb_current_user');
if (!currentUser && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    
    const isProfilePage = window.location.pathname.includes('profile.html');

    // UI Initial setup
    const userDisplays = document.querySelectorAll('#current-user-display');
    const userAvatars = document.querySelectorAll('.profile-btn img, .small-avatar, .create-post-top img, .profile-avatar-wrapper img');
    userDisplays.forEach(el => el.textContent = currentUser.charAt(0).toUpperCase() + currentUser.slice(1));
    userAvatars.forEach(el => el.src = getAvatar(currentUser));

    if (isProfilePage) {
        document.querySelector('.profile-name-info h1').textContent = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);
    }

    // Double clicking the home logo logs out
    const logo = document.querySelector('.fb-logo');
    if (logo) {
        logo.addEventListener('dblclick', () => {
            localStorage.removeItem('fb_current_user');
            window.location.href = 'login.html';
        });
    }

    loadInitialData(isProfilePage);

    // Event listener for creating a post
    const postBtn = document.getElementById('post-btn');
    if (postBtn) {
        postBtn.addEventListener('click', createPost);
    }
});

async function loadInitialData(isProfilePage) {
    if (!isProfilePage) {
        await loadFeed();
        await loadSuggestions();
    } else {
        await loadUserPosts();
        await loadFriends();
    }
}

async function loadFeed() {
    const feedContainer = document.getElementById('feed-container');
    if (!feedContainer) return;
    
    try {
        const res = await fetch(`${API_BASE}/feed/${currentUser}`);
        if (!res.ok) {
            feedContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Feed yüklenemedi. Backend çalışıyor mu?</p>';
            return;
        }
        const posts = await res.json();
        renderPosts(posts, feedContainer);
    } catch (e) {
        console.error(e);
        feedContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Bağlantı hatası.</p>';
    }
}

async function loadUserPosts() {
    const feedContainer = document.getElementById('feed-container');
    if (!feedContainer) return;

    try {
        const res = await fetch(`${API_BASE}/users/${currentUser}/posts`);
        if (!res.ok) {
            feedContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Gönderiler yüklenemedi.</p>';
            return;
        }
        const posts = await res.json();
        // Since the backend might return differently, we map it
        const formattedPosts = posts.map(p => ({
            username: currentUser,
            content: p.content,
            created_at: p.created_at,
            visibility: p.visibility
        }));
        renderPosts(formattedPosts, feedContainer);
    } catch (e) {
        console.error(e);
    }
}

function renderPosts(posts, container) {
    container.innerHTML = '';
    
    if (posts.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 20px; background:white; border-radius:8px; margin-top:20px;">Henüz gönderi yok.</div>';
        return;
    }

    posts.forEach(post => {
        let visibilityIcon = 'fa-globe';
        if (post.visibility === 'friends') visibilityIcon = 'fa-user-friends';
        if (post.visibility === 'friends_of_friends') visibilityIcon = 'fa-users';
        if (post.visibility === 'private') visibilityIcon = 'fa-lock';

        const postHTML = `
            <div class="post">
                <div class="post-header">
                    <div class="post-user-info">
                        <img src="${getAvatar(post.username)}" alt="${post.username}">
                        <div>
                            <h4>${post.username.charAt(0).toUpperCase() + post.username.slice(1)}</h4>
                            <span class="post-time">${timeSince(post.created_at)} <i class="fas ${visibilityIcon}"></i></span>
                        </div>
                    </div>
                    <div class="post-options"><i class="fas fa-ellipsis-h"></i></div>
                </div>
                <div class="post-content">
                    ${post.content}
                </div>
                <div class="post-stats">
                    <div><i class="fas fa-thumbs-up" style="color:var(--primary)"></i> 0</div>
                    <div>0 Yorum</div>
                </div>
                <div class="post-actions-bar">
                    <div class="post-action">
                        <i class="far fa-thumbs-up"></i>
                        <span>Beğen</span>
                    </div>
                    <div class="post-action">
                        <i class="far fa-comment"></i>
                        <span>Yorum Yap</span>
                    </div>
                    <div class="post-action">
                        <i class="fas fa-share"></i>
                        <span>Paylaş</span>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', postHTML);
    });
}

async function createPost() {
    const content = document.getElementById('post-content').value;
    const visibility = document.getElementById('post-visibility').value;

    if (!content.trim()) return;

    try {
        const res = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser,
                content: content,
                visibility: visibility
            })
        });

        if (res.ok) {
            document.getElementById('post-content').value = '';
            
            const isProfilePage = window.location.pathname.includes('profile.html');
            if (isProfilePage) loadUserPosts();
            else loadFeed();
        } else {
            alert('Gönderi paylaşılamadı!');
        }
    } catch (e) {
        console.error(e);
        alert('Sunucuya ulaşılamadı!');
    }
}

async function loadSuggestions() {
    const list = document.getElementById('contacts-list');
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE}/users/${currentUser}/suggestions`);
        if (!res.ok) return;
        const suggestions = await res.json();
        
        list.innerHTML = '';
        suggestions.forEach(s => {
            const html = `
                <div class="sidebar-item" style="padding:5px;">
                    <img src="${getAvatar(s.username)}" alt="${s.username}">
                    <span style="flex:1;">${s.username}</span>
                    <button class="add-friend-btn" onclick="addFriend('${s.username}')" style="padding: 5px; background:var(--primary); color:white; border:none; border-radius:5px; cursor:pointer;"><i class="fas fa-user-plus"></i></button>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', html);
        });
    } catch (e) {
        console.error(e);
    }
}

async function loadFriends() {
    const list = document.getElementById('profile-friends-list');
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE}/users/${currentUser}/friends`);
        if (!res.ok) return;
        const friends = await res.json();
        
        list.innerHTML = '';
        friends.forEach(f => {
            const html = `
                <div class="friend-item">
                    <img src="${getAvatar(f.username)}" alt="${f.username}">
                    <p>${f.username}</p>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', html);
        });
    } catch (e) {
        console.error(e);
    }
}

// Global action to simulate add friend
window.addFriend = async function(toUsername) {
    try {
        // Just directly accept for simplicity of UI flow
        await fetch(`${API_BASE}/friend-request`, {
            method: 'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({from: currentUser, to: toUsername})
        });
        await fetch(`${API_BASE}/friend-accept`, {
            method: 'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({from: currentUser, to: toUsername})
        });
        alert(`${toUsername} ile arkadaş oldunuz!`);
        window.location.reload();
    } catch(e) {
        console.error(e);
    }
}
