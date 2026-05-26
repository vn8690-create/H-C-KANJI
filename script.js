// =========================================================================
// KHU VỰC 1: BIẾN TOÀN CỤC & TRẠNG THÁI APP
// =========================================================================
let diemXP = parseInt(localStorage.getItem('kanji_pure_xp')) || 0;
let duLieuHienTai = []; // Chứa toàn bộ dữ liệu file JSON tải về
let indexHienTai = 0;   // Chỉ số chữ đang học hiện tại
let boDemThoiGian = null; // Quản lý setTimeout để không bị chồng chéo âm thanh

// =========================================================================
// KHU VỰC 2: ĐIỀU HƯỚNG MÀN HÌNH MƯỢT MÀ
// =========================================================================
function ChuyenManHinh(idManHinh) {
    document.querySelectorAll('.man-hinh').forEach(man => {
        man.classList.remove('active');
    });
    const manChon = document.getElementById(idManHinh);
    if (manChon) manChon.classList.add('active');
}

function QuayVeHome() {
    // Tắt âm thanh đang đọc dở và xóa các lệnh chờ timeline nếu người dùng thoát ra ngoài
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    clearTimeout(boDemThoiGian);
    ChuyenManHinh('man-home');
}

// =========================================================================
// KHU VỰC 3: TẢI DỮ LIỆU TỪ FILE JSON (ĐỌC HẾT MẢNG, KHÔNG GIỚI HẠN)
// =========================================================================
function TaiDuLieuKanji(tenFile) {
    ChuyenManHinh('man-hoc');
    
    const tieuDe = document.getElementById('tieu-de-bai-hoc');
    const vungChua = document.getElementById('vung-chua-the-kanji');
    const nutChuyen = document.getElementById('vung-nut-chuyen-trang');
    
    tieuDe.innerText = `ĐANG KẾT NỐI...`;
    vungChua.innerHTML = `<div class="loading-text">⚡ Đang kích hoạt bộ não từ vựng...</div>`;
    nutChuyen.classList.add('an-giau');

    fetch(`./${tenFile}.json`)
        .then(res => {
            if (!res.ok) throw new Error("Không tìm thấy file dữ liệu.");
            return res.json();
        })
        .then(data => {
            // SỬA LỖI CHÍ CHÍMẠNG: Gán toàn bộ mảng dữ liệu gốc, bao nhiêu chữ nhận bấy nhiêu chữ!
            duLieuHienTai = data; 
            indexHienTai = 0; // Reset về chữ đầu tiên của cấp độ đó
            
            ChayFlashcardTungChu();
        })
        .catch(err => {
            console.error(err);
            tieuDe.innerText = "LỖI HỆ THỐNG";
            vungChua.innerHTML = `<p class="bao-loi">❌ Không đọc được file "${tenFile}.json". Bro check lại tên file xem nhé!</p>`;
        });
}

// =========================================================================
// KHU VỰC 4: QUẢN LÝ DÒNG THỜI GIAN (TIMELINE) CHO TỪNG CHỮ MỘT
// =========================================================================
function ChayFlashcardTungChu() {
    const vungChua = document.getElementById('vung-chua-the-kanji');
    const tieuDe = document.getElementById('tieu-de-bai-hoc');
    const nutChuyen = document.getElementById('vung-nut-chuyen-trang');

    // Nếu đã học hết sạch mảng chữ cái
    if (duLieuHienTai.length === 0 || indexHienTai >= duLieuHienTai.length) {
        tieuDe.innerText = "HOÀN THÀNH!";
        vungChua.innerHTML = `<div class="loading-text" style="color: #00ffcc;">🎉 Quá đỉnh bro ơi! Đã nuốt hết toàn bộ từ vựng cấp độ này rồi!</div>`;
        nutChuyen.classList.add('an-giau');
        return;
    }

    // Hiển thị tiến độ thực tế 
    tieuDe.innerText = `TIẾN ĐỘ: ${indexHienTai + 1} / ${duLieuHienTai.length}`;
    nutChuyen.classList.add('an-giau'); // Ẩn nút tiếp theo đi, học xong timeline mới hiện

    const item = duLieuHienTai[indexHienTai];
    
    const chuKanji = item.kanji || "字";
    const nghiaGoc = item.meaning || "";
    const onyomi = item.onyomi || "";
    const kunyomi = item.kunyomi || "";
    const viDu = item.example || "";

    // Tách lấy chữ trong ngoặc đơn để làm Âm Hán Việt chuẩn (Ví dụ: NGẤN)
    let amHanViet = "Chưa rõ";
    if (nghiaGoc.includes('(') && nghiaGoc.includes(')')) {
        amHanViet = nghiaGoc.substring(nghiaGoc.indexOf('(') + 1, nghiaGoc.indexOf(')'));
    }
    // Lấy phần nghĩa thuần tiếng Việt (Ví dụ: Vết sẹo, vết xước bề mặt)
    let nghiaTiengViet = nghiaGoc.split('(')[0].trim();

    // THAY ĐỔI CẤU TRÚC GIAO DIỆN THEO Ý BRO:
    vungChua.innerHTML = `
        <div class="the-cyber-card">
            <div class="chu-kanji-khong-lo">${chuKanji}</div>
            
            <div id="step-am-doc" class="khoi-noi-dung an-giau">
                <div class="label-am-han">ÂM HÁN: ${amHanViet.toUpperCase()}</div>
            </div>

            <div id="step-nghia-viet" class="khoi-nghia-viet an-giau">
                <div class="text-nghia">${nghiaTiengViet}</div>
            </div>

            <div id="step-yomi" class="khoi-yomi-duoi an-giau" style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">
                <div class="dong-cach-doc" style="color: #cbd5e1; font-size: 0.95rem; margin: 4px 0;"><strong>Onyomi:</strong> ${onyomi}</div>
                <div class="dong-cach-doc" style="color: #cbd5e1; font-size: 0.95rem; margin: 4px 0;"><strong>Kunyomi:</strong> ${kunyomi}</div>
            </div>

            <div id="step-tu-ghep" class="khoi-tu-ghep an-giau">
                <div class="title-ghep">Từ Ghép Tạo Nghĩa:</div>
                <div class="content-ghep">${viDu}</div>
            </div>
        </div>
    `;

    // DỌN SẠCH BỘ ĐẾM CŨ ĐỂ KHÔNG BỊ TRÙNG LẶP
    clearTimeout(boDemThoiGian);

    // ====== KÍCH HOẠT CHUỖI TIMELINE TỰ ĐỘNG CHẠY MỚI ======
    
    // ĐOẠN A: Đợi 1 giây -> Hiện Âm Hán (NGẤN) + Đọc Onyomi tiếng Nhật lên trước
    boDemThoiGian = setTimeout(() => {
        const phanAmDoc = document.getElementById('step-am-doc');
        if (phanAmDoc) phanAmDoc.className = "khoi-noi-dung hien-hien";

        DocTiengNhat(onyomi, () => {
            
            // ĐOẠN B: Đọc xong tiếng Nhật -> Đợi 0.5 giây -> Hiện nghĩa tiếng Việt + Đọc nghĩa tiếng Việt luôn
            boDemThoiGian = setTimeout(() => {
                const phanNghia = document.getElementById('step-nghia-viet');
                if (phanNghia) phanNghia.className = "khoi-nghia-viet hien-hien";

                DocTiengViet(nghiaTiengViet, () => {
                    
                    // ĐOẠN C: Đọc xong nghĩa -> Đợi 0.5 giây -> Hiện khối Onyomi/Kunyomi và Từ ghép + Hiện nút chuyển trang
                    boDemThoiGian = setTimeout(() => {
                        const phanYomi = document.getElementById('step-yomi');
                        const phanTuGhep = document.getElementById('step-tu-ghep');
                        
                        if (phanYomi) phanYomi.className = "khoi-yomi-duoi hien-hien";
                        if (phanTuGhep) phanTuGhep.className = "khoi-tu-ghep hien-hien";
                        
                        // Kích hoạt hiển thị nút chuyển bài
                        nutChuyen.classList.remove('an-giau');
                        CongDiemXP();
                    }, 500);

                });
            }, 500);

        });
    }, 1000);
}

function ChuyenChuTiepTheo() {
    indexHienTai++;
    ChayFlashcardTungChu();
}

// =========================================================================
// KHU VỰC 5: HỆ THỐNG BỘ LOA PHÁT ÂM (WEB SPEECH API THUẦN)
// =========================================================================
function DocTiengNhat(vanBan, khiDocXong) {
    if (!vanBan || vanBan === "None") { if(khiDocXong) khiDocXong(); return; }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Dọn dẹp âm thanh cũ
        let utterance = new SpeechSynthesisUtterance(vanBan.replace(/[\/()（）\-,ー]/g, ' '));
        utterance.lang = 'ja-JP';
        utterance.rate = 0.85; // Tốc độ đọc chuẩn học tập
        utterance.onend = () => { if(khiDocXong) khiDocXong(); };
        utterance.onerror = () => { if(khiDocXong) khiDocXong(); };
        window.speechSynthesis.speak(utterance);
    } else {
        if(khiDocXong) khiDocXong();
    }
}

function DocTiengViet(vanBan, khiDocXong) {
    if (!vanBan) { if(khiDocXong) khiDocXong(); return; }
    if ('speechSynthesis' in window) {
        let utterance = new SpeechSynthesisUtterance(vanBan);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95;
        utterance.onend = () => { if(khiDocXong) khiDocXong(); };
        utterance.onerror = () => { if(khiDocXong) khiDocXong(); };
        window.speechSynthesis.speak(utterance);
    } else {
        if(khiDocXong) khiDocXong();
    }
}

// =========================================================================
// KHU VỰC 6: HỆ THỐNG ĐIỂM THƯỞNG XP
// =========================================================================
function CongDiemXP() {
    diemXP += 1;
    localStorage.setItem('kanji_pure_xp', diemXP);
    document.getElementById('id-xp').innerText = diemXP;
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('id-xp').innerText = diemXP;
});
