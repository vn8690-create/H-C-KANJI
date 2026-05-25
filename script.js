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

    // Hiển thị tiến độ thực tế (Ví dụ: TIẾN ĐỘ: 1 / 150)
    tieuDe.innerText = `TIẾN ĐỘ: ${indexHienTai + 1} / ${duLieuHienTai.length}`;
    nutChuyen.classList.add('an-giau'); // Ẩn nút tiếp theo đi, học xong timeline mới hiện

    const item = duLieuHienTai[indexHienTai];
    
    // Trích xuất các biến chuẩn đét từ file JSON của bro
    const chuKanji = item.kanji || "字";
    const nghiaGoc = item.meaning || "";
    const onyomi = item.onyomi || "";
    const kunyomi = item.kunyomi || "";
    const viDu = item.example || "";

    // Mẹo tách lấy chữ trong ngoặc đơn làm Âm Hán Việt
    let amHanViet = "Chưa rõ";
    if (nghiaGoc.includes('(') && nghiaGoc.includes(')')) {
        amHanViet = nghiaGoc.substring(nghiaGoc.indexOf('(') + 1, nghiaGoc.indexOf(')'));
    }
    let nghiaTiengViet = nghiaGoc.split('(')[0].trim();

    // Đổ khung HTML ra (Mặc định ẩn các phần chi tiết bằng class 'an-giau')
    vungChua.innerHTML = `
        <div class="the-cyber-card">
            <div class="chu-kanji-khong-lo">${chuKanji}</div>
            
            <div id="step-am-doc" class="khoi-noi-dung an-giau">
                <div class="label-am-han">ÂM HÁN: ${amHanViet.toUpperCase()}</div>
                <div class="dong-cach-doc"><strong>Onyomi:</strong> ${onyomi}</div>
                <div class="dong-cach-doc"><strong>Kunyomi:</strong> ${kunyomi}</div>
            </div>

            <div id="step-nghia-viet" class="khoi-nghia-viet an-giau">
                <div class="text-nghia">${nghiaTiengViet}</div>
            </div>

            <div id="step-tu-ghep" class="khoi-tu-ghep an-giau">
                <div class="title-ghep">Từ Ghép Tạo Nghĩa:</div>
                <div class="content-ghep">${viDu}</div>
            </div>
        </div>
    `;

    // DỌN SẠCH BỘ ĐẾM CŨ ĐỂ KHÔNG BỊ TRÙNG LẶP
    clearTimeout(boDemThoiGian);

    // ====== BẮT ĐẦU KÍCH HOẠT TIMELINE ======
    
    // BƯỚC A: Đợi 1 giây (1000ms) -> Hiện khối âm đọc & Máy tự phát âm tiếng Nhật
    boDemThoiGian = setTimeout(() => {
        const phanAmDoc = document.getElementById('step-am-doc');
        if (phanAmDoc) phanAmDoc.className = "khoi-noi-dung hien-hien";

        DocTiengNhat(onyomi, () => {
            
            // BƯỚC B: Sau khi đọc xong Onyomi -> Nghỉ 0.5 giây -> Hiện nghĩa tiếng Việt & Đọc nghĩa tiếng Việt
            boDemThoiGian = setTimeout(() => {
                const phanNghia = document.getElementById('step-nghia-viet');
                if (phanNghia) phanNghia.className = "khoi-nghia-viet hien-hien";

                DocTiengViet(nghiaTiengViet, () => {
                    
                    // BƯỚC C: Sau khi đọc xong nghĩa -> Nghỉ 0.5 giây -> Hiện từ ghép & Kích hoạt nút chuyển chữ
                    boDemThoiGian = setTimeout(() => {
                        const phanTuGhep = document.getElementById('step-tu-ghep');
                        if (phanTuGhep) phanTuGhep.className = "khoi-tu-ghep hien-hien";
                        
                        // Hiện nút bấm chuyển trang để người học bấm qua bài mới
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
