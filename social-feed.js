import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    increment,
    deleteDoc,
    getDoc,
    runTransaction,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let feedUnsubscribe = null;
const SUPER_ADMIN_UID = "HYnkQqkR3cNKUs2Ty3eqGlUXxdV2";
const ADMIN_AVATAR = "https://i.ibb.co/d00DSvT5/IMG-2136.jpg";

const compressImage = (base64Str, maxWidth = 1020, maxHeight = 1020) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } 
            else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
    });
};

export const initSocialFeed = (auth, db, isAdmin = false) => {
    const container = document.getElementById('social-feed-container');
    const adminPanel = document.getElementById('feed-admin-panel');
    const postBtn = document.getElementById('feed-submit-post');
    const pollToggle = document.getElementById('btn-toggle-poll');
    const pollCreator = document.getElementById('poll-creator');
    const pollOptionsContainer = document.getElementById('poll-options-container');
    const addOptionBtn = document.getElementById('add-poll-option');
    const imageInput = document.getElementById('feed-image-input');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.getElementById('image-preview-container');

    if (feedUnsubscribe) { feedUnsubscribe(); feedUnsubscribe = null; }

    let currentImageData = '';
    let isPollActive = false;
    if (!container) return;

    window.toggleAdminMenu = (postId) => {
        const menu = document.getElementById(`admin-menu-${postId}`);
        if (menu) menu.classList.toggle('hidden');
    };

    window.deletePost = async (postId) => {
        if (!isAdmin) return;
        if (confirm("ARE YOU SURE YOU WANT TO DELETE THIS POST?")) {
            try {
                await deleteDoc(doc(db, 'social_posts', postId));
            } catch (err) { alert("Delete failed."); }
        }
    };

    window.enableEditMode = (postId) => {
        const contentDiv = document.getElementById(`post-content-${postId}`);
        if(!contentDiv) return;
        const menu = document.getElementById(`admin-menu-${postId}`);
        if(menu) menu.classList.add('hidden');
        const currentText = contentDiv.innerText;
        contentDiv.setAttribute('data-original', currentText);
        contentDiv.innerHTML = `
            <textarea id="edit-area-${postId}" class="w-full p-4 border border-neutral-200 rounded-2xl bg-neutral-50 text-black font-bold uppercase tracking-tight text-sm outline-none resize-none mb-3 min-h-[120px] focus:bg-white focus:ring-2 focus:ring-black/5 transition-all shadow-inner">${currentText}</textarea>
            <div class="flex gap-2 justify-end">
                <button onclick="window.cancelEdit('${postId}')" class="px-5 py-2.5 bg-white text-neutral-500 border border-neutral-200 rounded-xl text-[10px] font-black uppercase tracking-widest">CANCEL</button>
                <button onclick="window.saveEdit('${postId}')" class="px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/20">SAVE</button>
            </div>
        `;
    };

    window.cancelEdit = (postId) => {
        const contentDiv = document.getElementById(`post-content-${postId}`);
        if(!contentDiv) return;
        contentDiv.innerHTML = contentDiv.getAttribute('data-original') || '';
    };

    window.saveEdit = async (postId) => {
        const textarea = document.getElementById(`edit-area-${postId}`);
        if(!textarea) return;
        const newText = textarea.value.trim();
        const contentDiv = document.getElementById(`post-content-${postId}`);
        if(contentDiv) contentDiv.innerHTML = `<span class="text-neutral-300 font-bold animate-pulse text-xs tracking-widest uppercase">SAVING UPDATE...</span>`;
        try { await updateDoc(doc(db, 'social_posts', postId), { text: newText, lastEdited: serverTimestamp() }); } 
        catch(err) { alert("Update failed."); window.enableEditMode(postId); }
    };

    window.expandImage = (url) => {
        const overlay = document.createElement('div');
        overlay.className = "fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200";
        overlay.innerHTML = `<img src="${url}" class="max-w-full max-h-[90vh] rounded-[2rem] shadow-2xl scale-95 animate-in zoom-in-95 duration-300">`;
        overlay.onclick = () => overlay.remove();
        document.body.appendChild(overlay);
    };

    window.likePost = async (postId) => {
        const user = auth.currentUser;
        if (!user) { alert("SIGN IN TO LIKE."); return; }
        const postRef = doc(db, 'social_posts', postId);
        try {
            const snap = await getDoc(postRef);
            if (!snap.exists()) return;
            const likedBy = snap.data().likedBy || [];
            if (likedBy.includes(user.uid)) { await updateDoc(postRef, { likedBy: arrayRemove(user.uid), likes: increment(-1) }); } 
            else { await updateDoc(postRef, { likedBy: arrayUnion(user.uid), likes: increment(1) }); }
        } catch (err) { console.error(err); }
    };

    window.voteInPoll = async (postId, optionIdx) => {
        const user = auth.currentUser;
        if (!user) { alert("SIGN IN TO VOTE."); return; }
        const voteRef = doc(db, 'social_posts', postId, 'votes', user.uid);
        const postRef = doc(db, 'social_posts', postId);
        try {
            await runTransaction(db, async (transaction) => {
                const voteSnap = await transaction.get(voteRef);
                if (voteSnap.exists()) throw new Error("ALREADY_VOTED");
                const postSnap = await transaction.get(postRef);
                const data = postSnap.data();
                if (!data || !data.pollOptions) return;
                const newOptions = [...data.pollOptions];
                newOptions[optionIdx].votes = (newOptions[optionIdx].votes || 0) + 1;
                transaction.set(voteRef, { userId: user.uid, optionIdx, timestamp: serverTimestamp() });
                transaction.update(postRef, { pollOptions: newOptions });
            });
        } catch (err) { if (err.message !== "ALREADY_VOTED") console.error(err); }
    };

    if (pollToggle) {
        pollToggle.onclick = () => {
            isPollActive = !isPollActive;
            pollCreator?.classList.toggle('hidden');
            pollToggle.innerText = isPollActive ? "REMOVE POLL" : "ADD POLL";
        };
    }

    if (addOptionBtn && pollOptionsContainer) {
        addOptionBtn.onclick = () => {
            const currentOptions = pollOptionsContainer.querySelectorAll('.poll-option-input').length;
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.className = 'poll-option-input w-full p-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm mb-2 font-bold placeholder-neutral-500 outline-none';
            newInput.placeholder = `OPTION ${currentOptions + 1}`;
            pollOptionsContainer.appendChild(newInput);
        };
    }

    if (imageInput) {
        imageInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (re) => {
                    currentImageData = await compressImage(re.target.result);
                    imagePreview.src = currentImageData;
                    imagePreviewContainer?.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        };
    }

    if (postBtn) {
        postBtn.onclick = async () => {
            const user = auth.currentUser;
            const textInput = document.getElementById('feed-post-text');
            const text = textInput ? textInput.value.trim() : "";
            if (!text && !currentImageData) return;
            postBtn.innerText = "POSTING...";
            try {
                const postData = {
                    text, author: "B. AYMEN", userId: user.uid, timestamp: serverTimestamp(),
                    likes: 0, likedBy: [], type: 'text'
                };
                if (currentImageData) { postData.type = 'image'; postData.imageUrl = currentImageData; }
                if (isPollActive) {
                    const options = Array.from(document.querySelectorAll('.poll-option-input')).map((i) => i.value.trim()).filter(v => v);
                    if (options.length >= 2) {
                        postData.type = 'poll';
                        postData.pollOptions = options.map(opt => ({ text: opt.toUpperCase(), votes: 0 }));
                    }
                }
                await addDoc(collection(db, 'social_posts'), postData);
                if (textInput) textInput.value = '';
                currentImageData = '';
                imagePreviewContainer?.classList.add('hidden');
                isPollActive = false;
                pollCreator?.classList.add('hidden');
                pollToggle.innerText = "ADD POLL";
                pollOptionsContainer.innerHTML = `<input type="text" class="poll-option-input w-full p-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm mb-2 font-bold placeholder-neutral-500 outline-none" placeholder="OPTION 1"><input
