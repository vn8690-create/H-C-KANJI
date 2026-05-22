if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Cyber Kanji PWA đã kích hoạt!', reg.scope))
      .catch(err => console.log('Lỗi PWA:', err));
  });
}
// ==========================================
// BIẾN TOÀN CỤC ĐIỀU KHIỂN HỆ THỐNG
// ==========================================
let currentLevel = "N5";
let currentKanjiList = [];
let currentQuestionIndex = 0;
let correctAnswerData = null;

let totalXP = 0;
let masteredCount = 0;

// Khởi chạy hệ thống khi điện thoại load xong web
window.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    initLevel(currentLevel); // Mặc định chạy N5 trước
});

// ==========================================
// LOGIC GỌI FILE DỮ LIỆU ĐỘNG (FETCH JSON)
// ==========================================
async function initLevel(level) {
    currentLevel = level;
    
    try {
        // Gọi file JSON tương ứng (Ví dụ: n5.json, n4.json...) từ GitHub
        const response = await fetch(`${level.toLowerCase()}.json`);
        if (!response.ok) throw new Error("Không thể tải file dữ liệu!");
        
        const data = await response.json();
        currentKanjiList = [...data];
        
        // Thuật toán xáo trộn danh sách Kanji ngẫu nhiên
        for (let i = currentKanjiList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentKanjiList[i], currentKanjiList[j]] = [currentKanjiList[j], currentKanjiList[i]];
        }

        currentQuestionIndex = 0;
        generateQuestion();
        
    } catch (error) {
        console.error("Lỗi hệ thống:", error);
        alert(`Bro ơi, file ${level}.json chưa có dữ liệu hoặc bị lỗi rồi!`);
    }
}

// ==========================================
// TẠO CÂU HỎI TRẮC NGHIỆM TỪ DATA ĐÃ TẢI
// ==========================================
function generateQuestion() {
    if (currentKanjiList.length === 0) return;

    if (currentQuestionIndex >= currentKanjiList.length) {
        // Học hết file thì đảo lại từ đầu để ôn tập
        currentQuestionIndex = 0;
        initLevel(currentLevel);
        return;
    }

    // Đóng thẻ lật về mặt trước trước khi đổi chữ mới
    document.getElementById('js-flip-card').classList.remove('flipped');

    correctAnswerData = currentKanjiList[currentQuestionIndex];
    
    // Đổ chữ lên mặt trước card
    document.getElementById('js-kanji').innerText = correctAnswerData.kanji;
    
    // Đổ đáp án chi tiết lên mặt sau card
    document.getElementById('js-meaning').innerText = correctAnswerData.meaning.toUpperCase();
    document.getElementById('js-onyomi').innerHTML = `<strong>Onyomi:</strong> ${correctAnswerData.onyomi}`;
    document.getElementById('js-kunyomi').innerHTML = `<strong>Kunyomi:</strong> ${correctAnswerData.kunyomi}`;

    // Tạo danh sách 4 đáp án (1 đúng và 3 đáp án nhiễu)
    let options = [correctAnswerData.meaning];
    
    // Tạo đáp án nhiễu tạm thời từ chính danh sách hiện tại để tránh lỗi thiếu data
    let fakeOptions = currentKanjiList
        .filter(item => item.meaning !== correctAnswerData.meaning)
        .map(item => item.meaning);

    // Xáo trộn đáp án nhiễu
    fakeOptions.sort(() => 0.5 - Math.random());
    for(let i = 0; i < 3; i++) {
        if(fakeOptions[i]) {
            options.push(fakeOptions[i]);
        } else {
            options.push(`Đáp án dự phòng ${i + 1}`);
        }
    }

    // Xáo trộn lại vị trí 4 nút bấm
    options.sort(() => 0.5 - Math.random());

    // Đổ ra giao diện Grid nút bấm chuẩn Mobile
    const optionsBox = document.getElementById('js-options-box');
    optionsBox.innerHTML = "";
    
    const labels = ["A", "B", "C", "D"];
    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "answer-btn";
        btn.onclick = () => selectAnswer(btn, opt);
        btn.innerHTML = `
            <span class="answer-text">${opt}</span>
            <span class="answer-idx">${labels[idx]}</span>
        `;
        optionsBox.appendChild(btn);
    });

    // Cập nhật tiến độ dưới đáy
    document.getElementById('js-progress').innerText = `${currentQuestionIndex + 1}/${currentKanjiList.length}`;
}

// ==========================================
// CÁC HÀM XỬ LÝ SỰ KIỆN KHÁC (GIỮ NGUYÊN)
// ==========================================
function selectAnswer(selectedBtn, selectedText) {
    const allButtons = document.querySelectorAll('.answer-btn');
    allButtons.forEach(btn => btn.style.pointerEvents = "none");

    if (selectedText === correctAnswerData.meaning) {
        selectedBtn.classList.add('btn-correct');
        totalXP += 10;
        masteredCount += 1;
        if (navigator.vibrate) navigator.vibrate(50);
    } else {
        selectedBtn.classList.add('btn-wrong');
        allButtons.forEach(btn => {
            const txt = btn.querySelector('.answer-text').innerText;
            if (txt === correctAnswerData.meaning) btn.classList.add('btn-correct');
        });
        if (navigator.vibrate) navigator.vibrate([50, 50]);
    }

    document.getElementById('js-exp').innerText = `${totalXP} XP`;
    updateRank();
    saveUserData();

    setTimeout(() => {
        currentQuestionIndex++;
        generateQuestion();
    }, 1500);
}

function updateRank() {
    let rankName = "LEVEL 1: TÂN BINH 🔰";
    if (totalXP >= 50 && totalXP < 150) rankName = "LEVEL 2: THỢ SĂN BỘ THỦ ⚡";
    if (totalXP >= 150 && totalXP < 400) rankName = "LEVEL 3: QUÁI KIỆT KANJI 🔥";
    if (totalXP >= 400) rankName = "LEVEL 4: HUYỀN THOẠI N1 🌌";
    document.getElementById('rank-display').innerText = rankName;
}

function changeLevel(lvl) {
    const tabs = document.querySelectorAll('.level-tab');
    tabs.forEach(tab => {
        if(tab.innerText === lvl) tab.classList.add('active');
        else tab.classList.remove('active');
    });
    initLevel(lvl); // Kích hoạt gọi file JSON mới
}

function toggleCard() {
    document.getElementById('js-flip-card').classList.toggle('flipped');
}

function saveUserData() {
    const data = { xp: totalXP, mastered: masteredCount };
    localStorage.setItem('cyber_kanji_user_data', JSON.stringify(data));
}

function loadUserData() {
    const saved = localStorage.getItem('cyber_kanji_user_data');
    if (saved) {
        const data = JSON.parse(saved);
        totalXP = data.xp || 0;
        masteredCount = data.mastered || 0;
        document.getElementById('js-exp').innerText = `${totalXP} XP`;
        updateRank();
    }
}
