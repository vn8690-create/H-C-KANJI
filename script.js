let userXP = parseInt(localStorage.getItem('cyber_kanji_xp')) || 0;
let currentAgentName = "";
let currentLevel = "";
let currentSpokenText = "";
let loadedKanjiData = [];

const appNavigation = {
    activateSystem: function() {
        const nameInput = document.getElementById('agent-name-input');
        const agentName = nameInput ? nameInput.value.trim() : "";
        
        if (agentName === "") {
            alert("VUI LÒNG NHẬP MẬT DANH ĐẶC VỤ!");
            return;
        }

        const btn = document.querySelector('.btn-primary');
        if(btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG KHỞI CHẠY...';
        
        setTimeout(() => {
            currentAgentName = agentName;
            const nameDisplay = document.getElementById('js-agent-name');
            if(nameDisplay) nameDisplay.innerText = currentAgentName;
            if(btn) btn.innerHTML = 'KÍCH HOẠT HỆ THỐNG ⚡';
            this.goHome();
        }, 600);
    },

    goHome: function() {
        if (!currentAgentName) { this.switchScreen('scr-login'); return; }
        this.switchScreen('scr-home');
        updateStatsDisplay();
        this.renderLevelsMenu();
    },

    switchScreen: function(screenId) {
        learningEngine.closeFloatingPlayer();
        
        const screens = document.querySelectorAll('.screen');
        screens.forEach(scr => {
            scr.style.display = 'none';
            scr.classList.remove('active');
        });

        const activeScreen = document.getElementById(screenId);
        if (activeScreen) {
            if(screenId === 'scr-login') {
                activeScreen.style.display = 'flex';
            } else {
                activeScreen.style.display = 'block';
            }
            activeScreen.classList.add('active');
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
            card.style = `--accent-color: ${levelColors[lvl]}; padding: 16px; margin-bottom: 5px;`;
            card.innerHTML = `
                <span class="level-tag" style="font-family:'Orbitron'; font-weight:900; font-size:1.5rem; display:block;">${lvl}</span>
                <p style="font-size:0.7rem; color:var(--text-sub);">Dữ liệu file ${lvl.toLowerCase()}.json</p>
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

        // Gọi trực tiếp file json cũ: ./n5.json, ./n4.json...
        fetch(`./${level.toLowerCase()}.json`)
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                // Hỗ trợ mọi kiểu bọc mảng dữ liệu của Copilot
                loadedKanjiData = Array.isArray(data) ? data : (data.kanji || data.data || data.characters || []);
                this.renderLearningContent();
            })
            .catch((err) => {
                console.error(err);
                const titleZone = document.getElementById('learning-title');
                if(titleZone) titleZone.innerText = `CẤP ĐỘ ${currentLevel}`;
                const list = document.getElementById('learning-content-list');
                if (list) list.innerHTML = `<p style="color:var(--neon-pink); text-align:center; padding:20px;">❌ Lỗi tải dữ liệu hoặc chưa có file "${level.toLowerCase()}.json".</p>`;
            });
    },

    renderLearningContent: function() {
        const list = document.getElementById('learning-content-list');
        if (!list) return;
        list.innerHTML = '';

        const titleZone = document.getElementById('learning-title');
        if(titleZone) titleZone.innerText = `CẤP ĐỘ ${currentLevel} (${loadedKanjiData.length} KANJI)`;

        loadedKanjiData.forEach(item => {
            // TỰ ĐỘNG QUÉT VÀ THÍCH ỨNG VỚI CÁC TÊN BIẾN TRONG FILE JSON CŨ CỦA BRO
            const kChar = item.kanji || item.character || item.word || item.hanzi || "字";
            const amDoc = item.katakana || item.onyomi || item.kunyomi || item.reading || item.kana || "---";
            const nghiaViDu = item.example || item.meaning || item.meaning_vi || item.kun_meaning || "";

            const box = document.createElement('div');
            box.style = "background: var(--bg-card); border: 1px solid rgba(255,255,255,0.05); border-left: 3px solid var(--neon-blue); padding: 12px; margin-bottom: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;";
            box.innerHTML = `
                <div style="flex-grow: 1; text-align: left;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size: 2rem; font-weight: 900; color: #fff;">${kChar}</span>
                        <div style="color: var(--neon-cyan); font-weight: bold; font-size: 0.9rem;">🔊 [ ${amDoc} ]</div>
                    </div>
                    <div style="color: #fff; font-size: 0.85rem; margin-top: 4px; padding-left:2px;">${nghiaViDu}</div>
                </div>
                <button onclick="event.stopPropagation(); learningEngine.openShadowingModal('${nghiaViDu}')" style="background: rgba(0,119,255,0.1); border: 1px solid var(--neon-blue); color: var(--neon-blue); width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;"><i class="fa-solid fa-microphone"></i></button>
            `;
            box.onclick = () => this.speakSample(amDoc, `${kChar} ➔ ${nghiaViDu}`);
            list.appendChild(box);
        });
    },

    speakSample: function(textToSpeak, title = "") {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            let cleanText = textToSpeak.replace(/[\/()（）\-,ー]/g, ' ').trim().toLowerCase();
            let speech = new SpeechSynthesisUtterance(cleanText);
            speech.lang = 'ja-JP';
            speech.rate = 0.8;
            window.speechSynthesis.speak(speech);

            currentSpokenText = textToSpeak;
            const player = document.getElementById('floating-player');
            const playerText = document.getElementById('floating-text');
            if(player && playerText) {
                player.classList.remove('hidden');
                playerText.innerText = title || textToSpeak;
            }
            gainXP(2);
        }
    },

    playAudio: function() { if (currentSpokenText) { this.speakSample(currentSpokenText); } },
    closeFloatingPlayer: function() { const player = document.getElementById('floating-player'); if(player) player.classList.add('hidden'); },
    openShadowingModal: function(text) { this.closeFloatingPlayer(); const modal = document.getElementById('shadowing-modal'); const txtBox = document.getElementById('shadowing-text'); const cd = document.getElementById('countdown'); if (modal && txtBox && cd) { txtBox.innerText = text; cd.innerText = "READY?"; modal.classList.remove('hidden'); } },
    closeShadowingModal: function() { const modal = document.getElementById('shadowing-modal'); if (modal) modal.classList.add('hidden'); },
    startShadowing: function() {
        const text = document.getElementById('shadowing-text').innerText;
        const cd = document.getElementById('countdown');
        if (!cd) return;
        cd.innerText = "Listening お手本... 🎧";
        this.speakSample(text.split('-')[0] || text, "Đang nghe mẫu...");
        setTimeout(() => { if(cd) { cd.innerText = "Say it now! Hãy nhại giọng... 🎙️"; cd.style.color = "var(--neon-cyan)"; } }, 2100);
        setTimeout(() => { if(cd) { cd.innerText = "SUCCESS! Tốt lắm +10 XP ⚡"; cd.style.color = "var(--neon-purple)"; gainXP(10); } }, 4500);
    }
};

function gainXP(amount) { userXP += amount; localStorage.setItem('cyber_kanji_xp', userXP); updateStatsDisplay(); }
function updateStatsDisplay() { const xpCount = document.getElementById('xp-count'); if (xpCount) xpCount.innerText = userXP; }

window.addEventListener('DOMContentLoaded', (event) => {
    updateStatsDisplay();
    appNavigation.switchScreen('scr-login');
});
