// =========================================================================
// BIẾN TOÀN CỤC & TRẠNG THÁI APP
// =========================================================================
let diemXP = parseInt(localStorage.getItem('kanji_pure_xp')) || 0;
let duLieuHienTai = []; 
let indexHienTai = 0;   
let loaiHocHienTai = ''; 
let boDemThoiGian = null; 

// Biến bổ sung phục vụ cho Đấu Trường Test
let capDoTestChon = '';   // 'n5', 'n4'...
let theLoaiTestChon = ''; // 'kanji', 'tu-vung', 'ngu-phap'
let mangCauHoiTest = [];   // Chứa 10 câu trắc nghiệm được trộn
let indexTestHienTai = 0;
let daBamDapAn = false;

// =========================================================================
// ĐIỀU HƯỚNG MENU TAB
// =========================================================================
function ChuyenTab(idManHinh) {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    clearTimeout(boDemThoiGian);

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
    if (loaiHocHienTai === 'grammar') {
        ChuyenTab('man-home');
    } else {
        ChuyenTab('man-kanji');
    }
}

// Lựa chọn cấp độ Test
function ChonCapDoTest(capDo) {
    capDoTestChon = capDo;
    document.getElementById('tieu-de-level-test').innerText = `ĐANG CHỌN: TEST ${capDo.toUpperCase()}`;
    ChuyenTab('man-test-the-loai');
}

// =========================================================================
// TẢI DỮ LIỆU ĐỘNG CHO FLASHCARD HỌC
// =========================================================================
function TaiDuLieuHoc(loaiHoc, tenFile) {
    loaiHocHienTai = loaiHoc;
    
    if(tenFile === 'n5_grammar') {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.getElementById('btn-nav-grammar').classList.add('active');
    }

    ChuyenTab('man-hoc-chi-tiet');
    
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
            indexHienTai = 0; 
            ChayDongThoiGianFlashcard();
        })
        .catch(() => {
            tieuDe.innerText = "LỖI DATA";
            vungChua.innerHTML = `<p class="bao-loi">❌ Không tải được file "${tenFile}.json". Bro check lại file trên GitHub nhé!</p>`;
        });
}

function ChayDongThoiGianFlashcard() {
    const vungChua = document.getElementById('vung-chua-the-dong');
    const tieuDe = document.getElementById('tieu-de-bai-hoc');
    const nutChuyen = document.getElementById('vung-nut-chuyen-trang');

    if (duLieuHienTai.length === 0 || indexHienTai >= duLieuHienTai.length) {
        tieuDe.innerText = "HOÀN THÀNH!";
        vungChua.innerHTML = `<div class="loading-text" style="color: #00ffcc;">🎉 Chúc mừng đặc vụ đã hoàn thành trọn vẹn danh mục này!</div>`;
        nutChuyen.classList.add('an-giau');
        return;
    }

    tieuDe.innerText = `TIẾN ĐỘ: ${indexHienTai + 1} / ${duLieuHienTai.length}`;
    nutChuyen.classList.add('an-giau');
    clearTimeout(boDemThoiGian);

    const item = duLieuHienTai[indexHienTai];

    if (loaiHocHienTai === 'kanji') {
        // --- ĐÃ FIX LỖI ĐẢO NGƯỢC CHUỖI KANJI CHUẨN CHỈ ---
        const chuKanji = item.kanji || "字";
        const nghiaGoc = item.meaning || "";
        const onyomi = item.onyomi || "";
        const kunyomi = item.kunyomi || "";
        const viDu = item.example || "";

        let amHanViet = "Chưa rõ";
        let nghiaTiengViet = "Chưa rõ";

        // Tách chuỗi theo đúng cấu trúc: "GIÁ (Kiếm tiền, máy vận hành)"
        if (nghiaGoc.includes('(') && nghiaGoc.includes(')')) {
            amHanViet = nghiaGoc.split('(')[0].trim();
            nghiaTiengViet = nghiaGoc.substring(nghiaGoc.indexOf('(') + 1, nghiaGoc.indexOf(')'));
        } else {
            amHanViet = nghiaGoc;
            nghiaTiengViet = nghiaGoc;
        }

        vungChua.innerHTML = `
            <div class="the-cyber-card">
                <div class="chu-kanji-khong-lo">${chuKanji}</div>
                <div id="step-am-doc" class="khoi-noi-dung an-giau">
                    <div class="label-am-han">ÂM HÁN: ${amHanViet.toUpperCase()}</div>
                </div>
                <div id="step-nghia-viet" class="khoi-nghia-viet an-giau">
                    <div class="text-nghia">${nghiaTiengViet}</div>
                </div>
                <div id="step-yomi" class="khoi-yomi-duoi an-giau">
                    <div class="dong-cach-doc"><strong>Onyomi:</strong> ${onyomi}</div>
                    <div class="dong-cach-doc"><strong>Kunyomi:</strong> ${kunyomi}</div>
                </div>
                <div id="step-tu-ghep" class="khoi-tu-ghep an-giau">
                    <div class="title-ghep">Từ Ghép Tạo Nghĩa:</div>
                    <div class="content-ghep">${viDu}</div>
                </div>
            </div>
        `;
        KichHoatTimeline(onyomi, nghiaTiengViet);
    } else {
        // --- GIAO DIỆN HỌC NGỮ PHÁP ---
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
                        if (step3) step3.className = "khoi-yomi-duoi hien-hien";
                        if (step4) step4.className = "khoi-tu-ghep hien-hien";
                        nutChuyen.classList.remove('an-giau');
                        CongDiemXP(1);
                    }, 500);
                });
            }, 500);
        });
    }, 1000);
}

function ChuyenBaiTiepTheo() { indexHienTai++; ChayDongThoiGianFlashcard(); }

// =========================================================================
// KHU VỰC ĐẤU TRƯỜNG TEST TRẮC NGHIỆM 4 ĐÁP ÁN (ĐÃ ĐỒNG BỘ FIX LOGIC TÁCH CHUỖI)
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
        
        // Bóc tách chuẩn đáp án đúng cho bài test
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

        // Tạo 3 đáp án nhiễu từ kho dữ liệu
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
        
        // Lọc trùng lặp đáp án nhiễu
        dapAnNhieu = [...new Set(dapAnNhieu)].filter(d => d !== dapAnDung).sort(() => 0.5 - Math.random());
        
        // Tạo bộ 4 lựa chọn ngẫu nhiên vị trí
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

function CongDiemXP(soDiem) {
    diemXP += soDiem;
    localStorage.setItem('kanji_pure_xp', diemXP);
    document.getElementById('id-xp').innerText = diemXP;
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('id-xp').innerText = diemXP;
});
