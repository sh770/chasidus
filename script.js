// ========== הגדרות ==========
const githubUser = 'sh770'; // אפשר לשנות למשתמש אחר
const repo = 'chasidus';
const branch = 'main';
const filePath = 'data.json';

const dataUrl = `https://raw.githubusercontent.com/${githubUser}/${repo}/${branch}/${filePath}`;

// ========== טעינת הדף ==========
loadLessons();
checkAdmin();

// ========== הצגת שיעורים ==========
function loadLessons() {
    fetch(dataUrl)
        .then(response => response.json())
        .then(lessons => {
            displayLessons(lessons);
        })
        .catch(error => {
            document.getElementById('lessons').innerHTML = `<p>שגיאה בטעינת השיעורים: ${error.message}</p>`;
        });
}

function displayLessons(lessons) {
    const container = document.getElementById('lessons');
    container.innerHTML = '';

    const isAdmin = !!localStorage.getItem('github_token');

    lessons.forEach((lesson, index) => {
        const div = document.createElement('div');
        div.className = 'lesson';

        const title = document.createElement('h2');
        title.textContent = lesson.title;

        const desc = document.createElement('p');
        desc.textContent = lesson.description;

        const iframe = document.createElement('iframe');
        iframe.src = lesson.youtube;
        iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        div.appendChild(title);
        div.appendChild(desc);
        div.appendChild(iframe);

        if (isAdmin) {
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️ ערוך';
            editBtn.style.marginInlineEnd = '1em';
            editBtn.onclick = () => fillEditForm(lesson, index);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️ מחק';
            deleteBtn.onclick = () => deleteLesson(index);

            const controls = document.createElement('div');
            controls.style.marginTop = '1em';
            controls.appendChild(editBtn);
            controls.appendChild(deleteBtn);

            div.appendChild(controls);
        }

        container.appendChild(div);
    });
}

// ========== התחברות מנהל ==========
function saveToken() {
    const token = document.getElementById('token-input').value.trim();
    if (token) {
        localStorage.setItem('github_token', token);
        checkAdmin();
    }
}

function logout() {
    localStorage.removeItem('github_token');
    checkAdmin();
}

function checkAdmin() {
    const token = localStorage.getItem('github_token');
    document.getElementById('login-form').style.display = token ? 'none' : 'block';
    document.getElementById('admin-tools').style.display = token ? 'inline' : 'none';
    document.getElementById('add-lesson').style.display = token ? 'block' : 'none';
    document.getElementById('edit-lesson').style.display = 'none';
}

// ========== הוספת שיעור ==========
function addLesson() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const youtube = document.getElementById('youtube').value.trim();
    const token = localStorage.getItem('github_token');

    if (!title || !description || !youtube) {
        alert('נא למלא את כל השדות');
        return;
    }

    fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
            data.push({ title, description, youtube });

            const apiUrl = `https://api.github.com/repos/${githubUser}/${repo}/contents/${filePath}`;
            fetch(apiUrl, {
                headers: { 'Authorization': `token ${token}` }
            })
                .then(res => res.json())
                .then(fileData => {
                    const sha = fileData.sha;
                    const updateBody = {
                        message: "הוספת שיעור חדש",
                        content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
                        sha: sha
                    };

                    fetch(apiUrl, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updateBody)
                    })
                        .then(response => {
                            if (!response.ok) throw new Error('עדכון נכשל');
                            alert('השיעור נוסף בהצלחה!');
                            location.reload();
                        })
                        .catch(err => alert('שגיאה: ' + err.message));
                });
        });
}

// ========== עריכת שיעור ==========
function fillEditForm(lesson, index) {
    document.getElementById('edit-lesson').style.display = 'block';
    document.getElementById('edit-index').value = index;
    document.getElementById('edit-title').value = lesson.title;
    document.getElementById('edit-description').value = lesson.description;
    document.getElementById('edit-youtube').value = lesson.youtube;
    window.scrollTo(0, document.body.scrollHeight);
}

function cancelEdit() {
    document.getElementById('edit-lesson').style.display = 'none';
}

function saveEditedLesson() {
    const index = parseInt(document.getElementById('edit-index').value);
    const title = document.getElementById('edit-title').value.trim();
    const description = document.getElementById('edit-description').value.trim();
    const youtube = document.getElementById('edit-youtube').value.trim();

    if (!title || !description || !youtube) {
        alert('נא למלא את כל השדות');
        return;
    }

    updateLessons(data => {
        data[index] = { title, description, youtube };
        return data;
    }, 'עריכת שיעור');
}

// ========== מחיקת שיעור ==========
function deleteLesson(index) {
    if (!confirm('האם למחוק את השיעור?')) return;

    updateLessons(data => {
        data.splice(index, 1);
        return data;
    }, 'מחיקת שיעור');
}

// ========== עדכון כללי ==========
function updateLessons(editFn, commitMessage) {
    const token = localStorage.getItem('github_token');
    const apiUrl = `https://api.github.com/repos/${githubUser}/${repo}/contents/${filePath}`;

    fetch(dataUrl)
        .then(res => res.json())
        .then(data => {
            const updatedData = editFn(data);

            fetch(apiUrl, {
                headers: { 'Authorization': `token ${token}` }
            })
                .then(res => res.json())
                .then(fileData => {
                    const sha = fileData.sha;
                    const body = {
                        message: commitMessage,
                        content: btoa(unescape(encodeURIComponent(JSON.stringify(updatedData, null, 2)))),
                        sha: sha
                    };

                    fetch(apiUrl, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    })
                        .then(res => {
                            if (!res.ok) throw new Error('שגיאה בעדכון');
                            alert('השינויים נשמרו בהצלחה!');
                            location.reload();
                        })
                        .catch(err => alert('שגיאה: ' + err.message));
                });
        });
}
