// =========================================================================
// 🚀 1. TRẠNG THÁI HỆ THỐNG & ĐIỀU HƯỚNG (APP NAVIGATION)
// =========================================================================
let userXP = parseInt(localStorage.getItem('cyber_kanji_xp')) || 0;
let currentAgentName = "";
let currentLevel = "";
let currentSpokenText = "";
let loadedKanjiData = []; // Nơi chứa dữ liệu Kanji bốc từ file JSON về

const appNavigation = {
    activateSystem: function() {
        const nameInput = document.getElementById('agent-name-input');
        const agentName = nameInput.value ? nameInput.value.trim() : "";
        
        if (agentName === "") {
            alert("MẬT DANH ĐẶC VỤ CHƯA NHẬP! KHÔNG THỂ KÍCH HOẠT!");
            if(nameInput) nameInput.focus();
            return;
        }

        const btn = document.querySelector('.btn-primary');
        if(btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG KÍCH HOẠT...';
        
        setTimeout(() => {
            currentAgentName = agentName;
            const nameDisplay = document.getElementById('js-agent-name');
            if(nameDisplay) nameDisplay.innerText = currentAgentName;
            
            if(btn) btn.innerHTML = 'KÍCH HOẠT HỆ THỐNG ⚡';
            this.goHome();
        }, 1200);
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
        screens.forEach(scr => scr.classList.remove('active'));

        const activeScreen = document.getElementById(screenId);
        if (activeScreen) activeScreen.classList.add('active');
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
            card.style = `--accent-color: ${levelColors[lvl]};`;
            
            card.innerHTML = `
                <span class="level-tag">${lvl}</span>
                <p>Nạp kho dữ liệu ${lvl}.json thực chiến phân xưởng</p>
            `;
            
            // Bấm phát là kích hoạt luồng fetch file JSON tương ứng ngay
            card.onclick = () => learningEngine.loadJsonData(lvl);
            grid.appendChild(card);
        });
    }
};

// =========================================================================
// 🔣 2. ĐỘNG CƠ HÚT DỮ LIỆU JSON & PHÁT ÂM (LEARNING ENGINE)
// =========================================================================
const learningEngine = {
    // CHÍ MẠNG: Hàm chọc thẳng vào các file n5.json, n4.json... của bro
    loadJsonData: function(level) {
        currentLevel = level;
        appNavigation.switchScreen('scr-learning');
        
        const titleZone = document.querySelector('#scr-learning h2');
        if(titleZone) titleZone.innerText = `KÍCH HOẠT ${level} - ĐANG TẢI DỮ LIỆU...`;
        
        const lvlDisplay = document.getElementById('level-display');
        if(lvlDisplay) lvlDisplay.innerText = level;

        // Tự động tìm file json theo tên viết thường: n5.json, n4.json...
        const jsonFileName = `${level.toLowerCase()}.json`;

        fetch(jsonFileName)
            .then(response => {
                if (!response.ok) throw new Error("Không tìm thấy file dữ liệu JSON");
                return response.json();
            })
            .then(data => {
                // Hỗ trợ cả trường hợp file JSON bọc trong một Object hoặc là một mảng Array thuần
                loadedKanjiData = Array.isArray(data) ? data : (data.kanji || data.data || []);
                this.renderLearningContent();
            })
            .catch(error => {
                console.error(error);
                const list = document.getElementById('learning-content-list');
                if (list) {
                    list.innerHTML = `
                        <p style="color:var(--neon-pink); text-align:center; padding:20px;">
                            ❌ LỖI: Không thể nạp file "${jsonFileName}". <br>
                            Hãy đảm bảo file này tồn tại trong Repo và chuẩn cú pháp JSON nhé bro!
                        </p>`;
                }
            });
    },

    renderLearningContent: function() {
        const list = document.getElementById('learning-content-list');
        if (!list) return;
        list.innerHTML = '';

        const titleZone = document.querySelector('#scr-learning h2');
        if(titleZone) titleZone.innerText = `CẤP ĐỘ ${currentLevel} (${loadedKanjiData.length} KANJI)`;

        if (loadedKanjiData.length === 0) {
            list.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding:20px;">DỮ LIỆU TRONG FILE JSON ĐANG TRỐNG!</p>`;
            return;
        }

        loadedKanjiData.forEach(item => {
            // Tự động nhận diện các kiểu đặt tên biến của Copilot cũ (kanji hoặc character, âm đọc...)
            const kanjiChar = item.kanji || item.character || item.word || "字";
            const amDoc = item.katakana || item.onyomi || item.kunyomi || item.reading || "---";
            const nghiaViDu = item.example || item.meaning || item.meaning_vi || "Chưa có ví dụ";

            const box = document.createElement('div');
            box.style = "background: var(--bg-card); border: 1px solid rgba(255,255,255,0.05); border-left: 3px solid var(--neon-blue); padding: 15px; margin-bottom: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;";
            box.innerHTML = `
                <div style="flex-grow: 1; padding-right: 12px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-family: var(--font-cyber); font-size: 2.2rem; font-weight: 900; color: #fff;">${kanjiChar}</span>
                        <div>
                            <div style="color: var(--neon-cyan); font-weight: bold; font-size: 0.95rem;">🔊 [ ${amDoc} ]</div>
                            <div style="color: var(--text-sub); font-size: 0.75rem; margin-top: 2px;">Dữ liệu phân xưởng</div>
                        </div>
                    </div>
                    <div style="color: #fff; font-size: 0.9rem; font-weight: 500; margin-top: 8px; padding-left:4px;">${nghiaViDu}</div>
                </div>
                <button onclick="event.stopPropagation(); learningEngine.openShadowingModal('${nghiaViDu}')" style="background: rgba(0,119,255,0.1); border: 1px solid var(--neon-blue); color: var(--neon-blue); width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1rem;"><i class="fa-solid fa-microphone"></i></button>
            `;
            
            box.onclick = () => this.speakSample(amDoc, `${kanjiChar} ➔ ${nghiaViDu}`);
            list.appendChild(box);
        });
    },

    speakSample: function(textToSpeak, title = "") {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
            // Lọc bớt ký tự đặc biệt để giọng đọc chuẩn hơn
            let cleanText = textToSpeak.replace(/[\/()（）\-,ー]/g, ' ').trim().toLowerCase();
            
            let speech = new SpeechSynthesisUtterance(cleanText);
            speech.lang = 'ja-JP'; // Ép giọng chuẩn Nhật Bản cho Kanji
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

    openShadowingModal: function(text) {
        this.closeFloatingPlayer();
        const modal = document.getElementById('shadowing-modal');
        const txtBox = document.getElementById('shadowing-text');
        const cd = document.getElementById('countdown');
        if (modal && txtBox && cd) {
            txtBox.innerText = text; cd.innerText = "READY?"; modal.classList.remove('hidden');
        }
    },
    closeShadowingModal: function() { const modal = document.getElementById('shadowing-modal'); if (modal) modal.classList.add('hidden'); },
    startShadowing: function() {
        const text = document.getElementById('shadowing-text').innerText;
        const cd = document.getElementById('countdown');
        if (!cd) return;
        
        cd.innerText = "Listening お手本... 🎧";
        this.speakSample(text.split('-')[0] || text, "Đang nghe mẫu...");
        
        setTimeout(() => { if(cd) { cd.innerText = "Say it now! Hãy nhại giọng... 🎙️"; cd.style.color = "var(--neon-cyan)"; } }, 2500);
        setTimeout(() => { if(cd) { cd.innerText = "SUCCESS! Tốt lắm +10 XP ⚡"; cd.style.color = "var(--neon-purple)"; gainXP(10); } }, 5500);
    }
};

// =========================================================================
// 🏆 3. HỆ THỐNG ĐIỂM SỐ & KHỞI CHẠY KHÔNG KHÓA TRÌNH DUYỆT
// =========================================================================
function gainXP(amount) {
    userXP += amount;
    localStorage.setItem('cyber_kanji_xp', userXP);
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const xpCount = document.getElementById('xp-count');
    if (xpCount) xpCount.innerText = userXP;
}

window.addEventListener('DOMContentLoaded', (event) => {
    updateStatsDisplay();
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    const loginScreen = document.getElementById('scr-login');
    if (loginScreen) loginScreen.classList.add('active');
});
