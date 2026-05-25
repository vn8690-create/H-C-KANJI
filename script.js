// ==========================================
// KHU VỰC 1: CẤU HÌNH VÀ BIẾN TOÀN CỤC
// ==========================================
let diemXP = parseInt(localStorage.getItem('kanji_pure_xp')) || 0;
let duLieuHienTai = [];

// ==========================================
// KHU VỰC 2: QUẢN LÝ CHUYỂN MÀN HÌNH
// ==========================================
function ChuyenManHinh(idManHinh) {
    document.querySelectorAll('.man-hinh').forEach(man => {
        man.classList.remove('active');
    });
    const manChon = document.getElementById(idManHinh);
    if (manChon) manChon.classList.add('active');
}

// ==========================================
// KHU VỰC 3: TẢI DỮ LIỆU TỪ FILE JSON
// ==========================================
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
            InDanhSachKanji TựDong();
        })
        .catch(err => {
            console.error(err);
            tieuDe.innerText = "LỖI HỆ THỐNG";
            vungChua.innerHTML = `<p class="bao-loi">❌ Không đọc được file "${tenFile}.json".</p>`;
        });
}

// ==========================================
// KHU VỰC 4: XỬ LÝ HIỆN CHỮ TỰ ĐỘNG THEO TIMELINE
// ==========================================
function InDanhSachKanjiTuDong() {
    const vungChua = document.getElementById('vung-chua-the-kanji');
    vungChua.innerHTML = "";

    duLieuHienTai.forEach((item, index) => {
        // 1. Tạo khung thẻ chứa chữ Kanji
        const theKanji = document.createElement('div');
        theKanji.className = 'the-kanji-card';
        
        // Lấy dữ liệu từ file JSON của bro
        const chuKanji = item.kanji || "字";
        const nghia = item.meaning || "";
        const onyomi = item.onyomi || "";
        const kunyomi = item.kunyomi || "";
        const viDu = item.example || ""; // Đây chính là các chữ Hán ghép tạo từ vựng

        // 2. Thiết lập cấu trúc HTML bên trong (Ban đầu ẩn các phần dưới đi bằng class "an-giau")
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

        // 3. QUY TRÌNH TỰ ĐỘNG CHẠY (TIMELINE) CHO TỪNG THẺ
        // Tìm các phần tử bên trong thẻ vừa tạo
        const phanAmDoc = theKanji.querySelector('.khoi-am-doc');
        const phanNghia = theKanji.querySelector('.khoi-nghia');
        const phanTuGhep = theKanji.querySelector('.card-bottom');

        // BƯỚC A: Sau 1 giây (1000ms), hiện âm đọc và máy tự động đọc Onyomi
        setTimeout(() => {
            phanAmDoc.classList.remove('an-giau'); // Hiện phần âm đọc lên màn hình
            phanAmDoc.classList.add('hien-hien');
            
            // Gọi máy phát âm Onyomi, khi đọc xong thì kích hoạt bước tiếp theo
            PhatAmTiengNhat(onyomi, () => {
                
                // BƯỚC B: Sau khi đọc xong tiếng Nhật, hiện nghĩa tiếng Việt và đọc nghĩa tiếng Việt luôn
                setTimeout(() => {
                    phanNghia.classList.remove('an-giau'); // Hiện nghĩa tiếng Việt
                    phanNghia.classList.add('hien-hien');
                    
                    let nghiaThuan = nghia.split('(')[0].trim();
                    PhatAmTiengViet(nghiaThuan, () => {
                        
                        // BƯỚC C: Sau khi đọc xong nghĩa tiếng Việt, hiện chữ Hán ghép (Ví dụ)
                        setTimeout(() => {
                            phanTuGhep.classList.remove('an-giau'); // Hiện chữ ghép
                            phanTuGhep.classList.add('hien-hien');
                            CongDiemXP();
                        }, 500); // 0.5 giây sau hiện từ ghép
                        
                    });
                }, 500); // 0.5 giây nghỉ giữa các bước

            });
        }, 1000); // Khoảng thời gian 1 giây đầu tiên đợi để hiện âm đọc

    });
}

// ==========================================
// KHU VỰC 5: BỘ LOA PHÁT ÂM TIẾNG NHẬT VÀ TIẾNG VIỆT
// ==========================================

// Phát âm tiếng Nhật (Onyomi)
function PhatAmTiengNhat(chuoiDoc, hanhDongKhiDocXong) {
    if (!chuoiDoc || chuoiDoc === "None") {
        if(hanhDongKhiDocXong) hanhDongKhiDocXong();
        return;
    }
    if ('speechSynthesis' in window) {
        let chuoiChuan = chuoiDoc.replace(/[\/()（）\-,ー]/g, ' ').trim();
        let utterance = new SpeechSynthesisUtterance(chuoiChuan);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.85;
        
        // Khi máy đọc xong hoàn toàn thì chạy hàm tiếp theo trong Timeline
        utterance.onend = function() {
            if(hanhDongKhiDocXong) hanhDongKhiDocXong();
        };
        window.speechSynthesis.speak(utterance);
    } else {
        if(hanhDongKhiDocXong) hanhDongKhiDocXong();
    }
}

// Phát âm nghĩa bằng tiếng Việt
function PhatAmTiengViet(chuoiDoc, hanhDongKhiDocXong) {
    if ('speechSynthesis' in window) {
        let utterance = new SpeechSynthesisUtterance(chuoiDoc);
        utterance.lang = 'vi-VN'; // Chuyển sang giọng tiếng Việt
        utterance.rate = 0.9;
        
        utterance.onend = function() {
            if(hanhDongKhiDocXong) hanhDongKhiDocXong();
        };
        window.speechSynthesis.speak(utterance);
    } else {
        if(hanhDongKhiDocXong) hanhDongKhiDocXong();
    }
}

// Hàm cộng điểm tăng tương tác
function CongDiemXP() {
    diemXP += 1;
    localStorage.setItem('kanji_pure_xp', diemXP);
    document.getElementById('id-xp').innerText = diemXP;
}

// Khởi chạy khi tải trang
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('id-xp').innerText = diemXP;
});
