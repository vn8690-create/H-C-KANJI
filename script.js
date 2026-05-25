// =========================================================================
// KHU VỰC 1: BIẾN TOÀN CỤC VÀ LƯU TRỮ TRẠNG THÁI
// =========================================================================
let diemXP = parseInt(localStorage.getItem('kanji_pure_xp')) || 0;
let duLieuHienTai = [];   // Chứa toàn bộ mảng JSON tải về
let indexHienTai = 0;     // Vị trí chữ đang học
let thoiGianCho = null;   // Quản lý các lệnh setTimeout để không bị chồng âm thanh

// =========================================================================
// KHU VỰC 2: ĐIỀU HƯỚNG MÀN HÌNH
// =========================================================================
function ChuyenManHinh(idManHinh) {
    document.querySelectorAll('.man-hinh').forEach(man => man.classList.remove('active'));
    const manChon = document.getElementById(idManHinh);
    if (manChon) manChon.classList.add('active');
}

function DừngHocVaQuayVe() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    clearTimeout(thoiGianCho);
    ChuyenManHinh('man-home');
}

// =========================================================================
// KHU VỰC 3: TẢI DỮ LIỆU TỪ FILE JSON (N5 -> N1)
// =========================================================================
function TaiDuLieuKanji(tenFile) {
    ChuyenManHinh('man-hoc');
    document.getElementById('tieu-de-bai-hoc').innerText = `ĐANG TẢI...`;
    document.getElementById('khu-vuc-the-single').innerHTML = `<div class="loading-chu">Đang kết nối kho dữ liệu...</div>`;
    document.getElementById('thanh-dieu-khien').classList.add('an-giau');

    fetch(`./${tenFile}.json`)
        .then(res => {
            if (!res.ok) throw new Error("Lỗi tải file JSON");
            return res.json();
        })
        .then(data => {
            duLieuHienTai = data;
            indexHienTai = 0; // Reset về chữ đầu tiên
            HienThiFlashcardChuHienTai();
        })
        .catch(err => {
            document.getElementById('tieu-de-bai-hoc').innerText = "LỖI";
            document.getElementById('khu-vuc-the-single').innerHTML = `<p style="color:#ff0055; text-align:center;">❌ File "${tenFile}.json" gặp sự cố cấu trúc.</p>`;
        });
}

// =========================================================================
// KHU VỰC 4: QUẢN LÝ TIẾN TRÌNH TỰ ĐỘNG CHẠY (TIMELINE) CỦA 1 CHỮ
// =========================================================================
function HienThiFlashcardChuHienTai() {
    if (duLieuHienTai.length === 0 || indexHienTai >= duLieuHienTai.length) {
        document.getElementById('khu-vuc-the-single').innerHTML = `<div class="loading-chu">🎉 Chúc mừng bro đã hoàn thành cấp độ này!</div>`;
        document.getElementById('thanh-dieu-khien').classList.add('an-giau');
        return;
    }

    // Cập nhật thanh tiêu đề tiến độ (Ví dụ: N5 [1 / 120])
    document.getElementById('tieu-de-bai-hoc').innerText = `TIẾN ĐỘ: ${indexHienTai + 1} / ${duLieuHienTai.length}`;
    
    // Ẩn nút chuyển trang đi để học xong mới cho bấm
    document.getElementById('thanh-dieu-khien').classList.add('an-giau');

    const item = duLieuHienTai[indexHienTai];
    const vungChua = document.getElementById('khu-vuc-the-single');

    // Trích xuất an toàn biến dữ liệu của bro
    const chuKanji = item.kanji || "字";
    const nghiaRaw = item.meaning || "";
    const onyomi = item.onyomi || "";
    const kunyomi = item.kunyomi || "";
    const viDu = item.example || "";

    // Tách âm Hán nằm trong ngoặc đơn (nếu có)
    let amHan = "Chưa rõ";
    if (nghiaRaw.includes('(') && nghiaRaw.includes(')')) {
        amHan = nghiaRaw.substring(nghiaRaw.indexOf('(') + 1, nghiaRaw.indexOf(')'));
    }
    let nghiaTiengViet = nghiaRaw.split('(')[0].trim();

    // Khởi tạo khung giao diện (Tất cả thông tin dưới chữ Kanji đều ẩn bằng class 'an-giau')
    vungChua.innerHTML = `
        <div class="the-kanji-card-single">
            <div class="chu-kanji-khong-lo">${chuKanji}</div>
            
            <div id="step-am-doc" class="khoi-thong-tin an-giau">
                <div class="label-am-han">ÂM HÁN: ${amHan.toUpperCase()}</div>
                <div class="text-read"><strong>Onyomi:</strong> ${onyomi}</div>
                <div class="text-read"><strong>Kunyomi:</strong> ${kunyomi}</div>
            </div>

            <div id="step-nghia" class="khoi-nghia-viet an-giau">
                <div class="text-nghia">${nghiaTiengViet}</div>
            </div>

            <div id="step-tu-ghep" class="khoi-tu-ghep an-giau">
                <div class="title-ghep">Từ Ghép Ví Dụ:</div>
                <div class="content-ghep">${viDu}</div>
            </div>
        </div>
    `;

    // BẮT ĐẦU KÍCH HOẠT CHUỖI TIMELINE TỰ ĐỘNG
    clearTimeout(thoiGianCho);

    // BƯỚC 1: Đợi 1 giây -> Hiện âm đọc + Đọc Onyomi tiếng Nhật
    thoiGianCho = setTimeout(() => {
        const phanAmDoc = document.getElementById('step-am-doc');
        if(phanAmDoc) phanAmDoc.className = "khoi-thong-tin hien-hien";

        PhatAmGiongNhat(onyomi, () => {
            
            // BƯỚC 2: Đọc xong tiếng Nhật -> Đợi 0.5 giây -> Hiện nghĩa + Đọc nghĩa tiếng Việt
            thoiGianCho = setTimeout(() => {
                const phanNghia = document.getElementById('step-nghia');
                if(phanNghia) phanNghia.className = "khoi-nghia-viet hien-hien";

                PhatAmGiongViet(nghiaTiengViet, () => {
                    
                    // BƯỚC 3: Đọc xong nghĩa -> Đợi 0.5 giây -> Hiện từ ghép + Hiện nút chuyển chữ
                    thoiGianCho = setTimeout(() => {
                        const phanTuGhep = document.getElementById('step-tu-ghep');
                        if(phanTuGhep) phanTuGhep.className = "khoi-tu-ghep hien-hien";
                        
                        // Hiện nút chuyển sang từ tiếp theo
                        document.getElementById('thanh-dieu-khien').classList.remove('an-giau');
                        CongDiemXP();
                    }, 500);

                });
            }, 500);

        });
    }, 1000);
}

function ChuyenChuTiepTheo() {
    indexHienTai++;
    HienThiFlashcardChuHienTai();
}

// =========================================================================
// KHU VỰC 5: HỆ THỐNG PHÁT ÂM CHUẨN (WEB SPEECH API)
// =========================================================================
function PhatAmGiongNhat(vanBan, callback) {
    if (!vanBan || vanBan === "None") { if(callback) callback(); return; }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let thongSo = new SpeechSynthesisUtterance(vanBan.replace(/[\/()（）\-,ー]/g, ' '));
        thongSo.lang = 'ja-JP';
        thongSo.rate = 0.82;
        thongSo.onend = () => { if(callback) callback(); };
        thongSo.onerror = () => { if(callback) callback(); };
        window.speechSynthesis.speak(thongSo);
    } else {
        if(callback) callback();
    }
}

function PhatAmGiongViet(vanBan, callback) {
    if (!vanBan) { if(callback) callback(); return; }
    if ('speechSynthesis' in window) {
        let thongSo = new SpeechSynthesisUtterance(vanBan);
        thongSo.lang = 'vi-VN';
        thongSo.rate = 0.9;
        thongSo.onend = () => { if(callback) callback(); };
        thongSo.onerror = () => { if(callback) callback(); };
        window.speechSynthesis.speak(thongSo);
    } else {
        if(callback) callback();
    }
}

// =========================================================================
// KHU VỰC 6: ĐỒNG BỘ ĐIỂM SỐ
// =========================================================================
function CongDiemXP() {
    diemXP += 1;
    localStorage.setItem('kanji_pure_xp', diemXP);
    document.getElementById('id-xp').innerText = diemXP;
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('id-xp').innerText = diemXP;
});
