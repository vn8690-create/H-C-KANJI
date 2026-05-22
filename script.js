// ==========================================
// 1. KHỞI TẠO TRẠNG THÁI VÀ DỮ LIỆU APP
// ==========================================
let currentLevel = "N5";
let fullLevelData = []; // Chứa toàn bộ chữ của level từ file JSON
let dayWords = [];      // 10 chữ của ngày hiện tại
let currentQuestionIndex = 0;
let correctAnswerData = null;
let isQuizMode = false; // false = đang xem mặt card, true = đang làm quiz kiểm tra

// Chỉ số người dùng lưu trữ lâu dài (localStorage)
let userData = {
    xp: 0,
    streak: 0,
    lastStudyDate: null,
    unlockedDays: { N5: 1, N4: 1, N3: 1, N2: 1, N1: 1 }
};

// Chạy ngay khi ứng dụng nạp xong giao diện
window.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    initPWA();
});

// ==========================================
// 2. BỘ NÃO TẢI DỮ LIỆU TỪ GITHUB
// ==========================================
async function loadLevelData(level) {
    try {
        console.log(`Đang gọi dữ liệu cho cấp độ: ${level}`);
        
        // Gọi file JSON chuẩn
        const response = await fetch(`${level.toLowerCase()}.json`);
        
        if (!response.ok) {
            throw new Error(`Không tìm thấy file hoặc lỗi mạng: ${response.status}`);
        }
        
        fullLevelData = await response.json();
        console.log("Đã nạp thành công kho từ vựng. Tổng số chữ:", fullLevelData.length);
        
        // Thuật toán xáo trộn toàn bộ kho chữ trước khi chia ngày để đổi mới trải nghiệm
        for (let i = fullLevelData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fullLevelData[i], fullLevelData[j]] = [fullLevelData[j], fullLevelData[i]];
        }
        
        // Nạp xong dữ liệu thì tự động vẽ lại danh sách ngày hiển thị trên màn hình
        renderDaysList();

    } catch (error) {
        console.error("Lỗi nạp dữ liệu:", error);
        const daysBox = document.getElementById('js-days-list');
        if (daysBox) {
            daysBox.innerHTML = `<div style="text-align:center; padding:20px; color:var(--cyber-pink);">⚠️ Lỗi: Không load được file ${level.toLowerCase()}.json. Bro kiểm tra tên file trên GitHub nhé!</div>`;
        }
    }
}

// ==========================================
// 3. ĐIỀU HƯỚNG VÀ HIỂN THỊ LỘ TRÌNH THEO NGÀY
// ==========================================
function switchScreen(screenId) {
    document.querySelectorAll('.app-screen').forEach(scr => scr.classList.add('d-none'));
    document.getElementById(`scr-${screenId}`).classList.remove('d-none');
    
    if(screenId === 'learn-hub') {
        renderDaysList();
    }
}

function renderDaysList() {
    const totalWords = fullLevelData.length || 0; 
    const daysBox = document.getElementById('js-days-list');
    if (!daysBox) return;
    
    daysBox.innerHTML = "";

    if (totalWords === 0) {
        daysBox.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">Đang tải dữ liệu hoặc file trống, bro đợi xíu hoặc bấm lại tab nhé...</div>`;
        return;
    }

    // Tự động tính toán số ngày thực tế: Tổng số chữ chia cho 10 từ/ngày
    const itemsPerPage = 10;
    const totalDays = Math.ceil(totalWords / itemsPerPage);
    let maxUnlocked = userData.unlockedDays[currentLevel] || 1;

    // Vòng lặp sinh ra số lượng Ngày linh hoạt theo kho chữ (200 chữ = 20 ngày, 400 chữ = 40 ngày)
    for (let d = 1; d <= totalDays; d++) {
        const item = document.createElement('div');
        if (d <= maxUnlocked) {
            item.className = "day-item active-day";
            item.onclick = () => startDayStudy(d);
            item.innerHTML = `<div class="day-number">NGÀY ${String(d).padStart(2, '0')}</div><div class="day-status">SẴN SÀNG 🔥</div>`;
        } else {
            item.className = "day-item locked-day";
            item.innerHTML = `<div class="day-number">NGÀY ${String(d).padStart(2, '0')}</div><div class="day-status"><i class="fa-solid fa-lock"></i> Chưa mở khóa</div>`;
        }
        daysBox.appendChild(item);
    }
}

function startDayStudy(dayNumber) {
    let startIdx = (dayNumber - 1) * 10;
    dayWords = fullLevelData.slice(startIdx, startIdx + 10);
    
    if(dayWords.length === 0) {
        alert("Ngày này đang được cập nhật thêm chữ bro ơi!");
        return;
    }

    document.getElementById('js-zone-title').innerText = `NGÀY ${String(dayNumber).padStart(2, '0')}`;
    currentQuestionIndex = 0;
    isQuizMode = false; 
    switchScreen('study-zone');
    showFlashcard();
}

// ==========================================
// 4. CHẾ ĐỘ CHẠY FLASHCARD (LẬT MẶT CHỮ)
// ==========================================
function showFlashcard() {
    document.getElementById('js-flip-card').classList.remove('flipped');
    document.getElementById('js-mode-badge').innerText = "CHẾ ĐỘ: HỌC THẺ FLIP";
    document.getElementById('js-mode-badge').style.color = "var(--cyber-blue)";

    correctAnswerData = dayWords[currentQuestionIndex];
    document.getElementById('js-kanji').innerText = correctAnswerData.kanji;
    
    // Đổ dữ liệu mặt sau kèm từ ghép thực chiến
    document.getElementById('js-meaning').innerText = correctAnswerData.meaning.toUpperCase();
    document.getElementById('js-onyomi').innerHTML = `<strong>Onyomi:</strong> ${correctAnswerData.onyomi}`;
    document.getElementById('js-kunyomi').innerHTML = `<strong>Kunyomi:</strong> ${correctAnswerData.kunyomi}`;
    
    const existingExample = document.getElementById('js-example');
    if (existingExample) {
        existingExample.innerHTML = `<strong>Từ ghép đi kèm:</strong> <span style="color: var(--cyber-green);">${correctAnswerData.example}</span>`;
    } else {
        const p = document.createElement('p');
        p.id = 'js-example';
        p.style.marginTop = '10px';
        p.innerHTML = `<strong>Từ ghép đi kèm:</strong> <span style="color: var(--cyber-green);">${correctAnswerData.example}</span>`;
        document.querySelector('.card-back .yomi-details').appendChild(p);
    }

    // Nút bấm tiến độ điều hướng ở Thumb-zone
    const optionsBox = document.getElementById('js-options-box');
    optionsBox.innerHTML = "";
    
    const nextBtn = document.createElement('button');
    nextBtn.className = "answer-btn";
    nextBtn.style.justifyContent = "center";
    
    if (currentQuestionIndex < dayWords.length - 1) {
        nextBtn.innerText = "CHỮ TIẾP THEO 👉";
        nextBtn.onclick = () => { currentQuestionIndex++; showFlashcard(); };
    } else {
        nextBtn.innerText = "⚡ BẮT ĐẦU KIỂM TRA NGAY ⚡";
        nextBtn.style.borderColor = "var(--cyber-pink)";
        nextBtn.style.color = "var(--cyber-pink)";
        nextBtn.onclick = () => { currentQuestionIndex = 0; isQuizMode = true; runDayQuiz(); };
    }
    optionsBox.appendChild(nextBtn);
    document.getElementById('js-progress').innerText = `${currentQuestionIndex + 1}/${dayWords.length}`;
}

// ==========================================
// 5. CHẾ ĐỘ TRẮC NGHIỆM ĐÁNH GIÁ KIẾN THỨC
// ==========================================
function runDayQuiz() {
    document.getElementById('js-flip-card').classList.remove('flipped');
    document.getElementById('js-mode-badge').innerText = "CHẾ ĐỘ: KIỂM TRA";
    document.getElementById('js-mode-badge').style.color = "var(--cyber-pink)";

    correctAnswerData = dayWords[currentQuestionIndex];
    document.getElementById('js-kanji').innerText = correctAnswerData.kanji;

    // Tạo 4 đáp án trắc nghiệm nhiễu trộn ngẫu nhiên
    let options = [correctAnswerData.meaning];
    let fakes = fullLevelData.filter(i => i.meaning !== correctAnswerData.meaning).map(i => i.meaning);
    fakes.sort(() => 0.5 - Math.random());
    for(let i=0; i<3; i++) { if(fakes[i]) options.push(fakes[i]); else options.push(`Đáp án nhiễu ${i}`); }
    options.sort(() => 0.5 - Math.random());

    const optionsBox = document.getElementById('js-options-box');
    optionsBox.innerHTML = "";
    const labels = ["A", "B", "C", "D"];
    
    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "answer-btn";
        btn.onclick = () => checkQuizAnswer(btn, opt);
        btn.innerHTML = `<span class="answer-text">${opt}</span><span class="answer-idx">${labels[idx]}</span>`;
        optionsBox.appendChild(btn);
    });

    document.getElementById('js-progress').innerText = `${currentQuestionIndex + 1}/${dayWords.length}`;
}

function checkQuizAnswer(btn, selectedText) {
    const btns = document.querySelectorAll('.answer-btn');
    btns.forEach(b => b.style.pointerEvents = "none");

    if(selectedText === correctAnswerData.meaning) {
        btn.classList.add('btn-correct');
        userData.xp += 15;
        if(navigator.vibrate) navigator.vibrate(50); // Hiệu ứng rung bần bật khi chọn đúng
    } else {
        btn.classList.add('btn-wrong');
        btns.forEach(b => { if(b.querySelector('.answer-text').innerText === correctAnswerData.meaning) b.classList.add('btn-correct'); });
    }

    updateGlobalStats();
    saveUserData();

    setTimeout(() => {
        currentQuestionIndex++;
        if(currentQuestionIndex < dayWords.length) {
            runDayQuiz();
        } else {
            handleDayComplete();
        }
    }, 1500);
}

function handleDayComplete() {
    alert("🎉 Xuất sắc bro ơi! Đã làm chủ hoàn toàn 10 chữ Kanji của ngày hôm nay!");
    
    const todayStr = new Date().toDateString();
    if(userData.lastStudyDate !== todayStr) {
        userData.streak += 1;
        userData.lastStudyDate = todayStr;
    }

    let currentMax = userData.unlockedDays[currentLevel] || 1;
    let dayCompleted = Math.ceil((fullLevelData.indexOf(dayWords[0]) + 1) / 10);
    if(dayCompleted >= currentMax) {
        userData.unlockedDays[currentLevel] = dayCompleted + 1;
    }

    saveUserData();
    updateGlobalStats();
    switchScreen('learn-hub');
}

// ==========================================
// 6. CHẾ ĐỘ ĐẤU TRƯỜNG CHỚP NHOÁNG (TEST TỔNG HỢP)
// ==========================================
function startTestMode() {
    if(fullLevelData.length === 0) {
        alert("Bro vui lòng vào mục Lộ Trình chọn một cấp độ (N5-N1) để tải dữ liệu trước khi vào Đấu trường nhé!");
        return;
    }
    dayWords = [...fullLevelData].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentQuestionIndex = 0;
    isQuizMode = true;
    document.getElementById('js-zone-title').innerText = `ĐẤU TRƯỜNG CHỚP NHOÁNG`;
    switchScreen('study-zone');
    runDayQuiz();
}

function changeLevel(lvl) {
    const tabs = document.querySelectorAll('.level-tab');
    tabs.forEach(t => { if(t.innerText === lvl) t.classList.add('active'); else t.classList.remove('active'); });
    currentLevel = lvl;
    loadLevelData(lvl);
}

function toggleCard() {
    document.getElementById('js-flip-card').classList.toggle('flipped');
}

// ==========================================
// 7. LƯU TRỮ VÀ KHỞI CHẠY HỆ THỐNG
// ==========================================
function updateGlobalStats() {
    document.getElementById('js-streak').innerText = userData.streak;
    document.getElementById('js-menu-exp').innerText = `${userData.xp} XP`;
    
    let rank = "TÂN BINH 🔰";
    if(userData.xp >= 100 && userData.xp < 300) rank = "THỢ SĂN BỘ THỦ ⚡";
    if(userData.xp >= 300 && userData.xp < 800) rank = "QUÁI KIỆT KANJI 🔥";
    if(userData.xp >= 800) rank = "HUYỀN THOẠI N1 🌌";
    const rankDisp = document.getElementById('rank-display');
    if (rankDisp) rankDisp.innerText = rank;
}

function saveUserData() { localStorage.setItem('cyber_kanji_v2_data', JSON.stringify(userData)); }
function loadUserData() {
    const saved = localStorage.getItem('cyber_kanji_v2_data');
    if(saved) { userData = JSON.parse(saved); }
    updateGlobalStats();
    loadLevelData(currentLevel); // Tự động nạp N5 khi mở app lên
}

function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(err => console.log(err)); });
    }
}
