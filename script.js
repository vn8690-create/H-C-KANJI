// =========================================================================
// BIẾN TOÀN CỤC & TRẠNG THÁI APP
// =========================================================================
let diemXP = parseInt(localStorage.getItem('kanji_pure_xp')) || 0;
let duLieuHienTai = []; 
let indexHienTai = 0;   
let loaiHocHienTai = ''; 
let boDemThoiGian = null; 
let boDemTuDongChuyen = null; // Quản lý luồng tự động chuyển trang thông minh

// Trạng thái cấu hình học tập (Lưu trạng thái On/Off của user)
let hienThiYomi = true;
let tuDongChuyenBai = false;

// Biến bổ sung phục vụ cho Đấu Trường Test
let capDoTestChon = '';    
let theLoaiTestChon = ''; 
let mangCauHoiTest = [];   
let indexTestHienTai = 0;
let daBamDapAn = false;
let tenFileHienTai = ''; 

// =========================================================================
// ĐIỀU HƯỚNG MENU TAB
// =========================================================================
function ChuyenTab(idManHinh) {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    clearTimeout(boDemThoiGian);
    clearTimeout(boDemTuDongChuyen);

    document.querySelectorAll('.man-hinh').forEach(man => man.classList.remove('active'));
    
    const manChon = document.getElementById(idManHinh);
    if (manChon) manChon.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (idManHinh === 'man-home') document.getElementById('btn-nav-home')?.classList.add('active');
    if (idManHinh === 'man-kanji') document.getElementById('btn-nav-kanji')?.classList.add('active');
    if (idManHinh === 'man-test-levels') document.getElementById('btn-nav-test')?.classList.add('active');
    if (idManHinh === 'man-grammar') document.getElementById('btn-nav-grammar')?.classList.add('active');
}

function ThoatHocChiTiet() {
    clearTimeout(boDemTuDongChuyen);
    clearTimeout(boDemThoiGian);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    if (loaiHocHienTai === 'grammar') {
        ChuyenTab('man-home');
    } else {
        ChuyenTab('man-kanji');
    }
}

function ChonCapDoTest(capDo) {
    capDoTestChon = capDo;
    const tieuDeLevel = document.getElementById('tieu-de-level-test');
    if (tieuDeLevel) tieuDeLevel.innerText = `ĐANG CHỌN: TEST ${capDo.toUpperCase()}`;
    ChuyenTab('man-test-the-loai');
}

// Cập nhật cấu hình khi người dùng click checkbox (Sửa lỗi hiển thị đồng bộ)
function CapNhatCaiDatHoc() {
    const chkYomi = document.getElementById('chk-hien-yomi');
    const chkAuto = document.getElementById('chk-auto-next');
    
    if (chkYomi) hienThiYomi = chkYomi.checked;
    if (chkAuto) tuDongChuyenBai = chkAuto.checked;
    
    // Xử lý ẩn/hiện lập tức khối Yomi nếu đang ở trong màn hình học
    const step3 = document.getElementById('step-yomi');
    const step4 = document.getElementById('step-tu-ghep');
    
    if (step3 && step4) {
        if (hienThiYomi) {
            step3.style.setProperty('display', 'block', 'important');
            step4.style.setProperty('display', 'block', 'important');
        } else {
            step3.style.setProperty('display', 'none', 'important');
            step4.style.setProperty('display', 'none', 'important');
        }
    }

    // Nếu người dùng tắt tự động chuyển bài giữa chừng thì hủy bộ đếm ngay
    if (!tuDongChuyenBai) {
        clearTimeout(boDemTuDongChuyen);
    } else {
        // Nếu bật lên mà nút chuyển trang đã lộ diện rồi thì kích hoạt hẹn giờ đi luôn
        const nutChuyen = document.getElementById('vung-nut-chuyen-trang');
        if (nutChuyen && !nutChuyen.classList.contains('an-giau')) {
            const itemHienTai = duLieuHienTai[indexHienTai];
            if (itemHienTai) {
                let textViet = itemHienTai.meaning || "";
                let textBoSung = (loaiHocHienTai === 'kanji') ? (itemHienTai.example || "") : (itemHienTai.explanation || "");
                KichHoatTuDongChuyenThongMinh(textViet, textBoSung);
            }
        }
    }
}

// =========================================================================
// TẢI DỮ LIỆU ĐỘNG CHO FLASHCARD HỌC (ĐÃ TÍCH HỢP LƯU TIẾN ĐỘ)
// =========================================================================
function TaiDuLieuHoc(loaiHoc, tenFile) {
    loaiHocHienTai = loaiHoc;
    tenFileHienTai = tenFile; 
    
    if (tenFile === 'n5_grammar') {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.getElementById('btn-nav-grammar')?.classList.add('active');
    }

    ChuyenTab('man-hoc-chi-tiet');
    
    // Đồng bộ trạng thái từ biến lên nút checkbox bên HTML
    const chkYomi = document.getElementById('chk-hien-yomi');
    const chkAuto = document.getElementById('chk-auto-next');
    if (chkYomi) chkYomi.checked = hienThiYomi;
    if (chkAuto) chkAuto.checked = tuDongChuyenBai;
    
    const tieuDe = document.getElementById('tieu-de-bai-hoc');
    const vungChua = document.getElementById('vung-chua-the-dong');
    const nutChuyen = document.getElementById('vung-nut-chuyen-trang');
    
    if (tieuDe) tieuDe.innerText = `ĐANG KẾT NỐI...`;
    if (vungChua) vungChua.innerHTML = `<div class="loading-text">⚡ Đang đồng bộ bộ não dữ liệu...</div>`;
    if (nutChuyen) nutChuyen.classList.add('an-giau');

    fetch(`./${tenFile}.json`)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => {
            duLieuHienTai = data; 

            // Kiểm tra xem danh mục file này trước đó đã có bộ nhớ lưu trữ chưa
            let tienDoCu = parseInt(localStorage.getItem(`tien_do_${tenFile}`)) || 0;

            if (tienDoCu > 0 && tienDoCu < duLieuHienTai.length && vungChua && tieuDe) {
                vungChua.innerHTML = `
                    <div class="the-cyber-card" style="text-align: center; padding: 40px 20px;">
                        <h3 style="color: #00ffcc; margin-bottom: 20px; font-size: 1.4rem;">🎯 PHÁT HIỆN TIẾN ĐỘ CŨ</h3>
                        <p style="color: #cbd5e1; margin-bottom: 30px; font-size: 0.95rem; line-height: 1.6;">
                            Bro đang học dở ở từ thứ <strong>${tienDoCu + 1}</strong> của mục này.<br>
                            Bro muốn tiếp tục hành trình hay muốn cày lại từ đầu?
                        </p>
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <button class="nut-tiep-theo" style="background: linear-gradient(135deg, #00f5a0 0%, #00d9f6 100%); color: #000; font-weight: bold; width: 100%;" onclick="KichHoatTienDo(${tienDoCu})">
                                HỌC TIẾP TỪ THỨ ${tienDoCu + 1} ➡️
                            </button>
                            <button class="nut-quay-lai" style="border: 1px solid #ef4444; color: #ef4444; width: 100%; margin: 0; background: rgba(239, 68, 68, 0.05);" onclick="KichHoatTienDo(0)">
                                🔄 HỌC LẠI TỪ ĐẦU
                            </button>
                        </div>
                    </div>
                `;
                tieuDe.innerText = "LỰA CHỌN TIẾN ĐỘ";
            } else {
                indexHienTai = 0; 
                ChayDongThoiGianFlashcard();
            }
        })
        .catch(() => {
            if (tieuDe) tieuDe.innerText = "LỖI DATA";
            if (vungChua) vungChua.innerHTML = `<p class="bao-loi">❌ Không tải được file "${tenFile}.json". Bro check lại file trên GitHub nhé!</p>`;
        });
}

function KichHoatTienDo(indexChon) {
    indexHienTai = indexChon;
    ChayDongThoiGianFlashcard();
}

// =========================================================================
// HÀM CHẠY DÒNG THỜI GIAN FLASHCARD & HIỂN THỊ NỘI DUNG (SIÊU TỐC - HIỆN CHỮ NGAY)
// =========================================================================
function ChayDongThoiGianFlashcard() {
    const vungChua = document.getElementById('vung-chua-the-dong');
    const tieuDe = document.getElementById('tieu-de-bai-hoc');
    const nutChuyen = document.getElementById('vung-nut-chuyen-trang');

    if (duLieuHienTai.length === 0 || indexHienTai >= duLieuHienTai.length) {
        if (tieuDe) tieuDe.innerText = "HOÀN THÀNH!";
        if (vungChua) {
            vungChua.innerHTML = `
                <div class="loading-text" style="color: #00ffcc; text-align:center;">
                    🎉 Chúc mừng đặc vụ đã hoàn thành trọn vẹn danh mục này!
                    <br><br>
                    <button class="nut-quay-lai" style="border: 1px solid #00ffcc; color: #00ffcc; margin-top:20px; background: rgba(0, 255, 204, 0.05);" onclick="ResetToanBoTienDoFile()">
                        🔄 RESET HỌC LẠI TỪ ĐẦU
                    </button>
                </div>
            `;
        }
        if (nutChuyen) nutChuyen.classList.add('an-giau');
        localStorage.setItem(`tien_do_${tenFileHienTai}`, 0);
        return;
    }

    localStorage.setItem(`tien_do_${tenFileHienTai}`, indexHienTai);

    if (tieuDe) tieuDe.innerText = `TIẾN ĐỘ: ${indexHienTai + 1} / ${duLieuHienTai.length}`;
    if (nutChuyen) nutChuyen.classList.add('an-giau');
    
    // Dọn sạch tất cả các bộ đếm thời gian cũ để tránh xung đột luồng chạy
    clearTimeout(boDemThoiGian);
    clearTimeout(boDemTuDongChuyen);

    const item = duLieuHienTai[indexHienTai];

    if (loaiHocHienTai === 'kanji') {
        const chuKanji = item.kanji || "字";
        const nghiaGoc = item.meaning || "";
        const onyomi = item.onyomi || "";
        const kunyomi = item.kunyomi || "";
        const viDu = item.example || "";

        let amHanViet = "Chưa rõ";
        let nghiaTiengViet = "Chưa rõ";

        if (nghiaGoc.includes('(') && nghiaGoc.includes(')')) {
            amHanViet = nghiaGoc.split('(')[0].trim();
            nghiaTiengViet = nghiaGoc.substring(nghiaGoc.indexOf('(') + 1, nghiaGoc.indexOf(')'));
        } else {
            amHanViet = nghiaGoc;
            nghiaTiengViet = nghiaGoc;
        }

        let styleAnYomi = hienThiYomi ? "" : "display: none !important;";

        // Render HTML: Toàn bộ class đổi thành "hien-hien" đập chữ ra màn hình luôn
        if (vungChua) {
            vungChua.innerHTML = `
                <div class="the-cyber-card">
                    <div class="chu-kanji-khong-lo">${chuKanji}</div>
                    <div id="step-am-doc" class="khoi-noi-dung hien-hien">
                        <div class="label-am-han">ÂM HÁN: ${amHanViet.toUpperCase()}</div>
                    </div>
                    <div id="step-nghia-viet" class="khoi-nghia-viet hien-hien">
                        <div class="text-nghia">${nghiaTiengViet}</div>
                    </div>
                    <div id="step-yomi" class="khoi-yomi-duoi hien-hien" style="${styleAnYomi}">
                        <div class="dong-cach-doc"><strong>Onyomi:</strong> ${onyomi}</div>
                        <div class="dong-cach-doc"><strong>Kunyomi:</strong> ${kunyomi}</div>
                    </div>
                    <div id="step-tu-ghep" class="khoi-tu-ghep hien-hien" style="${styleAnYomi}">
                        <div class="title-ghep">Từ Ghép Tạo Nghĩa:</div>
                        <div class="content-ghep">${viDu}</div>
                    </div>
                </div>
            `;
        }
        
        KichHoatTimeline(onyomi || chuKanji, nghiaTiengViet);
    } else {
        const cauTruc = item.grammar || "";
        const nghiaNguPhap = item.meaning || "";
        const giaiThich = item.explanation || "";
        const mangViDu = item.examples || [];

        let htmlViDu = "";
        mangViDu.forEach(vd => {
            htmlViDu += `
                <div class="vd-item" style="margin-bottom: 12px; text-align:left;">
                    <div class="vd-ja" style="font-size:1.2rem; color:#fff; line-height:2.2;">${vd.ja}</div>
                    <div class="vd-vi" style="font-size:0.9rem; color:#00ffcc;">💡 ${vd.vi}</div>
                </div>
            `;
        });

        // Bung hết nội dung cấu trúc cách dùng ngữ pháp ra ngay lập tức
        if (vungChua) {
            vungChua.innerHTML = `
                <div class="the-cyber-card">
                    <div class="chu-kanji-khong-lo" style="font-size: 2.5rem; color: #38bdf8;">${cauTruc}</div>
                    <div id="step-am-doc" class="khoi-noi-dung hien-hien">
                        <div class="label-am-han" style="color: #ff00ff;">Ý NGHĨA: ${nghiaNguPhap.toUpperCase()}</div>
                    </div>
                    <div id="step-nghia-viet" class="khoi-nghia-viet hien-hien" style="text-align:left;">
                        <div class="text-nghia" style="font-size:0.95rem; color:#cbd5e1; font-weight:normal;">
                            <strong>Cách dùng:</strong> ${giaiThich}
                        </div>
                    </div>
                    <div id="step-tu-ghep" class="khoi-tu-ghep hien-hien" style="display:block !important;">
                        <div class="title-ghep">Các Câu Ví Dụ:</div>
                        <div>${htmlViDu}</div>
                    </div>
                </div>
            `;
        }
        KichHoatTimeline(cauTruc, nghiaNguPhap);
    }
}

// =========================================================================
// CẬP NHẬT LUỒNG CHẠY TIMELINE & PHÁT ÂM TỰ NHIÊN
// =========================================================================
function KichHoatTimeline(textNhat, textViet) {
    const nutChuyen = document.getElementById('vung-nut-chuyen-trang');
    
    // Mở khóa cho nút chuyển bài thủ công xuất hiện luôn
    if (nutChuyen) nutChuyen.classList.remove('an-giau');
    CongDiemXP(1);

    // Kích hoạt giọng đọc bất đồng bộ (Đọc tiếng Nhật trước, nghỉ một nhịp rồi đọc tiếng Việt)
    DocGiongMay(textNhat, 'ja-JP', 0.85, () => {
        // Sau khi đọc xong tiếng Nhật, nghỉ 300ms rồi mới chuyển sang đọc tiếng Việt cho đỡ bị dính chữ
        setTimeout(() => {
            DocGiongMay(textViet, 'vi-VN', 0.95);
        }, 300);
    });

    // KÍCH HOẠT TỰ ĐỘNG CHUYỂN BÀI THÔNG MINH (Tính thời gian giữ chữ để đọc)
    if (tuDongChuyenBai) {
        const itemHienTai = duLieuHienTai[indexHienTai];
        let textBoSung = "";
        
        if (loaiHocHienTai === 'kanji') {
            textBoSung = itemHienTai.example || "";
        } else {
            const mangVd = itemHienTai.examples || [];
            textBoSung = itemHienTai.explanation || "";
            mangVd.forEach(vd => { textBoSung += (vd.ja + vd.vi); });
        }

        KichHoatTuDongChuyenThongMinh(textViet, textBoSung);
    }
}

function DocGiongMay(vanBan, ngonNgu, tocDo, khiXong) {
    if (!vanBan || vanBan === "None") { if (khiXong) khiXong(); return; }
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        // 1. Làm sạch chuỗi, loại bỏ các thẻ HTML nếu có
        let vanBanSach = vanBan.replace(/<rt>.*?<\/rt>/g, '').replace(/<\/?[^>]+(>|$)/g, "");
        
        // 2. Ép các ký tự đặc biệt / ngoặc thành khoảng trống
        vanBanSach = vanBanSach.replace(/[\/()（）\-ー]/g, ' ');
        
        // 3. 🔥 TẠO TRỄ TỰ NHIÊN: Biến dấu phẩy, dấu chấm thành chuỗi khoảng lặng ngắt nhịp (Delay ~0.2s)
        // Kỹ thuật này giúp bộ TTS trên iOS/Android nhận diện điểm ngắt câu cực tốt
        vanBanSach = vanBanSach.replace(/[,，、]/g, ',   '); 
        vanBanSach = vanBanSach.replace(/[.。]/g, '.   ');

        let utterance = new SpeechSynthesisUtterance(vanBanSach);
        utterance.lang = ngonNgu;
        utterance.rate = tocDo;
        
        utterance.onend = () => { if (khiXong) khiXong(); };
        utterance.onerror = () => { if (khiXong) khiXong(); };
        
        window.speechSynthesis.speak(utterance);
    } else { 
        if (khiXong) khiXong(); 
    }
}

// 🔥 HÀM TÍNH TOÁN THỜI GIAN GIỮ MÀN HÌNH ĐỂ USER ĐỌC CHỮ (CHUẨN TỐC ĐỘ, BAO CHẠY SAFARI IPHONE)
function KichHoatTuDongChuyenThongMinh(vanBan1, vanBan2) {
    clearTimeout(boDemTuDongChuyen);

    const chuoi1 = vanBan1 || "";
    const chuoi2 = vanBan2 || "";
    const tongKyTu = chuoi1.length + chuoi2.length;

    // Thời gian gốc giữ màn hình tối thiểu là 3000ms (3 giây). Mỗi ký tự cộng thêm 70ms để người học thong thả đọc.
    const thoiGianGoc = 3000;
    const thoiGianMoiKyTu = 70;
    const thoiGianChoTinhToan = thoiGianGoc + (tongKyTu * thoiGianMoiKyTu);

    // Ít nhất giữ màn hình 3.5 giây (chữ ngắn), tối đa 9.5 giây (câu dài ngoằng) rồi tự chuyển bài.
    const thoiGianChot = Math.max(3500, Math.min(thoiGianChoTinhToan, 9500));

    boDemTuDongChuyen = setTimeout(() => {
        ChuyenBaiTiepTheo();
    }, thoiGianChot);
}

function ChuyenBaiTiepTheo() { 
    clearTimeout(boDemTuDongChuyen);
    clearTimeout(boDemThoiGian);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    indexHienTai++; 
    ChayDongThoiGianFlashcard(); 
}

function ResetToanBoTienDoFile() {
    if (confirm("Bro có chắc chắn muốn xóa tiến độ của mục này để học lại từ đầu không?")) {
        localStorage.setItem(`tien_do_${tenFileHienTai}`, 0);
        indexHienTai = 0;
        ChayDongThoiGianFlashcard();
    }
}

// =========================================================================
// KHU VỰC ĐẤU TRƯỜNG TEST TRẮC NGHIỆM 4 ĐÁP ÁN
// =========================================================================
function KichHoatLamDe(theLoai) {
    theLoaiTestChon = theLoai;
    ChuyenTab('man-lam-bai-test');
    
    let fileNguon = (theLoai === 'ngu-phap') ? 'n5_grammar' : capDoTestChon;
    
    fetch(`./${fileNguon}.json`)
        .then(res => res.json())
        .then(khoGoc => {
            TaoDeTracNghiem(khoGoc);
        })
        .catch(() => {
            const cauHoiTxt = document.getElementById('test-cau-hoi-text');
            if (cauHoiTxt) cauHoiTxt.innerText = `❌ Lỗi kết nối đề thi level ${capDoTestChon.toUpperCase()} rồi đại ca ơi!`;
        });
}

function TaoDeTracNghiem(khoGoc) {
    const cauHoiTxt = document.getElementById('test-cau-hoi-text');
    if (!khoGoc || khoGoc.length < 4) {
        if (cauHoiTxt) cauHoiTxt.innerText = "❌ Kho dữ liệu quá ít, không đủ tạo đề trắc nghiệm!";
        return;
    }
    
    let danhSachTron = [...khoGoc].sort(() => 0.5 - Math.random());
    let soCau = Math.min(10, danhSachTron.length);
    mangCauHoiTest = [];

    for (let i = 0; i < soCau; i++) {
        let itemGoc = danhSachTron[i];
        let cauHoi = "";
        let dapAnDung = "";
        
        if (theLoaiTestChon === 'kanji') {
            cauHoi = `Chữ Kanji này có âm Hán Việt là gì: <br><span style="font-size:3.5rem; font-weight:bold; color:#fff;">${itemGoc.kanji}</span>`;
            let nghia = itemGoc.meaning || "";
            dapAnDung = (nghia.includes('(') && nghia.includes(')')) ? nghia.split('(')[0].trim() : nghia;
        } else if (theLoaiTestChon === 'tu-vung') {
            cauHoi = `Nghĩa tiếng Việt của từ: <br><span style="font-size:2.8rem; font-weight:bold; color:#00ffcc;">${itemGoc.kanji}</span> là gì?`;
            let nghia = itemGoc.meaning || "";
            dapAnDung = (nghia.includes('(') && nghia.includes(')')) ? nghia.substring(nghia.indexOf('(') + 1, nghia.indexOf(')')) : nghia;
        } else {
            cauHoi = `Cấu trúc: <br><span style="font-size:2.3rem; font-weight:bold; color:#38bdf8;">${itemGoc.grammar}</span> có ý nghĩa gì?`;
            dapAnDung = itemGoc.meaning || "";
        }

        let cacTuKhac = khoGoc.filter(x => x !== itemGoc);
        let dapAnNhieu = cacTuKhac.map(x => {
            let n = x.meaning || "";
            if (theLoaiTestChon === 'kanji') {
                return (n.includes('(') && n.includes(')')) ? n.split('(')[0].trim() : n;
            } else if (theLoaiTestChon === 'tu-vung') {
                return (n.includes('(') && n.includes(')')) ? n.substring(n.indexOf('(') + 1, n.indexOf(')')) : n;
            } else {
                return n;
            }
        });
        
        dapAnNhieu = [...new Set(dapAnNhieu)].filter(d => d !== dapAnDung).sort(() => 0.5 - Math.random());
        let bo4DapAn = [dapAnDung, dapAnNhieu[0], dapAnNhieu[1], dapAnNhieu[2]].sort(() => 0.5 - Math.random());

        mangCauHoiTest.push({
            cauHoiText: cauHoi,
            dung: dapAnDung,
            luaChon: bo4DapAn
        });
    }

    indexTestHienTai = 0;
    HienThiCauHoiTest();
}

function HienThiCauHoiTest() {
    daBamDapAn = false;
    const nutChuyenTest = document.getElementById('vung-nut-chuyen-test');
    if (nutChuyenTest) nutChuyenTest.classList.add('an-giau');
    
    let phanTuCau = mangCauHoiTest[indexTestHienTai];
    const testTienDo = document.getElementById('test-tien-do');
    const cauHoiTxt = document.getElementById('test-cau-hoi-text');
    
    if (testTienDo) testTienDo.innerText = `Câu hỏi: ${indexTestHienTai + 1} / ${mangCauHoiTest.length}`;
    if (cauHoiTxt) cauHoiTxt.innerHTML = phanTuCau.cauHoiText;

    let khungDapAn = document.getElementById('test-danh-sach-dap-an');
    if (khungDapAn) {
        khungDapAn.innerHTML = "";
        phanTuCau.luaChon.forEach(da => {
            let nutOpt = document.createElement('button');
            nutOpt.className = "nut-option-test";
            nutOpt.innerText = da;
            nutOpt.onclick = () => KiemTraKetQuaTest(nutOpt, da, phanTuCau.dung);
            khungDapAn.appendChild(nutOpt);
        });
    }
}

function KiemTraKetQuaTest(nutBam, textChon, textDung) {
    if (daBamDapAn) return; 
    daBamDapAn = true;

    let tatCaNut = document.querySelectorAll('.nut-option-test');
    tatCaNut.forEach(nut => {
        if (nut.innerText === textDung) {
            nut.classList.add('dap-an-dung-style'); 
        }
    });

    if (textChon === textDung) {
        nutBam.classList.add('dap-an-dung-style');
        CongDiemXP(5); 
    } else {
        nutBam.classList.add('dap-an-sai-style'); 
    }

    const nutChuyenTest = document.getElementById('vung-nut-chuyen-test');
    if (nutChuyenTest) nutChuyenTest.classList.remove('an-giau');
}

function CauTestTiepTheo() {
    indexTestHienTai++;
    if (indexTestHienTai >= mangCauHoiTest.length) {
        const cauHoiTxt = document.getElementById('test-cau-hoi-text');
        const khungDapAn = document.getElementById('test-danh-sach-dap-an');
        const nutChuyenTest = document.getElementById('vung-nut-chuyen-test');
        
        if (cauHoiTxt) cauHoiTxt.innerHTML = `🎉 <span style="color:#00ffcc;">QUÁ ĐỈNH BRO ƠI!</span><br>Đã hoàn thành xuất sắc bài test trắc nghiệm!`;
        if (khungDapAn) khungDapAn.innerHTML = "";
        if (nutChuyenTest) nutChuyenTest.classList.add('an-giau');
    } else {
        HienThiCauHoiTest();
    }
}

// =========================================================================
// PHÁT ÂM VÀ XP
// =========================================================================
function DocGiọngMay(vanBan, ngonNgu, tocDo, khiXong) {
    if (!vanBan || vanBan === "None") { if (khiXong) khiXong(); return; }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let vanBanSach = vanBan.replace(/<rt>.*?<\/rt>/g, '').replace(/<\/?[^>]+(>|$)/g, "").replace(/[\/()（）\-,ー]/g, ' ');
        let utterance = new SpeechSynthesisUtterance(vanBanSach);
        utterance.lang = ngonNgu;
        utterance.rate = tocDo;
        utterance.onend = () => { if (khiXong) khiXong(); };
        utterance.onerror = () => { if (khiXong) khiXong(); };
        window.speechSynthesis.speak(utterance);
    } else { if (khiXong) khiXong(); }
}

function CongDiemXP(soDiem) {
    diemXP += soDiem;
    localStorage.setItem('kanji_pure_xp', diemXP);
    const khungXp = document.getElementById('id-xp');
    if (khungXp) khungXp.innerText = diemXP;
}

window.addEventListener('DOMContentLoaded', () => {
    const khungXp = document.getElementById('id-xp');
    if (khungXp) khungXp.innerText = diemXP;
});
