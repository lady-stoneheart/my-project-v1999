// social-feed.js

// Initialize Poll Options Container
const pollOptionsContainer = document.getElementById('poll-options');

// Function to generate HTML for a post
function generatePostHTML(post) {
    return `<div class='post'>\n        <h2>${post.title}</h2>\n        <p>${post.body}</p>\n    </div>`;
}

// Set up feed listener to handle new posts
function setupFeedListener() {
    const feedElement = document.getElementById('feed');
    feedElement.addEventListener('newPost', function(event) {
        const postHTML = generatePostHTML(event.detail);
        feedElement.insertAdjacentHTML('beforeend', postHTML);
    });
}

// Initialize the feed
function initializeFeed() {
    setupFeedListener();
    // Load existing posts, if any
    const existingPosts = [ /* Sample posts array */ ];
    existingPosts.forEach(post => {
        const postHTML = generatePostHTML(post);
        document.getElementById('feed').insertAdjacentHTML('beforeend', postHTML);
    });
}

// Call initializeFeed on script load
initializeFeed();
