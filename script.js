let diemXP = parseInt(localStorage.getItem('kanji_pure_xp')) || 0;
let duLieuHienTai = [];

// Hàm chuyển đổi qua lại giữa các màn hình nhanh chóng
function ChuyenManHinh(idManHinh) {
    document.querySelectorAll('.man-hinh').forEach(man => {
        man.classList.remove('active');
    });
    const manChon = document.getElementById(idManHinh);
    if (manChon) manChon.classList.add('active');
}

// Hàm fetch đọc trực tiếp file JSON (n5.json, n4.json...)
function TaiDuLieuKanji(tenFile) {
    ChuyenManHinh('man-hoc');
    const tieuDe = document.getElementById('tieu-de-bai-hoc');
    const vungChua = document.getElementById('vung-chua-the-kanji');
    
    tieuDe.innerText = `ĐANG TẢI DỮ LIỆU ${tenFile.toUpperCase()}...`;
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
            vungChua.innerHTML = `<p class="bao-loi">❌ Không đọc được file "${tenFile}.json". Bạn nhớ kiểm tra xem file đã nằm ở thư mục gốc của kho lưu trữ chưa nhé!</p>`;
        });
}

// Hàm render đổ dữ liệu ra giao diện (Đọc chuẩn xác cấu trúc biến của bạn)
function InDanhSachKanji() {
    const vungChua = document.getElementById('vung-chua-the-kanji');
    vungChua.innerHTML = "";

    duLieuHienTai.forEach(item => {
        const theKanji = document.createElement('div');
        theKanji.className = 'the-kanji-card';
        
        // Trích xuất chuẩn xác dữ liệu
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
                <button class="nut-loa" onclick="event.stopPropagation(); PhatAmTiengNhat('${onyomi}')">🔊 Phát âm Onyomi</button>
            </div>
        `;

        // Tiện ích: Bấm nguyên vào thẻ card cũng kích hoạt âm thanh mẫu
        theKanji.onclick = function() {
            PhatAmTiengNhat(onyomi);
        };

        vungChua.appendChild(theKanji);
    });
}

// Hàm phát âm tiếng Nhật bằng Web Speech API thuần túy của trình duyệt
function PhatAmTiengNhat(chuoiDoc) {
    if (!chuoiDoc || chuoiDoc === "None") return;
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Tắt các âm thanh đang phát dở
        
        // Làm sạch chuỗi ký tự phân tách để máy đọc trơn tru
        let chuoiChuan = chuoiDoc.replace(/[\/()（）\-,ー]/g, ' ').trim();
        let utterance = new SpeechSynthesisUtterance(chuoiChuan);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.82; // Tốc độ đọc chậm rãi, rõ chữ
        window.speechSynthesis.speak(utterance);
        
        // Tăng điểm thưởng XP tương tác
        diemXP += 1;
        localStorage.setItem('kanji_pure_xp', diemXP);
        document.getElementById('id-xp').innerText = diemXP;
    } else {
        alert("Thiết bị hoặc trình duyệt không hỗ trợ giọng đọc tiếng Nhật!");
    }
}

// Khởi chạy đồng bộ điểm khi vừa vào trang web
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('id-xp').innerText = diemXP;
});
