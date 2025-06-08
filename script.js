// This script loads the lessons from the GitHub repository and displays them

// GitHub username and repo
const githubUser = 'sh770'; // שם המשתמש שלך בגיטהאב
const repo = 'chasidus';    // שם הריפו
const branch = 'main';      // ענף ראשי

// URL to fetch raw JSON data from GitHub
const dataUrl = `https://raw.githubusercontent.com/${githubUser}/${repo}/${branch}/data.json`;

// Load lessons from GitHub
fetch(dataUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load data.json');
        }
        return response.json();
    })
    .then(lessons => {
        displayLessons(lessons);
    })
    .catch(error => {
        document.getElementById('lessons').innerHTML = `<p>שגיאה בטעינת השיעורים: ${error.message}</p>`;
    });

// Function to render lessons on the page
function displayLessons(lessons) {
    const container = document.getElementById('lessons');
    container.innerHTML = ''; // Clear existing content

    lessons.forEach(lesson => {
        // Create a div for each lesson
        const div = document.createElement('div');
        div.className = 'lesson';

        // Lesson title
        const title = document.createElement('h2');
        title.textContent = lesson.title;

        // Description
        const desc = document.createElement('p');
        desc.textContent = lesson.description;

        // YouTube embed iframe
        const iframe = document.createElement('iframe');
        iframe.src = lesson.youtube;
        iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        // Add all elements to the lesson div
        div.appendChild(title);
        div.appendChild(desc);
        div.appendChild(iframe);

        // Add lesson to the page
        container.appendChild(div);
    });
}
