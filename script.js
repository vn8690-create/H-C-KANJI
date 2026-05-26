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
let isMuted = false; // 🔥 Biến quản lý trạng thái âm thanh toàn cục

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

// Cập nhật cấu hình khi người dùng click checkbox
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
        // Nếu bật lên lại thì kích hoạt phát lại âm thanh để đồng bộ vòng lặp chuyển bài mới
        ChayDongThoiGianFlashcard();
    }
}

// 🔥 HÀM THAY ĐỔI TRẠNG THÁI MUTE LOA
function ThayDoiTrangThaiMute() {
    isMuted = !isMuted;
    const btnMute = document.getElementById('btn-mute-flashcard');
    if (btnMute) {
        if (isMuted) {
            window.speechSynthesis.cancel(); // Tắt âm ngay lập tức
            clearTimeout(boDemTuDongChuyen); // Tắt tự động nhảy bài tránh kẹt app khi mute
            btnMute.innerHTML = "🔇 ĐANG TẮT TIẾNG";
            btnMute.style.borderColor = "#ef4444";
            btnMute.style.color = "#ef4444";
        } else {
            btnMute.innerHTML = "🔊 ĐANG BẬT TIẾNG";
            btnMute.style.borderColor = "#00ffcc";
            btnMute.style.color = "#00ffcc";
            ChayDongThoiGianFlashcard();
        }
    }
}

// =========================================================================
// TẢI DỮ LIỆU ĐỘNG CHO FLASHCARD HỌC
// =========================================================================
function TaiDuLieuHoc(loaiHoc, tenFile) {
    loaiHocHienTai = loaiHoc;
    tenFileHienTai = tenFile; 
    
    if (tenFile === 'n5_grammar') {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.getElementById('btn-nav-grammar')?.classList.add('active');
    }

    ChuyenTab('man-hoc-chi-tiet');
    
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
            if (vungChua) vungChua.innerHTML = `<p class="bao-loi">❌ Không tải được file "${tenFile}.json". Bro check lại file nhé!</p>`;
        });
}

function KichHoatTienDo(indexChon) {
    indexHienTai = indexChon;
    ChayDongThoiGianFlashcard();
}

// =========================================================================
// HÀM CHẠY DÒNG THỜI GIAN FLASHCARD & HIỂN THỊ NỘI DUNG
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
    
    clearTimeout(boDemThoiGian);
    clearTimeout(boDemTuDongChuyen);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const item = duLieuHienTai[indexHienTai];

    // 1️⃣ XỬ LÝ RENDER HÌNH ẢNH CHO MÀN HÌNH HỌC KANJI
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
            nghiaTiengViet = nghiaGoc.substring(nghiaGoc.indexOf('(') + 1, nghiaGoc.indexOf(')')).trim();
        } else {
            amHanViet = nghiaGoc;
            nghiaTiengViet = nghiaGoc;
        }

        let styleAnYomi = hienThiYomi ? "" : "display: none !important;";

        if (vungChua) {
            vungChua.innerHTML = `
                <div class="the-cyber-card" style="min-height: 280px; height: auto; padding-bottom: 20px;">
                    <div class="chu-kanji-khong-lo" style="line-height: 1.2; margin-bottom: 10px;">${chuKanji}</div>
                    
                    <div id="step-am-doc" class="khoi-noi-dung" style="margin-bottom: 8px; opacity:0; transition: opacity 0.4s;">
                        <div class="label-am-han" style="color: #ff00ff; font-weight: bold; font-size: 1.2rem;">ÂM HÁN: ${amHanViet.toUpperCase()}</div>
                    </div>
                    
                    <div id="step-nghia-viet" class="khoi-nghia-viet" style="margin-bottom: 15px; opacity:0; transition: opacity 0.4s;">
                        <div class="text-nghia" style="color: #00ffcc; font-size: 1.4rem; font-weight: bold; background: rgba(0, 255, 204, 0.1); padding: 8px 15px; display: inline-block; border-radius: 8px;">
                            ${nghiaTiengViet}
                        </div>
                    </div>
                    
                    <div id="step-yomi" class="khoi-yomi-duoi" style="${styleAnYomi} margin-bottom: 15px; opacity:0; transition: opacity 0.4s;">
                        <div class="dong-cach-doc" style="font-size: 0.95rem; color: #cbd5e1; margin-bottom: 4px;"><strong>Onyomi:</strong> ${onyomi}</div>
                        <div class="dong-cach-doc" style="font-size: 0.95rem; color: #cbd5e1;"><strong>Kunyomi:</strong> ${kunyomi}</div>
                    </div>
                    
                    <div id="step-tu-ghep" class="khoi-tu-ghep" style="${styleAnYomi} border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px; opacity:0; transition: opacity 0.4s;">
                        <div class="title-ghep" style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 5px;">Từ Ghép Tạo Nghĩa:</div>
                        <div class="content-ghep" style="font-size: 1.05rem; color: #fff;">${viDu}</div>
                    </div>
                </div>
            `;
        }
        
        let chuoiDocKanjiViet = `${amHanViet}. Nghĩa là: ${nghiaTiengViet}`;
        KichHoatTimeline(chuKanji, chuoiDocKanjiViet, viDu);

    // 2️⃣ XỬ LÝ RENDER HÌNH ẢNH CHO MÀN HÌNH HỌC NGỮ PHÁP
    } else if (loaiHocHienTai === 'grammar') {
        const cauTruc = item.grammar || "";
        const nghiaPhap = item.meaning || "";
        const giaiThich = item.explanation || "";
        
        const mangViDu = item.examples || [];
        let vdNhat = "";
        let vdViet = "";
        if (mangViDu.length > 0) {
            vdNhat = mangViDu[0].ja || "";
            vdViet = mangViDu[0].vi || "";
        }

        if (vungChua) {
            vungChua.innerHTML = `
                <div class="the-cyber-card" style="min-height: 280px; height: auto; padding-bottom: 20px;">
                    <div class="chu-kanji-khong-lo" style="line-height: 1.2; margin-bottom: 15px; font-size: 2.2rem; color: #38bdf8;">${cauTruc}</div>
                    
                    <div id="step-nghia-viet" class="khoi-nghia-viet" style="margin-bottom: 15px; opacity:0; transition: opacity 0.4s;">
                        <div class="text-nghia" style="color: #00ffcc; font-size: 1.3rem; font-weight: bold; background: rgba(0, 255, 204, 0.1); padding: 8px 15px; display: inline-block; border-radius: 8px;">
                            Ý nghĩa: ${nghiaPhap}
                        </div>
                    </div>

                    <div id="step-giai-thich" class="khoi-noi-dung" style="margin-bottom: 15px; text-align: left; padding: 0 10px; opacity:0; transition: opacity 0.4s;">
                        <div style="font-size: 0.95rem; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">Giải thích:</div>
                        <div style="font-size: 1rem; color: #cbd5e1; line-height: 1.5;">${giaiThich}</div>
                    </div>
                    
                    ${vdNhat ? `
                    <div id="step-tu-ghep" class="khoi-tu-ghep" style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 12px; text-align: left; padding-left: 10px; padding-right: 10px; opacity:0; transition: opacity 0.4s;">
                        <div class="title-ghep" style="font-size: 0.9rem; color: #a78bfa; margin-bottom: 5px; font-weight: bold;">Ví Dụ Mẫu:</div>
                        <div class="content-ghep" style="font-size: 1.1rem; color: #fff; margin-bottom: 4px; font-weight: 500;">${vdNhat}</div>
                        <div style="font-size: 0.95rem; color: #94a3b8; font-style: italic;">${vdViet}</div>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        let chuoiDocNguPhapViet = `Cấu trúc: ${cauTruc}. Ý nghĩa là: ${nghiaPhap}. Giải thích: ${giaiThich}`;
        KichHoatTimeline(cauTruc, chuoiDocNguPhapViet, vdNhat);
    }
}

// =========================================================================
// HÀM KÍCH HOẠT TIMELINE PHÁT ÂM THEO HÀNG ĐỢI TUẦN TỰ (SỬA TUYỆT ĐỐI CHỐNG LOẠN)
// =========================================================================
function KichHoatTimeline(vanBanTiengNhat, vanBanTiengViet, cauViDuNhat) {
    // 1️⃣ LOGIC HIỂN THỊ TEXT TỪNG BƯỚC MƯỢT MÀ (Không phụ thuộc để tự động chuyển bài)
    const eStep1 = document.getElementById('step-am-doc');
    const eStep2 = document.getElementById('step-nghia-viet');
    const eStep3 = document.getElementById('step-giai-thich') || document.getElementById('step-yomi');
    const eStep4 = document.getElementById('step-tu-ghep');

    if (eStep1) eStep1.style.opacity = "1";
    
    boDemThoiGian = setTimeout(() => {
        if (eStep2) eStep2.style.opacity = "1";
    }, 1200);

    boDemThoiGian = setTimeout(() => {
        if (eStep3) eStep3.style.opacity = "1";
        if (eStep4) eStep4.style.opacity = "1";
        
        // Đọc hết các bước hiệu ứng thì hiện nút chuyển thủ công lên phòng hờ
        const nutChuyen = document.getElementById('vung-nut-chuyen-trang');
        if (nutChuyen) nutChuyen.classList.remove('an-giau');
    }, 2500);

    // 2️⃣ XỬ LÝ CHUỖI GIAO TIẾP ÂM THANH TUẦN TỰ (CHỐNG NUỐT CHỮ)
    if (isMuted) return; // Nếu đang Mute thì không khởi chạy hàng đợi âm thanh

    // Bước A: Đọc tiếng Nhật (Cấu trúc / Mặt chữ Kanji)
    DocGiongMay(vanBanTiengNhat, 'ja-JP', 0.85, () => {
        // Bước B: Đọc phần dịch nghĩa & giải thích tiếng Việt
        DocGiongMay(vanBanTiengViet, 'vi-VN', 1.0, () => {
            // Bước C: Đọc câu ví dụ tiếng Nhật
            DocGiongMay(cauViDuNhat, 'ja-JP', 0.85, () => {
                
                // 🔥 ĐÃ ĐỌC XONG HOÀN TOÀN TẤT CẢ! KIỂM TRA TỰ ĐỘNG NEXT BÀI THÔNG MINH
                if (tuDongChuyenBai) {
                    clearTimeout(boDemTuDongChuyen);
                    // Đọc dứt câu hoàn toàn, nghỉ ngơi 2 giây (2000ms) cho ngấm rồi mới tự động nhảy bài
                    boDemTuDongChuyen = setTimeout(() => {
                        ChuyenBaiTiepTheo();
                    }, 2000);
                }
            });
        });
    });
}

// =========================================================================
// HÀM PHÁT ÂM GỐC - LÀM SẠCH VÀ TẠO NHỊP NGHỈ TỰ NHIÊN
// =========================================================================
function DocGiongMay(vanBan, ngonNgu, tocDo, khiXong) {
    if (!vanBan || vanBan === "None" || vanBan.trim() === "" || isMuted) { 
        if (khiXong) khiXong(); 
        return; 
    }
    
    if ('speechSynthesis' in window) {
        let vanBanSach = vanBan.replace(/<rt>.*?<\/rt>/g, '').replace(/<\/?[^>]+(>|$)/g, "");
        vanBanSach = vanBanSach.replace(/[\/()（）\-ー]/g, ' ');
        
        vanBanSach = vanBanSach.replace(/[,，、]/g, ',   '); 
        vanBanSach = vanBanSach.replace(/[.。]/g, '.   ');

        let utterance = new SpeechSynthesisUtterance(vanBanSach);
        utterance.lang = ngonNgu;
        utterance.rate = tocDo;
        
        utterance.onend = () => { 
            if (khiXong) khiXong(); 
        };
        utterance.onerror = (e) => { 
            console.error("Lỗi phát âm:", e);
            if (khiXong) khiXong(); 
        };
        
        window.speechSynthesis.speak(utterance);
    } else { 
        if (khiXong) khiXong(); 
    }
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
    
    fetch(`./fileNguon}.json`)
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
            let dapAnDungRaw = itemGoc.meaning || "";
            dapAnDung = dapAnDungRaw;
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
