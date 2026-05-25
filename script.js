let currentData = [];
let currentIndex = 0;

const kanjiEl = document.getElementById("kanji");
const readingEl = document.getElementById("reading");
const meaningEl = document.getElementById("meaning");

document.getElementById("startBtn").addEventListener("click", () => {
    const name = document.getElementById("username").value || "Đặc vụ";
    
    document.getElementById("welcome").innerHTML = `
        <h2>Chào mừng đặc vụ ${name} 🚀</h2>
    `;
});

async function loadLevel(file) {

    try {

        document.getElementById("status").innerText =
            "⚡ ĐANG KÍCH HOẠT DỮ LIỆU...";

        const response = await fetch(`./${file}`);

        if (!response.ok) {
            throw new Error("Không tìm thấy file JSON");
        }

        currentData = await response.json();

        currentIndex = 0;

        showWord();

        document.getElementById("status").innerText =
            `✅ Đã tải ${currentData.length} từ`;

    } catch (error) {

        console.error(error);

        document.getElementById("status").innerText =
            "❌ Lỗi load dữ liệu";
    }
}

function showWord() {

    if (currentData.length === 0) return;

    const word = currentData[currentIndex];

    kanjiEl.innerText = word.kanji || "---";
    readingEl.innerText = word.reading || "";
    meaningEl.innerText = word.meaning || "";
}

function nextWord() {

    if (currentData.length === 0) return;

    currentIndex++;

    if (currentIndex >= currentData.length) {
        currentIndex = 0;
    }

    showWord();
}

function speakWord() {

    if (currentData.length === 0) return;

    const word = currentData[currentIndex];

    const utterance = new SpeechSynthesisUtterance(
        word.reading || word.kanji
    );

    utterance.lang = "ja-JP";

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
}
