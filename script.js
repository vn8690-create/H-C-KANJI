let userXP = parseInt(localStorage.getItem('cyber_kanji_xp')) || 0;
let currentAgentName = "";
let currentLevel = "";
let loadedKanjiData = [];

const appNavigation = {
    activateSystem: function() {
        const nameInput = document.getElementById('agent-name-input');
        const agentName = nameInput ? nameInput.value.trim() : "Nam";
        currentAgentName = agentName;
        const nameDisplay = document.getElementById('js-agent-name');
        if(nameDisplay) nameDisplay.innerText = currentAgentName;
        this.goHome();
    },

    goHome: function() {
        if (!currentAgentName) { this.switchScreen('scr-login'); return; }
        this.switchScreen('scr-home');
        updateStatsDisplay();
        this.renderLevelsMenu();
    },

    switchScreen: function(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(scr => {
            scr.style.setProperty('display', 'none', 'important');
        });

        const activeScreen = document.getElementById(screenId);
        if (activeScreen) {
            if(screenId === 'scr-login') {
                activeScreen.style.setProperty('display', 'flex', 'important');
            } else {
                activeScreen.style.setProperty('display', 'block', 'important');
            }
        }
    },

    renderLevelsMenu: function() {
        const grid = document.querySelector('.level-menu-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
        const levelColors = { 'N5': '#00ffcc', 'N4': '#0077ff', 'N3': '#e040fb', 'N2': '#ff00ff', 'N1': '#9d00ff' };

        levels.forEach(lvl => {
            const card = document.createElement('div');
            card.className = "menu-item-card";
            card.style = `--accent-color: ${levelColors[lvl]}; padding: 16px; margin-bottom: 8px; cursor: pointer; background: #0f1424; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;`;
            card.innerHTML = `
                <span class="level-tag" style="font-weight:900; font-size:1.5rem; color:#fff; display:block;">${lvl}</span>
                <p style="font-size:0.75rem; color:#94a3b8; margin:0;">Học file ${lvl.toLowerCase()}.json</p>
            `;
            card.onclick = () => learningEngine.loadJsonData(lvl);
            grid.appendChild(card);
        });
    }
};

const learningEngine = {
    loadJsonData: function(level) {
        currentLevel = level;
        appNavigation.switchScreen('scr-learning');
        
        const titleZone = document.getElementById('learning-title');
        if(titleZone) titleZone.innerText = `CẤP ĐỘ ${level} - ĐANG TẢI...`;
        
        const lvlDisplay = document.getElementById('level-display');
        if(lvlDisplay) lvlDisplay.innerText = level;

        fetch(`./${level.toLowerCase()}.json`)
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                loadedKanjiData = Array.isArray(data) ? data : [];
                this.renderLearningContent();
            })
            .catch((err) => {
                console.error(err);
                const list = document.getElementById('learning-content-list');
                if (list) list.innerHTML = `<p style="color:#ff00ff; text-align:center; padding:20px;">❌ Chưa đọc được file "${level.toLowerCase()}.json".</p>`;
            });
    },

    renderLearningContent: function() {
        const list = document.getElementById('learning-content-list');
        if (!list) return;
        list.innerHTML = '';

        const titleZone = document.getElementById('learning-title');
        if(titleZone) titleZone.innerText = `CẤP ĐỘ ${currentLevel} (${loadedKanjiData.length} CHỮ)`;

        loadedKanjiData.forEach(item => {
            // ĐỌC CHUẨN CÁC BIẾN THEO CẤU TRÚC FILE JSON CỦA BRO
            const kChar = item.kanji || "字";
            const nghia = item.meaning || "";
            const onyomi = item.onyomi || "";
            const kunyomi = item.kunyomi || "";
            const vidu = item.example || "";

            const box = document.createElement('div');
            box.style = "background: #0f1424; border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid #0077ff; padding: 14px; margin-bottom: 12px; border-radius: 8px; text-align: left; cursor: pointer;";
            box.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px;">
                    <span style="font-size: 2.2rem; font-weight: 900; color: #fff;">${kChar}</span>
                    <div>
                        <div style="color: #fff; font-weight: bold; font-size: 1.1rem;">${nghia}</div>
                        <div style="color: #00ffcc; font-size: 0.85rem; margin-top: 2px;">
                            <strong>Onyomi:</strong> ${onyomi} | <strong>Kunyomi:</strong> ${kunyomi}
                        </div>
                    </div>
                </div>
                <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
                    <strong>Ví dụ:</strong> ${vidu}
                </div>
            `;
            // Bấm vào thẻ tự động phát âm âm Onyomi
            box.onclick = () => this.speakSample(onyomi);
            list.appendChild(box);
        });
    },

    speakSample: function(textToSpeak) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            let cleanText = textToSpeak.replace(/[\/()（）\-,ー]/g, ' ').trim();
            let speech = new SpeechSynthesisUtterance(cleanText);
            speech.lang = 'ja-JP';
            speech.rate = 0.8;
            window.speechSynthesis.speak(speech);
            gainXP(2);
        }
    }
};

function gainXP(amount) { userXP += amount; localStorage.setItem('cyber_kanji_xp', userXP); updateStatsDisplay(); }
function updateStatsDisplay() { const xpCount = document.getElementById('xp-count'); if (xpCount) xpCount.innerText = userXP; }

window.addEventListener('DOMContentLoaded', (event) => {
    updateStatsDisplay();
    appNavigation.switchScreen('scr-login');
});
