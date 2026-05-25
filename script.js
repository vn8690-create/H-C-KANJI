let diemXP = parseInt(localStorage.getItem('kanji_pure_xp')) || 0;
let duLieuHienTai = [];

// Hàm chuyển đổi qua lại giữa các màn hình
function ChuyenManHinh(idManHinh) {
    // Ẩn tất cả các màn hình
    document.querySelectorAll('.man-hinh').forEach(man => {
        man.classList.remove('active');
    });
    // Hiển thị màn hình được chọn
    const manChon = document.getElementById(idManHinh);
    if (manChon) manChon.classList.add('active');
}

// Hàm fetch đọc file JSON tương ứng (n5.json, n4.json...)
function TaiDuLieuKanji(tenFile) {
    ChuyenManHinh('man-hoc');
    const tieuDe = document.getElementById('tieu-de-bai-hoc');
    const vungChua = document.getElementById('vung-chua-the-kanji');
    
    tieuDe.innerText = `ĐANG TẢI CẤP ĐỘ ${tenFile.toUpperCase()}...`;
    vungChua.innerHTML = "";

    fetch(`./${tenFile}.json`)
        .then(res => {
            if (!res.ok) throw new Error("Không tìm thấy file JSON");
            return res.json();
        })
        .then(data => {
            duLieuHienTai = data;
            tieuDe.innerText = `CẤP ĐỘ ${tenFile.toUpperCase()} (${data.length} CHỮ)`;
            InDanhSachKanji();
        })
        .catch(err => {
            console.error(err);
            tieuDe.innerText = "LỖI HỆ THỐNG";
            vungChua.innerHTML = `<p class="bao-loi">❌ Không đọc được file "${tenFile}.json". Bro check lại xem file json đã nằm ở thư mục gốc chưa nhé!</p>`;
        });
}

// Hàm render đổ dữ liệu ra giao diện (Hút chuẩn biến tiếng Việt của bro)
function InDanhSachKanji() {
    const vungChua = document.getElementById('vung-chua-the-kanji');
    vungChua.innerHTML = "";

    duLieuHienTai.forEach(item => {
        const theKanji = document.createElement('div');
        theKanji.className = 'the-kanji-card';
        
        // Đọc chuẩn cấu trúc JSON mới của bro
        const chuKanji = item.kanji || "字";
        const nghia = item.meaning || "";
        const onyomi = item.onyomi || "None";
        const kunyomi = item.kunyomi || "None";
        const viDu = item.example || "";

        theKanji.innerHTML = `
            <div class="card-top">
                <div class="chu-to">${chuKanji}</div>
                <div class="thong-tin-chu">
                    <div class="nghia-tieng-viet">${nghia}</div>
                    <div class="cach-doc"><strong>Onyomi:</strong> ${onyomi}</div>
                    <div class="cach-doc"><strong>Kunyomi:</strong> ${kunyomi}</div>
                </div>
            </div>
            <div class="card-bottom">
                <strong>Ví dụ:</strong> ${viDu}
            </div>
            <div class="card-nut-bam">
                <button class="nut-loa" onclick="event.stopPropagation(); PhatAmTiengNhat('${onyomi}')">🔊 Nghe Onyomi</button>
            </div>
        `;

        // Bấm nguyên cái thẻ cũng tự động phát âm Onyomi
        theKanji.onclick = function() {
            PhatAmTiengNhat(onyomi);
        };

        vungChua.appendChild(theKanji);
    });
}

// Hàm phát âm tiếng Nhật chuẩn bằng API trình duyệt
function PhatAmTiengNhat(chuoiDoc) {
    if (!chuoiDoc || chuoiDoc === "None") return;
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Tắt âm đang đọc dở (nếu có)
        
        // Làm sạch các ký tự phân tách để máy đọc nuột nà
        let chuoiChuan = chuoiDoc.replace(/[\/()（）\-,ー]/g, ' ').trim();
        let utterance = new SpeechSynthesisUtterance(chuoiChuan);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.85; // Tốc độ đọc vừa phải dễ nghe
        window.speechSynthesis.speak(utterance);
        
        // Tăng điểm XP cho vui vẻ
        diemXP += 1;
        localStorage.setItem('kanji_pure_xp', diemXP);
        document.getElementById('id-xp').innerText = diemXP;
    } else {
        alert("Trình duyệt này không hỗ trợ phát âm tiếng Nhật bro ơi!");
    }
}

// Chạy khi trang web vừa tải xong
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('id-xp').innerText = diemXP;
});
