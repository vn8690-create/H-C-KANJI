// =========================================================================
// KHU VỰC 1: CẤU HÌNH BIẾN TOÀN CỤC (QUẢN LÝ ĐIỂM SỐ VÀ DỮ LIỆU)
// =========================================================================
let diemXP = parseInt(localStorage.getItem('kanji_pure_xp')) || 0;
let duLieuHienTai = [];

// =========================================================================
// KHU VỰC 2: QUẢN LÝ CHUYỂN MÀN HÌNH (ẨN / HIỆN GIAO DIỆN)
// =========================================================================
function ChuyenManHinh(idManHinh) {
    // Tìm tất cả các màn hình có class là 'man-hinh' để ẩn đi
    document.querySelectorAll('.man-hinh').forEach(man => {
        man.classList.remove('active');
    });
    // Kích hoạt hiển thị màn hình được chọn
    const manChon = document.getElementById(idManHinh);
    if (manChon) manChon.classList.add('active');
}

// =========================================================================
// KHU VỰC 3: TẢI DỮ LIỆU TỪ FILE JSON (N5.JSON -> N1.JSON)
// =========================================================================
function TaiDuLieuKanji(tenFile) {
    // Chuyển ngay sang màn hình học để người dùng biết app đang xử lý
    ChuyenManHinh('man-hoc');
    
    const tieuDe = document.getElementById('tieu-de-bai-hoc');
    const vungChua = document.getElementById('vung-chua-the-kanji');
    
    tieuDe.innerText = `ĐANG TẢI DỮ LIỆU ${tenFile.toUpperCase()}...`;
    vungChua.innerHTML = "";

    // Thực hiện đọc file JSON từ thư mục gốc GitHub
    fetch(`./${tenFile}.json`)
        .then(res => {
            if (!res.ok) throw new Error("Không tìm thấy file JSON");
            return res.json();
        })
        .then(data => {
            duLieuHienTai = data;
            tieuDe.innerText = `CẤP ĐỘ ${tenFile.toUpperCase()} (${data.length} CHỮ)`;
            
            // CHÚ Ý: Đã sửa lỗi chính tả dính chữ ở đây để kích hoạt timeline tự động chạy
            InDanhSachKanjiTuDong();
        })
        .catch(err => {
            console.error(err);
            tieuDe.innerText = "LỖI HỆ THỐNG";
            vungChua.innerHTML = `<p class="bao-loi">❌ Không đọc được file "${tenFile}.json". Bro kiểm tra lại xem file đã nằm ở thư mục gốc chưa nhé!</p>`;
        });
}

// =========================================================================
// KHU VỰC 4: TIMELINE TỰ ĐỘNG HIỆN CHỮ VÀ PHÁT ÂM THEO DÒNG THỜI GIAN
// =========================================================================
function InDanhSachKanjiTuDong() {
    const vungChua = document.getElementById('vung-chua-the-kanji');
    vungChua.innerHTML = "";

    duLieuHienTai.forEach((item, index) => {
        // 1. Tạo khung thẻ HTML cho từng chữ Kanji
        const theKanji = document.createElement('div');
        theKanji.className = 'the-kanji-card';
        
        // Bốc chuẩn xác các biến dữ liệu từ file JSON của bro
        const chuKanji = item.kanji || "字";
        const nghia = item.meaning || "";
        const onyomi = item.onyomi || "";
        const kunyomi = item.kunyomi || "";
        const viDu = item.example || "";

        // 2. Thiết lập cấu trúc hiển thị (Mặc định ẩn các khối bằng class 'an-giau')
        theKanji.innerHTML = `
            <div class="card-top">
                <div class="chu-to">${chuKanji}</div>
                <div class="thong-tin-chu">
                    <div class="khoi-am-doc an-giau">
                        <div class="am-han">Âm Hán: ${nghia.split('(')[1]?.replace(')', '') || 'Chưa rõ'}</div>
                        <div class="cach-doc"><strong>Onyomi:</strong> ${onyomi}</div>
                        <div class="cach-doc"><strong>Kunyomi:</strong> ${kunyomi}</div>
                    </div>
                    <div class="khoi-nghia an-giau">
                        <div class="nghia-tieng-viet">${nghia.split('(')[0]}</div>
                    </div>
                </div>
            </div>
            <div class="card-bottom an-giau">
                <strong>Từ ghép ví dụ:</strong> ${viDu}
            </div>
        `;

        vungChua.appendChild(theKanji);

        // 3. ĐIỀU PHỐI DÒNG THỜI GIAN (TIMELINE ANIMATION)
        const phanAmDoc = theKanji.querySelector('.khoi-am-doc');
        const phanNghia = theKanji.querySelector('.khoi-nghia');
        const phanTuGhep = theKanji.querySelector('.card-bottom');

        // BƯỚC A: Đợi đúng 1 giây (1000ms), hiện phần âm đọc và máy tự động phát âm Onyomi
        setTimeout(() => {
            phanAmDoc.classList.remove('an-giau');
            phanAmDoc.classList.add('hien-hien');
            
            // Phát âm tiếng Nhật mẫu, khi máy đọc xong hoàn toàn mới nhảy sang Bước B
            PhatAmTiengNhat(onyomi, () => {
                
                // BƯỚC B: Nghỉ 0.5 giây sau khi đọc xong Onyomi, hiện nghĩa tiếng Việt và tự động đọc nghĩa tiếng Việt
                setTimeout(() => {
                    phanNghia.classList.remove('an-giau');
                    phanNghia.classList.add('hien-hien');
                    
                    let nghiaThuan = nghia.split('(')[0].trim();
                    PhatAmTiengViet(nghiaThuan, () => {
                        
                        // BƯỚC C: Nghỉ 0.5 giây sau khi đọc xong tiếng Việt, hiện khối từ ghép chữ Hán lên
                        setTimeout(() => {
                            phanTuGhep.classList.remove('an-giau');
                            phanTuGhep.classList.add('hien-hien');
                            CongDiemXP(); // Hoàn thành 1 chu kỳ thì tặng điểm thưởng
                        }, 500);
                        
                    });
                }, 500);

            });
        }, 1000);

    });
}

// =========================================================================
// KHU VỰC 5: BỘ LOA PHÁT ÂM ĐA NGÔN NGỮ (WEB SPEECH API)
// =========================================================================

// Phát âm giọng Nhật Bản (lo cho phần Onyomi / Kunyomi / Kanji)
function PhatAmTiengNhat(chuoiDoc, hanhDongKhiDocXong) {
    if (!chuoiDoc || chuoiDoc === "None") {
        if(hanhDongKhiDocXong) hanhDongKhiDocXong();
        return;
    }
    if ('speechSynthesis' in window) {
        let chuoiChuan = chuoiDoc.replace(/[\/()（）\-,ー]/g, ' ').trim();
        let utterance = new SpeechSynthesisUtterance(chuoiChuan);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.85; // Tốc độ đọc hơi chậm một chút để nghe rõ âm
        
        // Kích hoạt hành động tiếp theo ngay khi loa ngừng phát âm
        utterance.onend = function() {
            if(hanhDongKhiDocXong) hanhDongKhiDocXong();
        };
        window.speechSynthesis.speak(utterance);
    } else {
        if(hanhDongKhiDocXong) hanhDongKhiDocXong();
    }
}

// Phát âm giọng Việt Nam (lo cho phần giải nghĩa Tiếng Việt)
function PhatAmTiengViet(chuoiDoc, hanhDongKhiDocXong) {
    if ('speechSynthesis' in window) {
        let utterance = new SpeechSynthesisUtterance(chuoiDoc);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.92; // Tốc độ đọc tiếng Việt tự nhiên
        
        // Kích hoạt hành động tiếp theo ngay khi loa ngừng phát âm
        utterance.onend = function() {
            if(hanhDongKhiDocXong) hanhDongKhiDocXong();
        };
        window.speechSynthesis.speak(utterance);
    } else {
        if(hanhDongKhiDocXong) hanhDongKhiDocXong();
    }
}

// =========================================================================
// KHU VỰC 6: HỆ THỐNG ĐIỂM THƯỞNG XP (LƯU TRỮ VÀO TRÌNH DUYỆT)
// =========================================================================
function CongDiemXP() {
    diemXP += 1;
    localStorage.setItem('kanji_pure_xp', diemXP);
    document.getElementById('id-xp').innerText = diemXP;
}

// Tự động đồng bộ và hiển thị điểm XP ngay khi người dùng vừa truy cập vào app
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('id-xp').innerText = diemXP;
});
