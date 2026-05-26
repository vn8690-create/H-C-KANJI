// =========================================================================
// BIẾN TOÀN CỤC & TRẠNG THÁI APP
// =========================================================================
let diemXP = parseInt(localStorage.getItem('kanji_pure_xp')) || 0;
let duLieuHienTai = []; 
let indexHienTai = 0;   
let loaiHocHienTai = ''; 
let boDemThoiGian = null; 
let boDemTuDongChuyen = null; // Quản lý luồng tự động chuyển trang sau 2s

// Trạng thái cấu hình học tập (Lưu trạng thái On/Off của user)
let hienThiYomi = true;
let tuDongChuyenBai = false;

// Biến bổ sung phục vụ cho Đấu Trường Test
let capDoTestChon = '';   
let theLoaiTestChon = ''; 
let mangCauHoiTest = [];   
let indexTestHienTai = 0;
let daBamDapAn = false;

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
    if (idManHinh === 'man-home') document.getElementById('btn-nav-home').classList.add('active');
    if (idManHinh === 'man-kanji') document.getElementById('btn-nav-kanji').classList.add('active');
    if (idManHinh === 'man-test-levels') document.getElementById('btn-nav-test').classList.add('active');
    if (idManHinh === 'man-grammar') document.getElementById('btn-nav-grammar').classList.add('active');
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
    document.getElementById('tieu-de-level-test').innerText = `ĐANG CHỌN: TEST ${capDo.toUpperCase()}`;
    ChuyenTab('man-test-the-loai');
}

// Cập nhật cấu hình khi người dùng click checkbox
function CapNhatCaiDatHoc() {
    hienThiYomi = document.getElementById('chk-hien-yomi').checked;
    tuDongChuyenBai = document.getElementById('chk-auto-next').checked;
    
    // Xử lý ẩn/hiện lập tức khối Yomi nếu đang ở trong màn hình học
    const step3 = document.getElementById('step-yomi');
    const step4 = document.getElementById('step-tu-ghep');
    
    if (step3 && step4) {
        if (hienThiYomi && step3.classList.contains('hien-hien')) {
            step3.style.setProperty('display', 'block', 'important');
            step4.style.setProperty('display', 'block', 'important');
        } else {
            step3.style.setProperty('display', 'none', 'important');
            step4.style.setProperty('display', 'none', 'important');
        }
    }

    // Nếu người dùng tắt tự động chuyển bài giữa chừng thì hủy bộ đếm ngay
    if(!tuDongChuyenBai) {
        clearTimeout(boDemTuDongChuyen);
    } else {
        // Nếu bật lên mà nút chuyển trang đã lộ diện rồi thì kích hoạt hẹn giờ đi luôn
        const nutChuyen = document.getElementById('vung-nut-chuyen-trang');
        if(nutChuyen && !nutChuyen.classList.contains('an-giau')) {
            clearTimeout(boDemTuDongChuyen);
            boDemTuDongChuyen = setTimeout(() => { ChuyenBaiTiepTheo(); }, 2000);
        }
    }
}

// =========================================================================
// TẢI DỮ LIỆU ĐỘNG CHO FLASHCARD HỌC (ĐÃ TÍCH HỢP LƯU TIẾN ĐỘ)
// =========================================================================
let tenFileHienTai = ''; // Biến toàn cục mới để lưu tên file đang chạy

function TaiDuLieuHoc(loaiHoc, tenFile) {
    loaiHocHienTai = loaiHoc;
    tenFileHienTai = tenFile; // Ghi nhớ tên file phục vụ lưu tiến độ cá nhân
    
    if(tenFile === 'n5_grammar') {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.getElementById('btn-nav-grammar').classList.add('active');
    }

    ChuyenTab('man-hoc-chi-tiet');
    
    // Đồng bộ trạng thái từ biến lên nút checkbox
    document.getElementById('chk-hien-yomi').checked = hienThiYomi;
    document.getElementById('chk-auto-next').checked = tuDongChuyenBai;
    
    const tieuDe = document.getElementById('tieu-de-bai-hoc');
    const vungChua = document.getElementById('vung-chua-the-dong');
    const nutChuyen = document.getElementById('vung-nut-chuyen-trang');
    
    tieuDe.innerText = `ĐANG KẾT NỐI...`;
    vungChua.innerHTML = `<div class="loading-text">⚡ Đang đồng bộ bộ não dữ liệu...</div>`;
    nutChuyen.classList.add('an-giau');

    fetch(`./${tenFile}.json`)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => {
            duLieuHienTai = data; 

            // Kiểm tra xem danh mục file này trước đó đã có bộ nhớ lưu trữ chưa
            let tienDoCu = parseInt(localStorage.getItem(`tien_do_${tenFile}`)) || 0;

            if (tienDoCu > 0 && tienDoCu < duLieuHienTai.length) {
                // Xuất hiện hộp thoại Cyber hỏi ý kiến học viên lựa chọn tiến độ
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
                // Chưa học bao giờ hoặc học xong rồi thì tự nhảy từ đầu
                indexHienTai = 0; 
                ChayDongThoiGianFlashcard();
            }
        })
        .catch(() => {
            tieuDe.innerText = "LỖI DATA";
            vungChua.innerHTML = `<p class="bao-loi">❌ Không tải được file "${tenFile}.json". Bro check lại file trên GitHub nhé!</p>`;
        });
}

// Hàm bổ trợ chuyển tiếp lựa chọn index học
function KichHoatTienDo(indexChon) {
    indexHienTai = indexChon;
    ChayDongThoiGianFlashcard();
}

function ChayDongThoiGianFlashcard() {
    const vungChua = document.getElementById('vung-chua-the-dong');
    const tieuDe = document.getElementById('tieu-de-bai-hoc');
    const nutChuyen = document.getElementById('vung-nut-chuyen-trang');

    if (duLieuHienTai.length === 0 || indexHienTai >= duLieuHienTai.length) {
        tieuDe.innerText = "HOÀN THÀNH!";
        vungChua.innerHTML = `
            <div class="loading-text" style="color: #00ffcc; text-align:center;">
                🎉 Chúc mừng đặc vụ đã hoàn thành trọn vẹn danh mục này!
                <br><br>
                <button class="nut-quay-lai" style="border: 1px solid #00ffcc; color: #00ffcc; margin-top:20px; background: rgba(0, 255, 204, 0.05);" onclick="ResetToanBoTienDoFile()">
                    🔄 RESET HỌC LẠI TỪ ĐẦU
                </button>
            </div>
        `;
        nutChuyen.classList.add('an-giau');
        // Reset dữ liệu bộ nhớ về 0 để hôm sau vào không bị kẹt ở trang hoàn thành
        localStorage.setItem(`tien_do_${tenFileHienTai}`, 0);
        return;
    }

    // ĐỒNG BỘ TIẾN ĐỘ HỌC VÀO LOCALSTORAGE NGAY KHI HIỂN THỊ TỪ MỚI
    localStorage.setItem(`tien_do_${tenFileHienTai}`, indexHienTai);

    tieuDe.innerText = `TIẾN ĐỘ: ${indexHienTai + 1} / ${duLieuHienTai.length}`;
    nutChuyen.classList.add('an-giau');
    
    // Reset sạch sẽ tất cả các bộ đếm thời gian cũ chống chồng luồng dữ liệu
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

        // Khởi tạo style ẩn/hiện dựa theo cấu hình thời điểm tải thẻ card
        let styleAnYomi = hienThiYomi ? "" : "display: none !important;";

        vungChua.innerHTML = `
            <div class="the-cyber-card">
                <div class="chu-kanji-khong-lo">${chuKanji}</div>
                <div id="step-am-doc" class="khoi-noi-dung an-giau">
                    <div class="label-am-han">ÂM HÁN: ${amHanViet.toUpperCase()}</div>
                </div>
                <div id="step-nghia-viet" class="khoi-nghia-viet an-giau">
                    <div class="text-nghia">${nghiaTiengViet}</div>
                </div>
                <div id="step-yomi" class="khoi-yomi-duoi an-giau" style="${styleAnYomi}">
                    <div class="dong-cach-doc"><strong>Onyomi:</strong> ${onyomi}</div>
                    <div class="dong-cach-doc"><strong>Kunyomi:</strong> ${kunyomi}</div>
                </div>
                <div id="step-tu-ghep" class="khoi-tu-ghep an-giau" style="${styleAnYomi}">
                    <div class="title-ghep">Từ Ghép Tạo Nghĩa:</div>
                    <div class="content-ghep">${viDu}</div>
                </div>
            </div>
        `;
        
        // Luôn truyền âm Nhật để đọc giọng máy, việc ẩn hiển giao diện xử lý riêng ở dưới
        KichHoatTimeline(onyomi, nghiaTiengViet);
    } else {
        // GIAO DIỆN HỌC NGỮ PHÁP N5
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

        vungChua.innerHTML = `
            <div class="the-cyber-card">
                <div class="chu-kanji-khong-lo" style="font-size: 2.5rem; color: #38bdf8;">${cauTruc}</div>
                <div id="step-am-doc" class="khoi-noi-dung an-giau">
                    <div class="label-am-han" style="color: #ff00ff;">Ý NGHĨA: ${nghiaNguPhap.toUpperCase()}</div>
                </div>
                <div id="step-nghia-viet" class="khoi-nghia-viet an-giau" style="text-align:left;">
                    <div class="text-nghia" style="font-size:0.95rem; color:#cbd5e1; font-weight:normal;">
                        <strong>Cách dùng:</strong> ${giaiThich}
                    </div>
                </div>
                <div id="step-tu-ghep" class="khoi-tu-ghep an-giau" style="display:block !important;">
                    <div class="title-ghep">Các Câu Ví Dụ:</div>
                    <div>${htmlViDu}</div>
                </div>
            </div>
        `;
        KichHoatTimeline(cauTruc, nghiaNguPhap);
    }
}

function KichHoatTimeline(textNhat, textViet) {
    const nutChuyen = document.getElementById('vung-nut-chuyen-trang');
    
    boDemThoiGian = setTimeout(() => {
        const step1 = document.getElementById('step-am-doc');
        if (step1) step1.className = "khoi-noi-dung hien-hien";
        
        DocGiọngMay(textNhat, 'ja-JP', 0.85, () => {
            boDemThoiGian = setTimeout(() => {
                const step2 = document.getElementById('step-nghia-viet');
                if (step2) step2.className = "khoi-nghia-viet hien-hien";
                
                DocGiọngMay(textViet, 'vi-VN', 0.95, () => {
                    boDemThoiGian = setTimeout(() => {
                        const step3 = document.getElementById('step-yomi');
                        const step4 = document.getElementById('step-tu-ghep');
                        
                        if (step3 && step4) {
                            step3.className = "khoi-yomi-duoi hien-hien";
                            step4.className = "khoi-tu-ghep hien-hien";
                            
                            // Ép kiểu inline !important kiểm tra sát sườn điều kiện nút tích
                            if (hienThiYomi) {
                                step3.style.setProperty('display', 'block', 'important');
                                step4.style.setProperty('display', 'block', 'important');
                            } else {
                                step3.style.setProperty('display', 'none', 'important');
                                step4.style.setProperty('display', 'none', 'important');
                            }
                        }
                        
                        // Hiện nút chuyển trang thủ công lên
                        if (nutChuyen) nutChuyen.classList.remove('an-giau');
                        CongDiemXP(1);

                        // XỬ LÝ KHÓA TỰ ĐỘNG CHUYỂN BÀI CHUẨN ĐÉT SAU 2 GIÂY
                        if (tuDongChuyenBai) {
                            clearTimeout(boDemTuDongChuyen);
                            boDemTuDongChuyen = setTimeout(() => {
                                ChuyenBaiTiepTheo();
                            }, 2000);
                        }
                    }, 500);
                });
            }, 500);
        });
    }, 1000);
}

function ChuyenBaiTiepTheo() { 
    clearTimeout(boDemTuDongChuyen);
    clearTimeout(boDemThoiGian);
    indexHienTai++; 
    ChayDongThoiGianFlashcard(); 
}

// Hàm hỗ trợ học viên reset tiến độ bằng tay
function ResetToanBoTienDoFile() {
    if(confirm("Bro có chắc chắn muốn xóa tiến độ của mục này để học lại từ đầu không?")) {
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
    
    let fileNguồn = (theLoai === 'ngu-phap') ? 'n5_grammar' : capDoTestChon;
    
    fetch(`./${fileNguồn}.json`)
        .then(res => res.json())
        .then(khoGốc => {
            TaoDeTracNghiem(khoGốc);
        })
        .catch(() => {
            document.getElementById('test-cau-hoi-text').innerText = `❌ Lỗi kết nối đề thi level ${capDoTestChon.toUpperCase()} rồi đại ca ơi!`;
        });
}

function TaoDeTracNghiem(khoGốc) {
    if(!khoGốc || khoGốc.length < 4) {
        document.getElementById('test-cau-hoi-text').innerText = "❌ Kho dữ liệu quá ít, không đủ tạo đề trắc nghiệm!";
        return;
    }
    
    let danhSachTrộn = [...khoGốc].sort(() => 0.5 - Math.random());
    let soCau = Math.min(10, danhSachTrộn.length);
    mangCauHoiTest = [];

    for (let i = 0; i < soCau; i++) {
        let itemGốc = danhSachTrộn[i];
        let cauHoi = "";
        let dapAnDung = "";
        
        if (theLoaiTestChon === 'kanji') {
            cauHoi = `Chữ Kanji này có âm Hán Việt là gì: <br><span style="font-size:3.5rem; font-weight:bold; color:#fff;">${itemGốc.kanji}</span>`;
            let nghia = itemGốc.meaning || "";
            dapAnDung = (nghia.includes('(') && nghia.includes(')')) ? nghia.split('(')[0].trim() : nghia;
        } else if (theLoaiTestChon === 'tu-vung') {
            cauHoi = `Nghĩa tiếng Việt của từ: <br><span style="font-size:2.8rem; font-weight:bold; color:#00ffcc;">${itemGốc.kanji}</span> là gì?`;
            let nghia = itemGốc.meaning || "";
            dapAnDung = (nghia.includes('(') && nghia.includes(')')) ? nghia.substring(nghia.indexOf('(') + 1, nghia.indexOf(')')) : nghia;
        } else {
            cauHoi = `Cấu trúc: <br><span style="font-size:2.3rem; font-weight:bold; color:#38bdf8;">${itemGốc.grammar}</span> có ý nghĩa gì?`;
            dapAnDung = itemGốc.meaning || "";
        }

        let cácTừKhác = khoGốc.filter(x => x !== itemGốc);
        let dapAnNhieu = cácTừKhác.map(x => {
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
    document.getElementById('vung-nut-chuyen-test').classList.add('an-giau');
    
    let phanTuCau = mangCauHoiTest[indexTestHienTai];
    document.getElementById('test-tien-do').innerText = `Câu hỏi: ${indexTestHienTai + 1} / ${mangCauHoiTest.length}`;
    document.getElementById('test-cau-hoi-text').innerHTML = phanTuCau.cauHoiText;

    let khungDapAn = document.getElementById('test-danh-sach-dap-an');
    khungDapAn.innerHTML = "";

    phanTuCau.luaChon.forEach(da => {
        let nutOpt = document.createElement('button');
        nutOpt.className = "nut-option-test";
        nutOpt.innerText = da;
        nutOpt.onclick = () => KiemTraKetQuaTest(nutOpt, da, phanTuCau.dung);
        khungDapAn.appendChild(nutOpt);
    });
}

function KiemTraKetQuaTest(nutBam, textChon, textDung) {
    if(daBamDapAn) return; 
    daBamDapAn = true;

    let tatCaNut = document.querySelectorAll('.nut-option-test');
    tatCaNut.forEach(nut => {
        if(nut.innerText === textDung) {
            nut.classList.add('dap-an-dung-style'); 
        }
    });

    if (textChon === textDung) {
        nutBam.classList.add('dap-an-dung-style');
        CongDiemXP(5); 
    } else {
        nutBam.classList.add('dap-an-sai-style'); 
    }

    document.getElementById('vung-nut-chuyen-test').classList.remove('an-giau');
}

function CauTestTiepTheo() {
    indexTestHienTai++;
    if(indexTestHienTai >= mangCauHoiTest.length) {
        document.getElementById('test-cau-hoi-text').innerHTML = `🎉 <span style="color:#00ffcc;">QUÁ ĐỈNH BRO ƠI!</span><br>Đã hoàn thành xuất sắc bài test trắc nghiệm!`;
        document.getElementById('test-danh-sach-dap-an').innerHTML = "";
        document.getElementById('vung-nut-chuyen-test').classList.add('an-giau');
    } else {
        HienThiCauHoiTest();
    }
}

// =========================================================================
// PHÁT ÂM VÀ XP
// =========================================================================
function DocGiọngMay(vanBan, ngonNgu, tocDo, khiXong) {
    if (!vanBan || vanBan === "None") { if(khiXong) khiXong(); return; }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let vanBanSach = vanBan.replace(/<rt>.*?<\/rt>/g, '').replace(/<\/?[^>]+(>|$)/g, "").replace(/[\/()（）\-,ー]/g, ' ');
        let utterance = new SpeechSynthesisUtterance(vanBanSach);
        utterance.lang = ngonNgu;
        utterance.rate = tocDo;
        utterance.onend = () => { if(khiXong) khiXong(); };
        utterance.onerror = () => { if(khiXong) khiXong(); };
        window.speechSynthesis.speak(utterance);
    } else { if(khiXong) khiXong(); }
}

// Hàm hỗ trợ cộng điểm
function CongDiemXP(soDiem) {
    diemXP += soDiem;
    localStorage.setItem('kanji_pure_xp', diemXP);
    const khungXp = document.getElementById('id-xp');
    if(khungXp) khungXp.innerText = diemXP;
}

window.addEventListener('DOMContentLoaded', () => {
    const khungXp = document.getElementById('id-xp');
    if(khungXp) khungXp.innerText = diemXP;
});
