let userXP = parseInt(localStorage.getItem('cyber_kanji_xp')) || 0;
let agentName = "nam";
let currentLevel = "n5";
let kanjiData = [];
let currentSpeechText = "";

// 1. QUẢN LÝ CHUYỂN MÀN HÌNH
const navigation = {
    login: function() {
        const input = document.getElementById('agent-name-input');
        if (input && input.value.trim() !== "") {
            agentName = input.value.trim();
        }
        document.getElementById('js-agent-name').innerText = agentName;
        this.showScreen('scr-home');
    },
    showScreen: function(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) activeScreen.classList.add('active');
        
        // Tự động tắt đầu phát âm khi chuyển màn hình cho đỡ lỗi
        audioPlayer.close();
    }
};

// 2. TẢI VÀ ĐỔ DỮ LIỆU KANJI (HÚT CHUẨN ĐÚNG BIẾN JSON CỦA BRO)
const learning = {
    loadData: function(level) {
        currentLevel = level;
        navigation.showScreen('scr-learning');
        document.getElementById('level-display').innerText = level.toUpperCase();
        document.getElementById('learning-title').innerText = `ĐANG TẢI FILE ${level.toUpperCase()}...`;
        
        const container = document.getElementById('kanji-list-container');
        container.innerHTML = "";

        fetch(`./${level}.json`)
            .then(res => {
                if (!res.ok) throw new Error("Lỗi đọc file");
                return res.json();
            })
            .then(data => {
                kanjiData = data;
                document.getElementById('learning-title').innerText = `CẤP ĐỘ ${level.toUpperCase()} (${data.length} CHỮ)`;
                this.renderList();
            })
            .catch(err => {
                document.getElementById('learning-title').innerText = "LỖI TẢI FILE";
                container.innerHTML = `<p style="color: #ff0055; text-align:center; padding:20px;">❌ Không đọc được file "${level}.json". Bạn nhớ kiểm tra xem file đã nằm ở thư mục gốc chưa nhé!</p>`;
            });
    },
    renderList: function() {
        const container = document.getElementById('kanji-list-container');
        container.innerHTML = "";

        kanjiData.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = "kanji-card";
            
            // Đọc chính xác cấu trúc dữ liệu tiếng Việt mới của bạn
            const kChar = item.kanji || "";
            const kMeaning = item.meaning || "";
            const kOnyomi = item.onyomi || "None";
            const kKunyomi = item.kunyomi || "None";
            const kExample = item.example || "";

            card.innerHTML = `
                <div class="card-main">
                    <div class="kanji-glyph">${kChar}</div>
                    <div class="kanji-info">
                        <div class="kanji-meaning">${kMeaning}</div>
                        <div class="kanji-readings">
                            <span><strong>Onyomi:</strong> ${kOnyomi}</span>
                            <span><strong>Kunyomi:</strong> ${kKunyomi}</span>
                        </div>
                    </div>
                </div>
                <div class="card-example">
                    <strong>Ví dụ:</strong> ${kExample}
                </div>
                <div class="card-actions" onclick="event.stopPropagation();">
                    <button class="action-btn speak-btn" onclick="audioPlayer.play('${kOnyomi}')">🔊 Đọc Onyomi</button>
                    <button class="action-btn shadow-btn" onclick="shadowing.open('${kChar}')">🎙️ Shadowing</button>
                </div>
            `;
            
            // Bấm nguyên cái thẻ cũng kích hoạt phát âm mẫu
            card.onclick = () => audioPlayer.play(kOnyomi);
            container.appendChild(card);
        });
    }
};

// 3. ĐẦU PHÁT ÂM MẪU (AUDIO PLAYER)
const audioPlayer = {
    play: function(text) {
        if (!text || text === "None") return;
        currentSpeechText = text;
        
        // Hiển thị thanh nghe bám đáy di động
        const player = document.getElementById('global-audio-player');
        player.classList.remove('hidden');
        document.getElementById('player-text').innerText = `Đang phát âm: ${text}`;

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            // Làm sạch các ký tự phân tách để máy đọc nuột nà
            let cleanText = text.replace(/[\/()（）\-,ー]/g, ' ').trim();
            let utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'ja-JP';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
            
            // Cộng điểm XP tượng trưng
            updateXP(1);
        }
    },
    replay: function() {
        if (currentSpeechText) this.play(currentSpeechText);
    },
    close: function() {
        document.getElementById('global-audio-player').classList.add('hidden');
    }
};

// 4. MODAL LUYỆN NÓI SHADOWING (SỬ DỤNG MICROPHONE)
const shadowing = {
    open: function(kanjiCharacter) {
        currentSpeechText = kanjiCharacter;
        document.getElementById('shadow-target-box').innerText = kanjiCharacter;
        document.getElementById('shadow-status').innerText = "READY?";
        document.getElementById('shadowing-modal').classList.remove('hidden');
        
        // Tự động phát âm luôn chữ đó cho cơ miệng nghe quen trước
        audioPlayer.play(kanjiCharacter);
    },
    startListening: function() {
        const statusText = document.getElementById('shadow-status');
        if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
            statusText.innerText = "Trình duyệt không hỗ trợ Micro!";
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP'; // Đón âm tiếng Nhật
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        statusText.innerText = "🎙️ ĐANG NGHE... NÓI ĐI!";
        statusText.style.color = "#ff00ff";
        recognition.start();

        recognition.onresult = (event) => {
            const userSaid = event.results[0][0].transcript;
            statusText.innerText = `Bạn nói: "${userSaid}"`;
            statusText.style.color = "#00ffcc";
            updateXP(5); // Luyện nói khó hơn cho hẳn 5 XP
        };

        recognition.onerror = (err) => {
            statusText.innerText = "❌ Không nghe rõ, thử lại bro!";
            statusText.style.color = "#ff0055";
        };

        recognition.onend = () => {
            if(statusText.innerText === "🎙️ ĐANG NGHE... NÓI ĐI!") {
                statusText.innerText = "KẾT THÚC THỜI GIAN NGHE";
                statusText.style.color = "#94a3b8";
            }
        };
    },
    close: function() {
        document.getElementById('shadowing-modal').classList.add('hidden');
    }
};

// 5. CẬP NHẬT ĐIỂM XP LÊN MÀN HÌNH
function updateXP(amount) {
    userXP += amount;
    localStorage.setItem('cyber_kanji_xp', userXP);
    document.getElementById('xp-count').innerText = userXP;
}

// Khởi tạo ban đầu khi mở app
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('xp-count').innerText = userXP;
});
