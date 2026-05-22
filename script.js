// Quản lý trạng thái màn hình và học tập
let currentLevel = "N5";
let fullLevelData = []; // Chứa toàn bộ chữ của level từ file JSON
let dayWords = [];      // 10 chữ của ngày hiện tại
let currentQuestionIndex = 0;
let correctAnswerData = null;
let isQuizMode = false; // false = đang xem mặt card, true = đang làm quiz kiểm tra ngày

// Chỉ số người dùng lưu trữ lâu dài
let userData = {
    xp: 0,
    streak: 0,
    lastStudyDate: null,
    unlockedDays: { N5: 1, N4: 1, N3: 1, N2: 1, N1: 1 }
};

window.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    initPWA();
});

// Điều hướng chuyển đổi màn hình (Mượt như app thật)
function switchScreen(screenId) {
    document.querySelectorAll('.app-screen').forEach(scr => scr.classList.add('d-none'));
    document.getElementById(`scr-${screenId}`).classList.remove('d-none');
    
    if(screenId === 'learn-hub') {
        renderDaysList();
    }
}

// Gọi file JSON từ GitHub và phân phối lộ trình
async function loadLevelData(level) {
    try {
        const response = await fetch(`${level.toLowerCase()}.json`);
        fullLevelData = await response.json();
        renderDaysList();
    } catch (err) {
        console.error("Lỗi nạp chữ:", err);
    }
}

// Tạo danh sách các Ngày tự động (Mỗi ngày ngậm đúng 10 từ)
function renderDaysList() {
    const totalWords = fullLevelData.length || 10; 
    const totalDays = Math.ceil(totalWords / 10);
    const daysBox = document.getElementById('js-days-list');
    daysBox.innerHTML = "";

    let maxUnlocked = userData.unlockedDays[currentLevel] || 1;

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

// Kích hoạt học 10 từ của Ngày được chọn
function startDayStudy(dayNumber) {
    let startIdx = (dayNumber - 1) * 10;
    dayWords = fullLevelData.slice(startIdx, startIdx + 10);
    
    if(dayWords.length === 0) {
        alert("Ngày này đang được cập nhật thêm chữ bro ơi!");
        return;
    }

    document.getElementById('js-zone-title').innerText = `NGÀY ${String(dayNumber).padStart(2, '0')}`;
    currentQuestionIndex = 0;
    isQuizMode = false; // Bắt đầu bằng việc học lật Flashcard trước
    switchScreen('study-zone');
    showFlashcard();
}

// CHẾ ĐỘ 1: Hiện flashcard học thuộc lòng
function showFlashcard() {
    document.getElementById('js-flip-card').classList.remove('flipped');
    document.getElementById('js-mode-badge').innerText = "CHẾ ĐỘ: HỌC THẺ FLIP";
    document.getElementById('js-mode-badge').style.color = "var(--cyber-blue)";

    correctAnswerData = dayWords[currentQuestionIndex];
    document.getElementById('js-kanji').innerText = correctAnswerData.kanji;
    document.getElementById('js-meaning').innerText = correctAnswerData.meaning.toUpperCase();
    document.getElementById('js-onyomi').innerHTML = `<strong>Onyomi:</strong> ${correctAnswerData.onyomi}`;
    document.getElementById('js-kunyomi').innerHTML = `<strong>Kunyomi:</strong> ${correctAnswerData.kunyomi}`;

    // Nút điều hướng chuyển sang câu tiếp theo hoặc chuyển sang làm Quiz nếu đã xem hết 10 từ
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

// CHẾ ĐỘ 2: Trắc nghiệm sinh tử để kiểm tra lại 10 từ vừa học
function runDayQuiz() {
    document.getElementById('js-flip-card').classList.remove('flipped');
    document.getElementById('js-mode-badge').innerText = "CHẾ ĐỘ: KIỂM TRA";
    document.getElementById('js-mode-badge').style.color = "var(--cyber-pink)";

    correctAnswerData = dayWords[currentQuestionIndex];
    document.getElementById('js-kanji').innerText = correctAnswerData.kanji;

    // Tạo 4 nút trắc nghiệm trộn ngẫu nhiên
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
        if(navigator.vibrate) navigator.vibrate(50);
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
            // ĐÃ HOÀN THÀNH XONG 10 CÂU QUIZ CỦA NGÀY!
            handleDayComplete();
        }
    }, 1500);
}

// Xử lý khi cày xong 1 ngày: Cộng chuỗi Streak, mở khóa ngày mới
function handleDayComplete() {
    alert("🎉 Xuất sắc bro ơi! Đã làm chủ hoàn toàn 10 chữ Kanji của ngày hôm nay!");
    
    // Xử lý tăng chuỗi ngày liên tục (Streak)
    const todayStr = new Date().toDateString();
    if(userData.lastStudyDate !== todayStr) {
        userData.streak += 1;
        userData.lastStudyDate = todayStr;
    }

    // Mở khóa ngày học tiếp theo
    let currentMax = userData.unlockedDays[currentLevel] || 1;
    let dayCompleted = Math.ceil(fullLevelData.indexOf(dayWords[0]) / 10) + 1;
    if(dayCompleted > currentMax) {
        userData.unlockedDays[currentLevel] = dayCompleted;
    }

    saveUserData();
    updateGlobalStats();
    switchScreen('learn-hub');
}

// CHẾ ĐỘ ĐẤU TRƯỜNG TỔNG HỢP (TEST MODE TOÀN LEVEL)
function startTestMode() {
    if(fullLevelData.length === 0) {
        alert("Bro vui lòng vào mục Lộ Trình chọn một cấp độ (N5-N1) để tải dữ liệu trước khi vào Đấu trường nhé!");
        return;
    }
    // Lấy ngẫu nhiên 10 từ bất kỳ trong kho để làm bài test tổng hợp
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

// ĐỒNG BỘ CHỈ SỐ LÊN GIAO DIỆN CYBER
function updateGlobalStats() {
    document.getElementById('js-streak').innerText = userData.streak;
    document.getElementById('js-menu-exp').innerText = `${userData.xp} XP`;
    
    let rank = "TÂN BINH 🔰";
    if(userData.xp >= 100 && userData.xp < 300) rank = "THỢ SĂN BỘ THỦ ⚡";
    if(userData.xp >= 300 && userData.xp < 800) rank = "QUÁI KIỆT KANJI 🔥";
    if(userData.xp >= 800) rank = "HUYỀN THOẠI N1 🌌";
    document.getElementById('rank-display').innerText = rank;
}

function saveUserData() { localStorage.setItem('cyber_kanji_v2_data', JSON.stringify(userData)); }
function loadUserData() {
    const saved = localStorage.getItem('cyber_kanji_v2_data');
    if(saved) { userData = JSON.parse(saved); }
    updateGlobalStats();
    loadLevelData(currentLevel);
}
function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(err => console.log(err)); });
    }
}
