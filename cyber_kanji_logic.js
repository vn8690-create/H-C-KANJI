// =========================================================================
// 📦 1. KHO DỮ LIỆU KANJI THỰC CHIẾN N5-N1 (ĐÃ BÓC TÁCH CHUẨN ĐẾN NƠI ĐẾN CHỐN)
// =========================================================================
const cyberKanjiData = {
    // 🔠 Dữ liệu cấp độ N5 (Cơ bản phân xưởng)
    N5: [
        { kanji: "上", katakana: "ジョウ/うえ", example: "上着 (うわぎ - Áo khoác)" },
        { kanji: "下", katakana: "カ/した", example: "下着 (したぎ - Đồ lót)" },
        { kanji: "電", katakana: "デン", example: "電車 (でんしゃ - Tàu điện)" },
        { kanji: "気", katakana: "キ", example: "電気 (でんき - Điện)" },
        { kanji: "車", katakana: "シャ/くるま", example: "自動車 (じどうしゃ - Ô tô)" },
        { kanji: "工", katakana: "コウ/ク", example: "工場 (こうじょう - Nhà máy)" },
        { kanji: "場", katakana: "ジョウ/ば", example: "場所 (ばしょ - Địa điểm)" },
        { kanji: "開", katakana: "カイ/あく", example: "開始 (かいし - Bắt đầu)" },
        { kanji: "閉", katakana: "ヘイ/しまる", example: "閉鎖 (へいさ - Đóng cửa)" },
        { kanji: "止", katakana: "シ/とまる", example: "中止 (ちゅうし - Dừng)" },
    ],
    // 🔠 Dữ liệu cấp độ N4 (Giao tiếp tình huống máy móc)
    N4: [
        { kanji: "動", katakana: "ドウ/うごく", example: "自動 (じどう - Tự động)" },
        { kanji: "転", katakana: "テン/ころがる", example: "運転 (うんてん - Lái xe/vận hành)" },
        { kanji: "切", katakana: "セツ/きる", example: "裁断機 (さいだんき - Máy cắt)" }, // Từ vựng xưởng
        { kanji: "機", katakana: "キ", example: "機械 (きかい - Máy móc)" },
        { kanji: "換", katakana: "カン/かえる", example: "交換 (こうかん - Trao đổi/thay thế)" },
    ],
    // Dữ liệu N3, N2, N1... bro có thể thêm vào đây theo cấu trúc trên
};

// Trạng thái lưu trữ hệ thống
let userXP = parseInt(localStorage.getItem('cyber_kanji_xp')) || 0;
let currentAgentName = "";
let currentLevel = "";
let currentSpokenText = "";

// =========================================================================
// 🚀 2. ĐIỀU HƯỚNG ỨNG DỤNG (APP NAVIGATION)
// =========================================================================
const appNavigation = {
    // Sửa lỗi: Hàm này chưa được gọi nên Login Card bị kẹt
    activateSystem: function() {
        const nameInput = document.getElementById('agent-name-input');
        const agentName = nameInput.value.trim();
        
        if (agentName === "") {
            alert("MẬT DANH ĐẶC VỤ CHƯA NHẬP! KHÔNG THỂ KÍCH HOẠT!");
            nameInput.focus();
            return;
        }

        // Kích hoạt hiệu ứng "Loading" tinh thần
        const btn = document.querySelector('.btn-primary');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG KÍCH HOẠT...';
        
        // Giả lập luồng kích hoạt não bộ 2 giây
        setTimeout(() => {
            currentAgentName = agentName;
            
            // Cập nhật giao diện Dashboard
            document.getElementById('js-agent-name').innerText = currentAgentName;
            
            // Reset nút bấm và chuyển màn hình
            btn.innerHTML = 'KÍCH HOẠT HỆ THỐNG ⚡';
            this.goHome();
        }, 1800);
    },

    goHome: function() {
        // Nếu chưa đăng nhập, ép về màn hình Login
        if (!currentAgentName) { this.switchScreen('scr-login'); return; }
        
        this.switchScreen('scr-home');
        
        // Nạp dữ liệu Dashboard
        updateStatsDisplay();
        this.renderLevelsMenu();
    },

    switchScreen: function(screenId) {
        // Tự động đóng Floating Player khi chuyển màn hình
        learningEngine.closeFloatingPlayer();
        
        // Ẩn tất cả section
        const screens = document.querySelectorAll('.screen');
        screens.forEach(scr => scr.classList.remove('active'));

        // Hiện section được chọn mượt mà
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) activeScreen.classList.add('active');
    },

    // Render danh mục cấp độ bọc lót theo file CSS mới
    renderLevelsMenu: function() {
        const grid = document.querySelector('.level-menu-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
        // Tone màu cho từng cấp độ
        const levelColors = { 'N5': '#00ffcc', 'N4': '#0077ff', 'N3': '#e040fb', 'N2': '#ff00ff', 'N1': '#9d00ff' };

        levels.forEach(lvl => {
            const card = document.createElement('div');
            card.className = "menu-item-card";
            card.style = `--accent-color: ${levelColors[lvl]};`;
            
            // Chế độ dữ liệu giả lập cho N3-N1 nếu chưa có
            const dataState = cyberKanjiData[lvl] ? `(${cyberKanjiData[lvl].length} Kanji)` : "(Sắp ra mắt)";
            
            card.innerHTML = `
                <span class="level-tag">${lvl}</span>
                <p>Nạp dữ liệu ${lvl} thực chiến ${dataState}</p>
            `;
            
            // Sự kiện kích hoạt não bộ cấp độ
            if(cyberKanjiData[lvl]) {
                card.onclick = () => learningEngine.startLevel(lvl);
            } else {
                card.onclick = () => alert(`CẤP ĐỘ ${lvl} CHƯA CẬP NHẬT DỮ LIỆU!`);
            }
            grid.appendChild(card);
        });
    }
};

// =========================================================================
// 🔣 3. ĐỘNG CƠ HỌC TẬP & PHÁT ÂM (LEARNING ENGINE)
// =========================================================================
const learningEngine = {
    startLevel: function(level) {
        currentLevel = level;
        appNavigation.switchScreen('scr-learning');
        
        // Cập nhật tiêu đề màn hình
        document.querySelector('#scr-learning h2').innerText = `KÍCH HOẠT ${level} - NẠP DỮ LIỆU...`;
        
        // Cập nhật giao diện Status
        document.getElementById('level-display').innerText = level;

        // Bọc lót giao diện bài học thực chiến N5-N1 bóc tách chuẩn
        this.renderLearningContent();
    },

    // Bóc tách Kanji, katakana, ví dụ chuẩn Nhật-Việt đúng ý bro
    renderLearningContent: function() {
        const list = document.getElementById('learning-content-list');
        if (!list) return;
        list.innerHTML = '';

        const data = cyberKanjiData[currentLevel];
        
        if (!data) { list.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding:20px;">DỮ LIỆU CẤP ĐỘ ${currentLevel} CHƯA ĐƯỢC NẠP!</p>`; return; }

        data.forEach(item => {
            const box = document.createElement('div');
            // Cấu trúc card bọc lót theo file CSS mới
            box.style = "background: var(--bg-card); border: 1px solid rgba(255,255,255,0.05); border-left: 3px solid var(--neon-blue); padding: 15px; margin-bottom: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;";
            box.innerHTML = `
                <div style="flex-grow: 1; padding-right: 12px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-family: var(--font-cyber); font-size: 2.2rem; font-weight: 900; color: #fff;">${item.kanji}</span>
                        <div>
                            <div style="color: var(--neon-cyan); font-weight: bold; font-size: 0.95rem;">🔊 [${item.katakana}]</div>
                            <div style="color: var(--text-sub); font-size: 0.8rem; margin-top: 2px;">Cấu trúc chuẩn phân xưởng</div>
                        </div>
                    </div>
                    <div style="color: #fff; font-size: 0.9rem; font-weight: 500; margin-top: 8px; padding-left:4px;">${item.example}</div>
                </div>
                <button onclick="learningEngine.openShadowingModal('${item.example}')" style="background: rgba(0,119,255,0.1); border: 1px solid var(--neon-blue); color: var(--neon-blue); width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1rem;"><i class="fa-solid fa-microphone"></i></button>
            `;
            // Chạm vùng chữ để nghe máy đọc mẫu chuẩn
            box.querySelector('div').onclick = () => this.speakSample(item.katakana, `${item.kanji} -> Ví dụ chuẩn Nhật-Việt`);
            list.appendChild(box);
        });
    },

    speakSample: function(katakana, title = "") {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
            // Ép chữ thường để AI đọc âm chuẩn tiếng Nhật thuần túy
            let cleanText = katakana.trim().toLowerCase();
            
            let speech = new SpeechSynthesisUtterance(cleanText);
            speech.lang = 'ja-JP'; // Ép giọng chuẩn Nhật Bản cho Kanji
            speech.rate = 0.8; 
            
            window.speechSynthesis.speak(speech);

            // Hiện Floating Player dưới đáy mobile bọc lót theo CSS mới
            currentSpokenText = cleanText;
            const player = document.getElementById('floating-player');
            const playerText = document.getElementById('floating-text');
            if(player && playerText) {
                player.classList.remove('hidden');
                playerText.innerText = title || katakana;
            }
            gainXP(2); // Thưởng nóng 2 điểm tương tác học tập
        }
    },

    playAudio: function() { if (currentSpokenText) { this.speakSample(currentSpokenText); } },
    closeFloatingPlayer: function() { const player = document.getElementById('floating-player'); if(player) player.classList.add('hidden'); },

    // Logic Shadowing Modal giả lập luồng ghi âm bọc lót CSS mới
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
        
        // Bật máy đọc câu mẫu tiếng Nhật trước
        this.speakSample(text.split('(')[0], "Đang nghe mẫu..."); // Chỉ đọc phần tiếng Nhật trước dấu ngoặc
        
        // Đếm ngược 3 giây giả lập người Nhật tập nói
        setTimeout(() => { cd.innerText = "Say it now! Hãy nhại giọng... 🎙️"; cd.style.color = "var(--neon-cyan)"; }, 2500);
        setTimeout(() => { cd.innerText = "SUCCESS! Tốt lắm +10 XP ⚡"; cd.style.color = "var(--neon-purple)"; gainXP(10); }, 5500);
    }
};

// =========================================================================
// 🏆 4. HỆ THỐNG XP & KHỞI CHẠY (INITIALIZATION)
// =========================================================================
function gainXP(amount) {
    userXP += amount;
    localStorage.setItem('cyber_kanji_xp', userXP);
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const xpElements = ['xp-count', 'total-xp'];
    xpElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = userXP;
    });
}

// KHỞI CHẠY AN TOÀN CHO MOBILE - TRÁNH BỊ BLOCK
window.addEventListener('DOMContentLoaded', (event) => {
    updateStatsDisplay();
    // Ép hiện màn hình Home thủ công thay vì gọi hàm tự động kích hoạt âm thanh
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    const loginScreen = document.getElementById('scr-login');
    if (loginScreen) loginScreen.classList.add('active');
    
    // Nếu bro muốn chọc quê lão Copilot hơn nữa:
    // console.log("CẤP ĐỘ N5-N1 ĐÃ KÍCH HOẠT! CHÀO TẠM BIỆT ÔNG COPILOT!");
});
