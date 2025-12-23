const fs = require('fs');
const path = require('path');
const { clipboard, ipcRenderer } = require('electron');

const FILES_DIR_PATH = path.join(process.cwd(), 'Answers'); 

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const contentContainer = document.querySelector('.content-container');
    const mainContentWrapper = document.querySelector('.main-content-wrapper') || document.body; 

    const exitButton = document.getElementById('exitButton');
    const minimizeButton = document.getElementById('minimizeButton');
    const maximizeButton = document.getElementById('maximizeButton');

    contentContainer.classList.remove('visible');

    if (!fs.existsSync(FILES_DIR_PATH)) {
        try {
            fs.mkdirSync(FILES_DIR_PATH);
        } catch (error) {
            const fatalErrorHtml = `
                <div style="padding: 20px; text-align: center; color: var(--text-color, #ECECEC); background-color: #903030; border-radius: 10px; margin-top: 50px;">
                    <h2>❌ שגיאה קריטית</h2>
                    <p>תיקיית התשובות (Answers) חסרה ואין אפשרות ליצור אותה.</p>
                    <p>האפליקציה לא יכולה לעבוד ללא תיקייה זו.</p>
                    <p style="font-size: 0.9em;">פרטי שגיאה: ${error.message}</p>
                </div>
            `;
            mainContentWrapper.innerHTML = fatalErrorHtml; 
            setTimeout(() => ipcRenderer.send('close-app'), 5000); 
            return; 
        }
    }
    
    exitButton.addEventListener('click', () => ipcRenderer.send('close-app'));
    minimizeButton.addEventListener('click', () => ipcRenderer.send('minimize-app'));
    maximizeButton.addEventListener('click', () => ipcRenderer.send('maximize-app'));
    
    searchInput.addEventListener('input', searchFiles);
});

function getFileNames() {
    try {
        const files = fs.readdirSync(FILES_DIR_PATH);
        return files.filter(name => name.endsWith('.txt'));
    } catch (error) {
        const el = document.getElementById('fileContent') || document.createElement('div');
        el.innerHTML = `<p class="error-msg">שגיאה בקריאת תיקיית Answers: ${error.message}</p>`;
        return [];
    }
}

function searchFiles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const contentContainer = document.querySelector('.content-container');
    const fileContentEl = document.getElementById('fileContent') || createFileContentDiv();

    fileContentEl.innerHTML = '';

    if (!searchTerm) {
        contentContainer.classList.remove('visible');
        return;
    }

    contentContainer.classList.add('visible');

    const allFiles = getFileNames();

    if (allFiles.length === 0) {
        fileContentEl.innerHTML = `<p class="info-msg">תקיית התשובות ריקה! אנא התקן מחדש את התוכנה!</p>`;
        return;
    }

    const foundFiles = allFiles.filter(f => f.toLowerCase().includes(searchTerm));

    if (foundFiles.length > 0) {
        displayFileContent(foundFiles[0]); // מציג את הראשון
    } else {
        fileContentEl.innerHTML = `<p class="info-msg">לא נמצאו קבצים בשם "${searchTerm}".</p>`;
    }
}

function createFileContentDiv() {
    const div = document.createElement('div');
    div.id = 'fileContent';
    div.style.padding = '10px';
    div.style.color = '#fff';
    document.body.appendChild(div);
    return div;
}

function displayFileContent(fileName) {
    const contentDiv = document.getElementById('fileContent') || createFileContentDiv();
    const contentContainer = document.querySelector('.content-container');
    const cleanName = path.parse(fileName).name;
    contentContainer.classList.add('visible');
    contentDiv.innerHTML = `<h3 style="text-align:center;">${cleanName}</h3>`;

    const filePath = path.join(FILES_DIR_PATH, fileName);

    try {
        const fileData = fs.readFileSync(filePath, 'utf-8');
        let lines = fileData.split('\n').filter(line => line.trim().toLowerCase() !== 'end' && line.trim() !== '');
        lines = lines.slice(1);

        if (lines.length === 0) {
            contentDiv.innerHTML += '<p class="info-msg">אין תוכן בקובץ לאחר השורה הראשונה.</p>';
            return;
        }

        lines.forEach((line, i) => {
            const lineEl = document.createElement('div');
            lineEl.className = 'content-line';
            lineEl.textContent = `${i + 1}. ${line.trim()}`;
            lineEl.addEventListener('click', () => clipboard.writeText(line.trim()));
            contentDiv.appendChild(lineEl);
        });

    } catch (error) {
        contentDiv.innerHTML = `<p class="error-msg">שגיאה בקריאת קובץ ${fileName}: ${error.message}</p>`;
    }
}
