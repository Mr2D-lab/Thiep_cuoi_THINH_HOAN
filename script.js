/* ===================================================
   Thiệp Cưới 2026 - Interactive Scripts
   =================================================== */

function _initWeddingApp() {
  if (window._appInitialized) return;
  window._appInitialized = true;
  if ('scrollRestoration' in history) {
    try { history.scrollRestoration = 'manual'; } catch (e) {}
  }
  window.scrollTo(0, 0);
  applyWeddingConfig();
  initPersonalizedGuestLink();
  initOpeningScreen();
  initBlossomCanvas();
  initCountdown();
  initMusicPlayer();
  initEnvelopeGift();
  initRsvpForm();
  initLightbox();
  initAnimations();
  initVisualAdminModule();

  // TỐI ƯU 4: Nạp ngầm cấu hình mới nhất từ đám mây (Live Cloud Data Fetch)
  // Khách mời hoặc thiết bị khác sẽ thấy thay đổi sau 1-2s mà không phải đợi Vercel build 1 phút
  fetchLatestCloudConfig();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initWeddingApp);
} else {
  _initWeddingApp();
}

/* =====================================================
   0. Dynamic Wedding Configuration Binding
   ===================================================== */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateStr);
}

const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function pad(num) {
  return String(num).padStart(2, '0');
}

function formatDateDots(d) {
  if (!d) return '';
  return `${pad(d.getDate())} . ${pad(d.getMonth() + 1)} . ${d.getFullYear()}`;
}

function formatDateFull(d) {
  if (!d) return '';
  const dayOfWeek = dayNames[d.getDay()];
  return `${dayOfWeek}, ngày ${pad(d.getDate())} tháng ${pad(d.getMonth() + 1)} năm ${d.getFullYear()}`;
}

function formatDateShort(d) {
  if (!d) return '';
  const dayOfWeek = dayNames[d.getDay()];
  return `${dayOfWeek}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatMonthYear(d) {
  if (!d) return '';
  return `${pad(d.getMonth() + 1)} / ${d.getFullYear()}`;
}

function formatRsvpDeadline(d, daysBefore = 7) {
  if (!d) return '';
  const deadline = new Date(d.getTime());
  deadline.setDate(deadline.getDate() - daysBefore);
  return `${pad(deadline.getDate())}/${pad(deadline.getMonth() + 1)}/${deadline.getFullYear()}`;
}

function formatTimeText(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  return `${parseInt(parts[0], 10)} giờ ${parts[1] || '00'}`;
}

function formatAccountNumber(numStr) {
  if (!numStr) return '';
  return numStr.replace(/\s+/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
}

function applyWeddingConfig() {
  // Nạp bản nháp đã lưu tại máy này (nếu có)
  try {
    const localDraft = localStorage.getItem('wedding_config_local_draft');
    if (localDraft) {
      const parsedDraft = JSON.parse(localDraft);
      if (parsedDraft && typeof parsedDraft === 'object') {
        window.WEDDING_CONFIG = Object.assign({}, typeof WEDDING_CONFIG !== 'undefined' ? WEDDING_CONFIG : {}, parsedDraft);
      }
    }
  } catch (e) {
    console.warn('Không thể đọc local draft config:', e);
  }

  if (typeof WEDDING_CONFIG === 'undefined') return;

  const cfg = WEDDING_CONFIG;
  const weddingDate = parseLocalDate(cfg.weddingDate);

  // Update Page Title
  if (cfg.bride?.name && cfg.groom?.name) {
    document.title = `${cfg.bride.name} & ${cfg.groom.name} — Thiệp Cưới 2026`;
  }

  // DOM Binding Map
  const bindings = {
    'groom-name': cfg.groom?.name,
    'bride-name': cfg.bride?.name,
    'couple-hero-bride': cfg.bride?.name,
    'couple-hero-groom': cfg.groom?.name,
    'couple-names-invite': `${cfg.groom?.name} ❤ ${cfg.bride?.name}`,
    'couple-footer': `${cfg.bride?.name} & ${cfg.groom?.name}`,
    'groom-father': cfg.groom?.father,
    'groom-mother': cfg.groom?.mother,
    'groom-address': cfg.groom?.address,
    'bride-father': cfg.bride?.father,
    'bride-mother': cfg.bride?.mother,
    'bride-address': cfg.bride?.address,
    'wedding-date-dots': formatDateDots(weddingDate),
    'wedding-date-day': weddingDate ? pad(weddingDate.getDate()) : '22',
    'wedding-date-month': weddingDate ? pad(weddingDate.getMonth() + 1) : '11',
    'wedding-date-year': weddingDate ? String(weddingDate.getFullYear()) : '2026',
    'wedding-date-full': formatDateFull(weddingDate),
    'wedding-time-hour': cfg.weddingTime ? pad(cfg.weddingTime.split(':')[0]) : '11',
    'wedding-time-minute': cfg.weddingTime ? pad(cfg.weddingTime.split(':')[1] || '00') : '11',
    'wedding-time-text': cfg.weddingTime ? `Tổ chức vào lúc ${formatTimeText(cfg.weddingTime)}` : '',
    'wedding-lunar-date': cfg.lunarDate ? `(${cfg.lunarDate})` : '',
    'story-wedding-date': formatMonthYear(weddingDate),
    'rsvp-deadline-text': `Xin vui lòng xác nhận trước ngày ${formatRsvpDeadline(weddingDate, cfg.rsvpDaysBefore)} để chúng tôi chu toàn đón tiếp`,
    'bank-groom-account-holder': (cfg.bankAccount?.groom?.accountHolder || cfg.bankAccount?.accountHolder || cfg.groom?.name || 'Đăng Thịnh'),
    'bank-groom-name': (cfg.bankAccount?.groom?.bankName || cfg.bankAccount?.bankName || 'BIDV'),
    'bank-groom-account-number': formatAccountNumber(cfg.bankAccount?.groom?.accountNumber || cfg.bankAccount?.accountNumber || '8823 9681 72'),
    'bank-bride-account-holder': (cfg.bankAccount?.bride?.accountHolder || cfg.bride?.name || 'Hoàn Nguyễn'),
    'bank-bride-name': (cfg.bankAccount?.bride?.bankName || 'BIDV'),
    'bank-bride-account-number': formatAccountNumber(cfg.bankAccount?.bride?.accountNumber || '8823 9681 72'),
    'bank-account-holder': cfg.bankAccount?.accountHolder || 'Đăng Thịnh',
    'bank-name': cfg.bankAccount?.bankName || 'BIDV',
    'bank-account-number': formatAccountNumber(cfg.bankAccount?.accountNumber || '8823 9681 72'),
  };

  // Helper tạo link Google Maps tự động nếu người dùng không nhập link riêng
  function resolveMapUrl(mapUrl, locationName, address) {
    if (mapUrl && mapUrl.trim()) return mapUrl.trim();
    const query = [locationName, address].filter(Boolean).join(', ').trim();
    if (!query) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  // 1. Địa chỉ trên Thiệp Mời Chính (Section 2)
  if (cfg.venues?.invitation) {
    const inv = cfg.venues.invitation;
    const invLoc = (inv.location || '').replace(/[:\s]+$/, '').trim();
    const invAddr = (inv.address || '').trim();
    if (invLoc && invAddr) {
      bindings['invitation-venue'] = `${invLoc}:<br>${invAddr.replace(/\n/g, '<br>')}`;
    } else {
      bindings['invitation-venue'] = (invLoc || invAddr).replace(/\n/g, '<br>');
    }
  } else if (cfg.invitationVenue) {
    bindings['invitation-venue'] = cfg.invitationVenue.replace(/\n/g, '<br>');
  }

  // 2. Sự kiện 1: Lễ Vu Quy / Thành Hôn (Section 9)
  const ceremonyData = cfg.venues?.ceremony || cfg.events?.ceremony;
  if (ceremonyData) {
    const cerDate = ceremonyData.date ? parseLocalDate(ceremonyData.date) : weddingDate;
    bindings['event-ceremony-title'] = ceremonyData.title || 'Lễ Vu Quy';
    bindings['event-ceremony-time'] = ceremonyData.time || '08:00';
    bindings['event-ceremony-date'] = ceremonyData.dateText || formatDateShort(cerDate);

    let cerAddrHtml = '';
    const cerLoc = (ceremonyData.locationName || '').replace(/[,:\s]+$/, '').trim();
    const cerAddr = (ceremonyData.address || '').trim();
    if (cerLoc && cerAddr) {
      cerAddrHtml = `${cerLoc}<br>${cerAddr.replace(/\n/g, '<br>')}`;
    } else {
      cerAddrHtml = (cerLoc || cerAddr).replace(/\n/g, '<br>');
    }
    bindings['event-ceremony-address'] = cerAddrHtml;

    const cerMap = document.querySelector('[data-bind-href="event-ceremony-map"]');
    if (cerMap) {
      const mapUrl = resolveMapUrl(ceremonyData.mapUrl, ceremonyData.locationName, ceremonyData.address);
      if (mapUrl) {
        cerMap.href = mapUrl;
        cerMap.style.display = '';
      } else {
        cerMap.style.display = 'none';
      }
    }
  }

  // 3. Sự kiện 2: Tiệc Cưới (Section 9)
  const receptionData = cfg.venues?.reception || cfg.events?.reception;
  if (receptionData) {
    const recDate = receptionData.date ? parseLocalDate(receptionData.date) : weddingDate;
    bindings['event-reception-title'] = receptionData.title || 'Tiệc Cưới';
    bindings['event-reception-time'] = receptionData.time || '17:30';
    bindings['event-reception-date'] = receptionData.dateText || formatDateShort(recDate);

    let recAddrHtml = '';
    const recLoc = (receptionData.locationName || '').replace(/[,:\s]+$/, '').trim();
    const recAddr = (receptionData.address || '').trim();
    if (recLoc && recAddr) {
      recAddrHtml = `${recLoc}<br>${recAddr.replace(/\n/g, '<br>')}`;
    } else {
      recAddrHtml = (recLoc || recAddr).replace(/\n/g, '<br>');
    }
    bindings['event-reception-address'] = recAddrHtml;

    const recMap = document.querySelector('[data-bind-href="event-reception-map"]');
    if (recMap) {
      const mapUrl = resolveMapUrl(receptionData.mapUrl, receptionData.locationName, receptionData.address);
      if (mapUrl) {
        recMap.href = mapUrl;
        recMap.style.display = '';
      } else {
        recMap.style.display = 'none';
      }
    }
  }

  // 4. Toàn bộ văn bản trên web (Texts configuration)
  const txt = cfg.texts || {};
  if (txt.hero?.subtitle !== undefined) bindings['hero-subtitle'] = txt.hero.subtitle;
  if (txt.invitation?.groomFamilyTitle !== undefined) bindings['invitation-groom-family-title'] = txt.invitation.groomFamilyTitle;
  if (txt.invitation?.brideFamilyTitle !== undefined) bindings['invitation-bride-family-title'] = txt.invitation.brideFamilyTitle;
  if (txt.invitation?.heading !== undefined) bindings['invitation-heading'] = txt.invitation.heading;
  if (txt.invitation?.guestLabel !== undefined) bindings['invitation-guest-label'] = txt.invitation.guestLabel;
  if (txt.invitation?.subheading !== undefined) bindings['invitation-subheading'] = txt.invitation.subheading;
  if (txt.invitation?.blessing !== undefined) bindings['invitation-blessing'] = txt.invitation.blessing;
  if (txt.invitation?.timePrefix !== undefined && cfg.weddingTime) {
    bindings['wedding-time-text'] = txt.invitation.timePrefix ? `${txt.invitation.timePrefix} ${formatTimeText(cfg.weddingTime)}` : '';
  }

  if (txt.poem !== undefined) bindings['poem-text'] = txt.poem.replace(/\n/g, '<br>');

  if (txt.couple?.subtitle !== undefined) bindings['couple-subtitle'] = txt.couple.subtitle;
  if (txt.couple?.heading !== undefined) bindings['couple-heading'] = txt.couple.heading;
  if (txt.couple?.groomRole !== undefined) bindings['groom-role'] = txt.couple.groomRole;
  if (txt.couple?.brideRole !== undefined) bindings['bride-role'] = txt.couple.brideRole;

  if (txt.quote?.text !== undefined) bindings['quote-text'] = txt.quote.text.replace(/\n/g, '<br>');
  if (txt.quote?.author !== undefined) bindings['quote-author'] = txt.quote.author;

  if (txt.gallery?.subtitle !== undefined) bindings['gallery-subtitle'] = txt.gallery.subtitle;
  if (txt.gallery?.heading !== undefined) bindings['gallery-heading'] = txt.gallery.heading;

  if (txt.story?.subtitle !== undefined) bindings['story-subtitle'] = txt.story.subtitle;
  if (txt.story?.heading !== undefined) bindings['story-heading'] = txt.story.heading;

  if (txt.countdown?.subtitle !== undefined) bindings['countdown-subtitle'] = txt.countdown.subtitle;
  if (txt.countdown?.heading !== undefined) bindings['countdown-heading'] = txt.countdown.heading;
  if (txt.countdown?.daysLabel !== undefined) bindings['countdown-days-label'] = txt.countdown.daysLabel;
  if (txt.countdown?.hoursLabel !== undefined) bindings['countdown-hours-label'] = txt.countdown.hoursLabel;
  if (txt.countdown?.minutesLabel !== undefined) bindings['countdown-minutes-label'] = txt.countdown.minutesLabel;
  if (txt.countdown?.secondsLabel !== undefined) bindings['countdown-seconds-label'] = txt.countdown.secondsLabel;

  if (txt.eventsHeader?.subtitle !== undefined) bindings['events-subtitle'] = txt.eventsHeader.subtitle;
  if (txt.eventsHeader?.heading !== undefined) bindings['events-heading'] = txt.eventsHeader.heading;

  if (txt.dressCode?.heading !== undefined) bindings['dresscode-heading'] = txt.dressCode.heading;
  if (txt.dressCode?.subtitle !== undefined) bindings['dresscode-subtitle'] = txt.dressCode.subtitle;
  if (txt.dressCode?.note !== undefined) bindings['dresscode-note'] = txt.dressCode.note;

  if (txt.rsvp?.subtitle !== undefined) bindings['rsvp-subtitle'] = txt.rsvp.subtitle;
  if (txt.rsvp?.heading !== undefined) bindings['rsvp-heading'] = txt.rsvp.heading;
  if (txt.rsvp?.buttonText !== undefined) bindings['rsvp-btn-text'] = txt.rsvp.buttonText;
  if (txt.rsvp && txt.rsvp.prompt !== undefined) {
    if (txt.rsvp.prompt && String(txt.rsvp.prompt).trim()) {
      const deadlineStr = formatRsvpDeadline(weddingDate, cfg.rsvpDaysBefore);
      bindings['rsvp-deadline-text'] = txt.rsvp.prompt.replace('{date}', deadlineStr);
    } else {
      bindings['rsvp-deadline-text'] = '';
    }
  }

  // Khung 1: Họ và tên
  if (txt.rsvp?.nameField?.label !== undefined) bindings['rsvp-name-label'] = txt.rsvp.nameField.label;
  if (txt.rsvp?.nameField?.placeholder !== undefined) bindings['rsvp-name-placeholder'] = txt.rsvp.nameField.placeholder;

  // Khung 2: Bạn sẽ tham dự? (Có / Không)
  if (txt.rsvp?.attendanceField?.label !== undefined) bindings['rsvp-attendance-label'] = txt.rsvp.attendanceField.label;
  if (txt.rsvp?.attendanceField?.yesOption !== undefined) bindings['rsvp-attendance-yes'] = txt.rsvp.attendanceField.yesOption;
  if (txt.rsvp?.attendanceField?.noOption !== undefined) bindings['rsvp-attendance-no'] = txt.rsvp.attendanceField.noOption;

  // Khung 3: Khách của ai? (Cô dâu / Chú rể)
  if (txt.rsvp?.guestOfField?.label !== undefined) bindings['rsvp-guestof-label'] = txt.rsvp.guestOfField.label;
  if (txt.rsvp?.guestOfField?.brideOption !== undefined) bindings['rsvp-guestof-bride'] = txt.rsvp.guestOfField.brideOption;
  if (txt.rsvp?.guestOfField?.groomOption !== undefined) bindings['rsvp-guestof-groom'] = txt.rsvp.guestOfField.groomOption;

  // Khung 4: Số người đi cùng
  if (txt.rsvp?.accompanyField?.label !== undefined) bindings['rsvp-accompany-label'] = txt.rsvp.accompanyField.label;

  // Khung 5: Lời nhắn
  if (txt.rsvp?.messageField?.label !== undefined) bindings['rsvp-message-label'] = txt.rsvp.messageField.label;
  if (txt.rsvp?.messageField?.placeholder !== undefined) bindings['rsvp-message-placeholder'] = txt.rsvp.messageField.placeholder;

  if (txt.gift?.subtitle !== undefined) bindings['gift-subtitle'] = txt.gift.subtitle;
  if (txt.gift?.heading !== undefined) bindings['gift-heading'] = txt.gift.heading;
  if (txt.gift?.envelopeNote !== undefined) bindings['gift-envelope-note'] = txt.gift.envelopeNote;
  if (txt.gift?.qrInstruction !== undefined) bindings['gift-qr-instruction'] = txt.gift.qrInstruction;

  if (txt.footer?.thankYou !== undefined) bindings['footer-thankyou'] = txt.footer.thankYou;
  if (txt.footer?.credit !== undefined) bindings['footer-credit'] = txt.footer.credit;

  // Cấu hình màn hình mở đầu (Opening Screen)
  if (cfg.openingScreen?.title !== undefined) bindings['opening-title'] = cfg.openingScreen.title;
  if (cfg.openingScreen?.subtitle !== undefined) bindings['opening-subtitle'] = cfg.openingScreen.subtitle;
  if (cfg.openingScreen?.buttonText !== undefined) bindings['opening-button-text'] = cfg.openingScreen.buttonText;
  if (cfg.openingScreen?.hintText !== undefined) bindings['opening-hint-text'] = cfg.openingScreen.hintText;

  // Cấu hình tất cả hình ảnh trên website (Image Bindings)
  const imgCfg = cfg.images || {};

  const heroImg = document.querySelector('[data-img-bind="hero"]');
  if (heroImg && imgCfg.hero) heroImg.src = imgCfg.hero;

  const groomImg = document.querySelector('[data-img-bind="groom"]');
  if (groomImg && (imgCfg.groom || cfg.groom?.image)) groomImg.src = imgCfg.groom || cfg.groom.image;

  const brideImg = document.querySelector('[data-img-bind="bride"]');
  if (brideImg && (imgCfg.bride || cfg.bride?.image)) brideImg.src = imgCfg.bride || cfg.bride.image;

  const countdownImg = document.querySelector('[data-img-bind="countdown"]');
  if (countdownImg && (imgCfg.countdown || cfg.countdown?.backgroundImage)) {
    countdownImg.src = imgCfg.countdown || cfg.countdown.backgroundImage;
  }

  const chibiEl = document.getElementById('opening-chibi-img') || document.querySelector('[data-img-bind="opening-chibi"]');
  if (chibiEl && (imgCfg.openingChibi || cfg.openingScreen?.coupleImage)) {
    chibiEl.src = imgCfg.openingChibi || cfg.openingScreen.coupleImage;
  }

  const bankGroom = cfg.bankAccount?.groom || cfg.bankAccount || {};
  const bankBride = cfg.bankAccount?.bride || {};

  const qrGroomImg = document.querySelector('[data-img-bind="bank-qr-groom"]') || document.querySelector('[data-img-bind="bank-qr"]');
  if (qrGroomImg) {
    const groomQrSrc = imgCfg.bankQrGroom || bankGroom.qrCodeUrl || imgCfg.bankQr || 'images/qr LEDANGTHINH.jpg';
    qrGroomImg.src = groomQrSrc;
    qrGroomImg.setAttribute('src', groomQrSrc);
  }

  const qrBrideImg = document.querySelector('[data-img-bind="bank-qr-bride"]');
  if (qrBrideImg) {
    const brideQrSrc = imgCfg.bankQrBride || bankBride.qrCodeUrl || 'images/qr LEDANGTHINH.jpg';
    qrBrideImg.src = brideQrSrc;
    qrBrideImg.setAttribute('src', brideQrSrc);
  }

  const copyGroomBtn = document.getElementById('copy-bank-groom-btn') || document.getElementById('copy-bank-btn');
  if (copyGroomBtn) {
    copyGroomBtn.setAttribute('data-account', (bankGroom.accountNumber || '8823968172').replace(/\s+/g, ''));
  }
  const copyBrideBtn = document.getElementById('copy-bank-bride-btn');
  if (copyBrideBtn) {
    copyBrideBtn.setAttribute('data-account', (bankBride.accountNumber || '8823968172').replace(/\s+/g, ''));
  }

  if (Array.isArray(imgCfg.gallery)) {
    imgCfg.gallery.forEach((src, idx) => {
      const gImg = document.querySelector(`[data-img-bind="gallery-${idx}"]`);
      if (gImg && src) gImg.src = src;
    });
  }

  // Render các mốc Chuyện tình yêu linh hoạt nếu có cấu hình
  if (txt.story?.milestones && Array.isArray(txt.story.milestones) && txt.story.milestones.length > 0) {
    const timelineContainer = document.querySelector('.v-timeline-line')?.parentElement;
    if (timelineContainer) {
      const itemsHtml = txt.story.milestones.map((m) => {
        const timeStr = m.time || formatMonthYear(weddingDate);
        return `
        <div class="flex gap-4">
          <div class="v-timeline-dot"></div>
          <div>
            <p class="font-sans text-rose text-[10px] tracking-[0.2em] uppercase font-semibold">${timeStr}</p>
            <h3 class="font-display text-base text-dark mt-0.5 font-medium">${m.title}</h3>
            <p class="font-sans text-muted text-xs leading-relaxed mt-1">${m.description}</p>
          </div>
        </div>`;
      }).join('');
      timelineContainer.innerHTML = `<div class="v-timeline-line"></div>${itemsHtml}`;
    }
  }

  // Apply text/HTML bindings
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const key = el.getAttribute('data-bind');
    const val = bindings[key];

    if (val !== undefined && val !== null) {
      if (String(val).trim() !== '') {
        if (el.style) el.style.display = '';
        const isHtmlContent = key.includes('address') || key === 'invitation-venue' || key === 'poem-text' || key === 'quote-text' || key === 'couple-names-invite' || key === 'couple-footer' || String(val).includes('<br>') || String(val).includes('<span') || String(val).includes('<br/>');
        if (isHtmlContent) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      } else {
        // Nếu trường được cấu hình rõ ràng là rỗng "" -> Xóa nội dung trong DOM để không bị lưu đè text mặc định
        el.textContent = '';
        // Riêng các trường bố mẹ: không dùng display: none để giữ nguyên cấu trúc hàng ngang cân xứng
        const isParentField = ['groom-father', 'groom-mother', 'bride-father', 'bride-mother'].includes(key);
        if (el.style && !isParentField) {
          el.style.display = 'none';
        } else if (el.style && isParentField) {
          el.style.display = '';
        }
      }
    }
  });

  // Apply placeholder bindings
  document.querySelectorAll('[data-bind-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-bind-placeholder');
    const val = bindings[key];
    if (val !== undefined && val !== null) {
      el.placeholder = val;
    }
  });

  // Xử lý ẩn/hiện hàng Bố - Mẹ chuẩn xác (luôn cùng hàng)
  const hasGroomFather = Boolean(cfg.groom?.father && cfg.groom.father.trim());
  const hasBrideFather = Boolean(cfg.bride?.father && cfg.bride.father.trim());
  const hasGroomMother = Boolean(cfg.groom?.mother && cfg.groom.mother.trim());
  const hasBrideMother = Boolean(cfg.bride?.mother && cfg.bride.mother.trim());

  const hasAnyFather = hasGroomFather || hasBrideFather;
  const hasAnyMother = hasGroomMother || hasBrideMother;
  const hasAnyParents = hasAnyFather || hasAnyMother;

  const rowFathers = document.querySelector('.parents-row-fathers');
  const rowMothers = document.querySelector('.parents-row-mothers');
  const parentsContainer = document.querySelector('.parents-container');

  if (rowFathers) rowFathers.style.display = hasAnyFather ? '' : 'none';
  if (rowMothers) rowMothers.style.display = hasAnyMother ? '' : 'none';
  if (parentsContainer) parentsContainer.style.display = hasAnyParents ? '' : 'none';

  // Special attribute bindings (QR & Bank)
  if (cfg.bankAccount) {
    const qrImg = document.querySelector('[data-bind-src="bank-qr-img"]');
    if (qrImg) {
      if (cfg.bankAccount.qrCodeUrl && cfg.bankAccount.qrCodeUrl.trim() !== '') {
        qrImg.src = cfg.bankAccount.qrCodeUrl;
      } else if (cfg.bankAccount.accountNumber && cfg.bankAccount.bankName) {
        const cleanAcc = cfg.bankAccount.accountNumber.replace(/\s+/g, '');
        const bankName = encodeURIComponent(cfg.bankAccount.bankName.trim());
        const holder = encodeURIComponent(cfg.bankAccount.accountHolder || '');
        qrImg.src = `https://img.vietqr.io/image/${bankName}-${cleanAcc}-qr_only.png?accountName=${holder}&addInfo=Mung%20cuoi`;
      }
    }
    if (cfg.bankAccount.accountNumber) {
      const copyBtn = document.getElementById('copy-bank-btn');
      if (copyBtn) copyBtn.setAttribute('data-account', cfg.bankAccount.accountNumber.replace(/\s+/g, ''));
    }
  }

  // =========================================================================
  // 5. TỰ ĐỘNG ẨN / HIỆN CÁC KHU VỰC DỰA TRÊN NỘI DUNG (GIỐNG TÊN FATHER)
  // Quy tắc: Có chữ -> Hiện. Để trống "" hoặc xóa sạch chữ -> Tự ẩn biến mất!
  // =========================================================================
  function hasText(val) {
    if (val === undefined || val === null || val === false) return false;
    return String(val).trim().length > 0;
  }

  function setSectionVisible(selectorOrEl, isVisible) {
    const el = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (el) {
      el.style.display = isVisible ? '' : 'none';
    }
  }

  // [1] Bài Thơ / Lời Ngỏ (Section 3): Xóa chữ -> Tự ẩn hoàn toàn
  setSectionVisible('#section-poem', hasText(txt.poem));

  // [2] Trích Dẫn Ý Nghĩa (Section 5): Xóa chữ -> Tự ẩn hoàn toàn
  setSectionVisible('#section-quote', hasText(txt.quote?.text));

  // [3] Sự Kiện Cưới (Section 9):
  // - Sự kiện 1 (Lễ Vu Quy): Nếu để trống tiêu đề hoặc không nhập chữ -> ẩn cột này
  const cerData = cfg.venues?.ceremony || cfg.events?.ceremony;
  const hasCeremony = Boolean(cerData && (hasText(cerData.title) || hasText(cerData.locationName) || hasText(cerData.address)));

  // - Sự kiện 2 (Tiệc Cưới): Nếu để trống tiêu đề hoặc không nhập chữ -> ẩn cột này
  const recData = cfg.venues?.reception || cfg.events?.reception;
  const hasReception = Boolean(recData && (hasText(recData.title) || hasText(recData.locationName) || hasText(recData.address)));

  const cerItem = document.getElementById('event-ceremony-item');
  const recItem = document.getElementById('event-reception-item');
  const eventsSection = document.getElementById('events-section');
  const timelineEl = document.querySelector('.h-timeline');
  const eventsNavBtn = document.querySelector('a[href="#events-section"]');

  if (cerItem) cerItem.style.display = hasCeremony ? '' : 'none';
  if (recItem) recItem.style.display = hasReception ? '' : 'none';

  if (timelineEl) {
    const visibleEventsCount = (hasCeremony ? 1 : 0) + (hasReception ? 1 : 0);
    if (visibleEventsCount === 1) {
      timelineEl.classList.add('single-item');
    } else {
      timelineEl.classList.remove('single-item');
    }
  }

  // Nếu xóa sạch cả 2 sự kiện -> Ẩn toàn bộ mục sự kiện & nút bản đồ nổi
  const hasAnyEvent = hasCeremony || hasReception;
  if (eventsSection) eventsSection.style.display = hasAnyEvent ? '' : 'none';
  if (eventsNavBtn) eventsNavBtn.style.display = hasAnyEvent ? '' : 'none';

  // [4] Quy Định Trang Phục Dress Code (Section 10): Xóa tiêu đề hoặc ghi chú -> Tự ẩn
  const hasDressCode = hasText(txt.dressCode?.heading) || hasText(txt.dressCode?.note);
  setSectionVisible('#section-dresscode', hasDressCode);

  // [5] Chuyện Tình Yêu (Section 7): Xóa tiêu đề hoặc mốc thời gian -> Tự ẩn
  const hasStory = hasText(txt.story?.heading) && (!Array.isArray(txt.story?.milestones) || txt.story.milestones.length > 0);
  setSectionVisible('#section-story', hasStory);

  // [6] Đồng Hồ Đếm Ngược (Section 8): Xóa tiêu đề hoặc rỗng ngày giờ -> Tự ẩn
  const hasCountdown = hasText(txt.countdown?.heading) && hasText(cfg.weddingDate);
  setSectionVisible('#section-countdown', hasCountdown);

  // [7] Form Xác Nhận Tham Dự (Section 11 - RSVP): Xóa tiêu đề -> Tự ẩn form & nút nổi
  const hasRsvp = hasText(txt.rsvp?.heading);
  setSectionVisible('#rsvp-section', hasRsvp);
  const rsvpNavBtn = document.querySelector('a[href="#rsvp-section"]');
  if (rsvpNavBtn) rsvpNavBtn.style.display = hasRsvp ? '' : 'none';

  // Tự động ẩn / hiện từng khung con trong form RSVP nếu để trống nhãn ""
  function configureFieldGroup(groupId, isVisible, inputsToToggleRequired = []) {
    const groupEl = document.getElementById(groupId);
    if (groupEl) {
      groupEl.style.display = isVisible ? '' : 'none';
      if (!isVisible) {
        inputsToToggleRequired.forEach((inputEl) => {
          if (inputEl) inputEl.required = false;
        });
      }
    }
  }

  // Khung 1: Họ và tên (để label: "" sẽ ẩn toàn bộ khung họ tên)
  const hasNameField = txt.rsvp?.nameField !== undefined ? hasText(txt.rsvp.nameField?.label) : true;
  const nameInput = document.querySelector('#rsvp-name-group input[name="name"]');
  configureFieldGroup('rsvp-name-group', hasNameField, [nameInput]);
  if (nameInput && txt.rsvp?.nameField?.defaultValue && !nameInput.value) {
    nameInput.value = txt.rsvp.nameField.defaultValue;
  }

  // Khung 2: Bạn sẽ tham dự? (Lựa chọn Có / Không)
  const attendanceLabel = document.querySelector('[data-bind="rsvp-attendance-label"]');
  const hasAttendanceLabel = txt.rsvp?.attendanceField !== undefined ? hasText(txt.rsvp.attendanceField?.label) : false;
  if (attendanceLabel) {
    attendanceLabel.style.display = hasAttendanceLabel ? '' : 'none';
  }
  const hasAttendanceField = txt.rsvp?.attendanceField?.enabled !== false;
  const decisionInputs = document.querySelectorAll('#rsvp-attendance-group input[name="decision"]');
  configureFieldGroup('rsvp-attendance-group', hasAttendanceField, decisionInputs);

  // Khung 3: Khách của ai? (để label: "" sẽ ẩn toàn bộ khung chọn Cô dâu/Chú rể)
  const hasGuestOfField = txt.rsvp?.guestOfField !== undefined ? hasText(txt.rsvp.guestOfField?.label) : true;
  const guestOfInputs = document.querySelectorAll('#rsvp-guestof-group input[name="guest_of"]');
  configureFieldGroup('rsvp-guestof-group', hasGuestOfField, guestOfInputs);

  // Khung 4: Số người đi cùng (để label: "" sẽ ẩn toàn bộ khung chọn số người)
  const hasAccompanyField = txt.rsvp?.accompanyField !== undefined ? hasText(txt.rsvp.accompanyField?.label) : true;
  configureFieldGroup('rsvp-accompany-group', hasAccompanyField);

  // Khung 5: Lời nhắn gửi (để label: "" sẽ ẩn toàn bộ khung nhập lời nhắn)
  const hasMessageField = txt.rsvp?.messageField !== undefined ? hasText(txt.rsvp.messageField?.label) : true;
  configureFieldGroup('rsvp-message-group', hasMessageField);

  // [8] Hộp Mừng Cưới & QR Code (Section 12 - Gift): Xóa số tài khoản hoặc tiêu đề -> Tự ẩn
  const hasGift = hasText(cfg.bankAccount?.accountNumber) && hasText(txt.gift?.heading);
  setSectionVisible('#section-gift', hasGift);

  // [9] Album Ảnh Cưới (Section 6): Xóa tiêu đề -> Tự ẩn
  setSectionVisible('#section-gallery', hasText(txt.gallery?.heading));
}

/* =====================================================
   0.1. Live Cloud Data Fetch (Tự động nạp cấu hình mới nhất từ GitHub)
   ===================================================== */
async function fetchLatestCloudConfig() {
  try {
    const ghRepo = 'Mr2D-lab/Thiep_cuoi_THINH_HOAN';
    const apiUrl = `https://api.github.com/repos/${ghRepo}/contents/config.js?ref=main`;

    const res = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github+json'
      }
    });

    if (!res.ok) return;

    const data = await res.json();
    if (!data.content) return;

    // Lưu SHA vào sessionStorage để khi admin bấm Lưu không cần gọi GET lần đầu (Tối ưu 3)
    if (data.sha) {
      sessionStorage.setItem('wedding_config_sha', data.sha);
    }

    // Giải mã Base64 UTF-8 an toàn
    const binary = atob(data.content.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const code = new TextDecoder('utf-8').decode(bytes);

    // Chạy trong môi trường sandbox tạm thời để trích xuất WEDDING_CONFIG mới
    let cloudConfig = null;
    try {
      const sandboxFn = new Function(code + '; return typeof WEDDING_CONFIG !== "undefined" ? WEDDING_CONFIG : null;');
      cloudConfig = sandboxFn();
    } catch (parseErr) {
      console.warn('Lỗi phân tích cú pháp cloud config:', parseErr);
    }

    if (!cloudConfig || typeof cloudConfig !== 'object') return;

    // Kiểm tra xem máy admin có draft đang chỉnh sửa chưa lưu không
    const localDraft = localStorage.getItem('wedding_config_local_draft');
    if (localDraft && window.location.hash.toLowerCase().includes('admin')) {
      return; // Không ghi đè khi admin đang mở trang với draft
    }

    // So sánh nếu có thay đổi với window.WEDDING_CONFIG hiện tại
    const currentJson = JSON.stringify(window.WEDDING_CONFIG || {});
    const cloudJson = JSON.stringify(cloudConfig);
    if (currentJson !== cloudJson) {
      window.WEDDING_CONFIG = cloudConfig;
      applyWeddingConfig();
      initCountdown();
      console.log('⚡ Đã cập nhật cấu hình mới nhất từ đám mây (Live Cloud Sync)');
    }
  } catch (err) {
    console.debug('Cloud config background fetch notice:', err.message);
  }
}

/* =====================================================
   1. Falling Cherry Blossom Petals
   ===================================================== */
function initBlossomCanvas() {
  const canvas = document.getElementById('blossom-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const petals = [];
  const petalCount = Math.min(26, Math.floor(window.innerWidth / 30));

  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = Math.random() * 8 + 6;
      this.speedX = Math.random() * 1.5 - 0.75;
      this.speedY = Math.random() * 0.9 + 0.6;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 1.2;
      this.opacity = Math.random() * 0.4 + 0.35;
      this.sway = Math.random() * Math.PI * 2;
      this.swaySpeed = Math.random() * 0.02 + 0.01;
      // Soft rose & cherry blossom colors
      const colors = [
        'rgba(244, 196, 202, ',
        'rgba(235, 178, 186, ',
        'rgba(248, 222, 226, ',
        'rgba(224, 160, 169, '
      ];
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.sway += this.swaySpeed;
      this.x += this.speedX + Math.sin(this.sway) * 0.8;
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;

      if (this.y > height + 20 || this.x < -30 || this.x > width + 30) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = `${this.colorBase}${this.opacity})`;
      ctx.beginPath();
      // Draw organic petal shape
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, 0, this.size, this.size / 2);
      ctx.bezierCurveTo(this.size, this.size, this.size / 2, this.size * 1.2, 0, this.size);
      ctx.bezierCurveTo(-this.size / 2, this.size * 1.2, -this.size, this.size, -this.size, this.size / 2);
      ctx.bezierCurveTo(-this.size, 0, -this.size / 2, -this.size / 2, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < petalCount; i++) {
    petals.push(new Petal());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    petals.forEach((petal) => {
      petal.update();
      petal.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
}

/* =====================================================
   2. Live Wedding Countdown
   ===================================================== */
function initCountdown() {
  function parseDateTime(dateStr, timeStr) {
    if (!dateStr) return null;
    const dateParts = dateStr.split('-');
    const timeParts = (timeStr || '17:30').split(':');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const hour = parseInt(timeParts[0] || '17', 10);
      const min = parseInt(timeParts[1] || '30', 10);
      return new Date(year, month, day, hour, min, 0).getTime();
    }
    return new Date(`${dateStr}T${timeStr || '17:30'}:00`).getTime();
  }

  let targetTime;
  if (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.weddingDate) {
    const timeStr = WEDDING_CONFIG.weddingTime || '17:30';
    targetTime = parseDateTime(WEDDING_CONFIG.weddingDate, timeStr);
  } else {
    const targetDateEl = document.getElementById('vs-start-time');
    if (!targetDateEl) return;
    targetTime = new Date(targetDateEl.textContent.trim()).getTime();
  }

  const daysEl = document.querySelector('.vs-time-days');
  const hoursEl = document.querySelector('.vs-time-hours');
  const minutesEl = document.querySelector('.vs-time-minutes');
  const secondsEl = document.querySelector('.vs-time-seconds');

  if (window._weddingCountdownInterval) {
    clearInterval(window._weddingCountdownInterval);
    window._weddingCountdownInterval = null;
  }

  function updateTimer() {
    const now = Date.now();
    const diff = targetTime - now;

    // Khi đã đến hoặc qua ngày cưới: dừng ở 00:00:00:00, không đếm tiến
    if (!targetTime || isNaN(diff) || diff <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minutesEl) minutesEl.textContent = '00';
      if (secondsEl) secondsEl.textContent = '00';
      if (window._weddingCountdownInterval) {
        clearInterval(window._weddingCountdownInterval);
        window._weddingCountdownInterval = null;
      }
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  window._weddingCountdownInterval = setInterval(updateTimer, 1000);
}

/* =====================================================
   3. Music Player (Phát file nhạc đã chọn hoặc im lặng nếu chưa chọn)
   ===================================================== */
function initMusicPlayer() {
  const musicBtn = document.getElementById('music-control');
  if (!musicBtn) return;

  const audioUrl = window.WEDDING_CONFIG && window.WEDDING_CONFIG.music && window.WEDDING_CONFIG.music.audioUrl 
    ? window.WEDDING_CONFIG.music.audioUrl.trim() 
    : '';

  // Nếu không có file nhạc: Ẩn nút nhạc và không phát bất kỳ âm thanh nào
  if (!audioUrl) {
    musicBtn.style.display = 'none';
    return;
  }

  musicBtn.style.display = 'flex';
  let isPlaying = false;
  const audio = new Audio(audioUrl);
  audio.loop = true;

  // Kiểm tra xem có đang ở chế độ chỉnh sửa / admin hay không
  function isEditingMode() {
    return document.body.classList.contains('admin-mode-active')
      || window.location.hash === '#admin'
      || sessionStorage.getItem('wedding_admin_auth') === 'true';
  }

  audio.addEventListener('error', (e) => {
    console.warn('Không thể tải file âm thanh:', e);
    musicBtn.classList.remove('is-playing');
    isPlaying = false;
  });

  function toggleMusic(forcePlay = null) {
    // Nếu đang ở chế độ chỉnh sửa: Tuyệt đối không bật nhạc, dừng ngay lập tức
    if (isEditingMode()) {
      audio.pause();
      isPlaying = false;
      musicBtn.classList.remove('is-playing');
      return;
    }

    const shouldPlay = forcePlay !== null ? forcePlay : !isPlaying;
    if (shouldPlay) {
      audio.play().then(() => {
        isPlaying = true;
        musicBtn.classList.add('is-playing');
        showToast('Đang phát nhạc nền ♪');
      }).catch((err) => {
        console.warn('Lỗi khi phát nhạc:', err);
      });
    } else {
      audio.pause();
      isPlaying = false;
      musicBtn.classList.remove('is-playing');
      showToast('Đã tạm dừng nhạc');
    }
  }

  musicBtn.addEventListener('click', () => {
    if (isEditingMode()) {
      showToast('🔇 Chế độ chỉnh sửa: Đã tắt nhạc nền');
      return;
    }
    toggleMusic();
  });

  // Tự động phát khi tương tác lần đầu với trang (chỉ phát cho khách, không phát khi đang chỉnh sửa)
  const unlockAudio = () => {
    if (isEditingMode()) return;
    if (!isPlaying) {
      toggleMusic(true);
      document.removeEventListener('click', unlockAudio);
    }
  };
  document.addEventListener('click', unlockAudio, { once: true });

  // Hàm toàn cục để các thao tác admin dừng nhạc ngay tức thì
  window.__stopWeddingMusic = () => {
    audio.pause();
    isPlaying = false;
    musicBtn.classList.remove('is-playing');
  };
}

/* =====================================================
   4. Red Envelope (Mừng Cưới) & Copy Bank Account
   ===================================================== */
function initEnvelopeGift() {
  const envelopeBtn = document.querySelector('.vs-qr-btn');
  const qrContent = document.querySelector('.vs-qr-content');
  const qrClose = document.querySelector('.vs-qr-close');
  const copyBtn = document.getElementById('copy-bank-btn');

  if (envelopeBtn && qrContent) {
    envelopeBtn.addEventListener('click', () => {
      envelopeBtn.style.display = 'none';
      qrContent.classList.remove('vs-hidden');
      qrContent.classList.add('vs-reveal');
      qrContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (qrClose && envelopeBtn && qrContent) {
    qrClose.addEventListener('click', () => {
      qrContent.classList.add('vs-hidden');
      qrContent.classList.remove('vs-reveal');
      envelopeBtn.style.display = 'block';
    });
  }

  function handleCopyAccount(btn, fallbackAcc) {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const accNum = (btn.getAttribute('data-account') || fallbackAcc || '').replace(/\s+/g, '');
      if (!accNum) return;
      navigator.clipboard.writeText(accNum).then(() => {
        showToast('✓ Đã sao chép số tài khoản: ' + accNum);
      }).catch(() => {
        showToast('Số tài khoản: ' + accNum);
      });
    });
  }

  const copyGroomBtn = document.getElementById('copy-bank-groom-btn');
  const copyBrideBtn = document.getElementById('copy-bank-bride-btn');
  const copyLegacyBtn = document.getElementById('copy-bank-btn');

  const groomAcc = typeof WEDDING_CONFIG !== 'undefined' ? (WEDDING_CONFIG.bankAccount?.groom?.accountNumber || WEDDING_CONFIG.bankAccount?.accountNumber || '') : '';
  const brideAcc = typeof WEDDING_CONFIG !== 'undefined' ? (WEDDING_CONFIG.bankAccount?.bride?.accountNumber || '') : '';

  handleCopyAccount(copyGroomBtn, groomAcc);
  handleCopyAccount(copyBrideBtn, brideAcc);
  handleCopyAccount(copyLegacyBtn, groomAcc);
}

/* =====================================================
   5. RSVP Attendance Form Handling
   ===================================================== */
function initRsvpForm() {
  const form = document.querySelector('.vs-attendance-form');
  if (!form) return;

  // Radio styling reactivity
  const radios = form.querySelectorAll('input[type="radio"]');
  radios.forEach((r) => {
    r.addEventListener('change', () => {
      form.querySelectorAll('.radio-option').forEach((opt) => {
        const input = opt.querySelector('input[type="radio"]');
        if (input && input.checked) {
          opt.classList.add('checked');
        } else {
          opt.classList.remove('checked');
        }
      });
    });
  });

  // Xử lý tùy chọn nhập số người cụ thể
  const guestsCountSelect = form.querySelector('.vs-number-of-guests');
  const customGuestsBox = form.querySelector('#rsvp-custom-guests-box');
  const customGuestsInput = form.querySelector('.vs-custom-number-of-guests');
  if (guestsCountSelect && customGuestsBox) {
    guestsCountSelect.addEventListener('change', () => {
      if (guestsCountSelect.value === 'custom') {
        customGuestsBox.style.display = 'block';
        if (customGuestsInput) {
          customGuestsInput.required = true;
          customGuestsInput.focus();
        }
      } else {
        customGuestsBox.style.display = 'none';
        if (customGuestsInput) {
          customGuestsInput.required = false;
        }
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = form.querySelector('.vs-attendance-name');
    const guestName = nameInput ? nameInput.value.trim() : 'bạn';
    const decisionInput = form.querySelector('input[name="decision"]:checked');
    const guestOfInput = form.querySelector('input[name="guest_of"]:checked');
    const messageInput = form.querySelector('.vs-attendance-message');

    let finalGuestsCount = '1 người';
    if (guestsCountSelect) {
      if (guestsCountSelect.value === 'custom' && customGuestsInput && customGuestsInput.value.trim()) {
        finalGuestsCount = `${customGuestsInput.value.trim()} người`;
      } else if (guestsCountSelect.value !== 'custom') {
        finalGuestsCount = guestsCountSelect.value;
      }
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Gửi Xác Nhận';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang gửi xác nhận...';
    }

    const payload = {
      timestamp: new Date().toLocaleString('vi-VN'),
      name: guestName || '',
      decision: decisionInput ? (decisionInput.value === 'yes' ? 'Tham dự' : 'Không tham dự') : '',
      guestOf: guestOfInput ? (guestOfInput.value === 'bride' ? 'Cô dâu' : 'Chú rể') : '',
      guestsCount: finalGuestsCount,
      message: messageInput ? messageInput.value.trim() : '',
    };

    const sheetUrl = (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.texts?.rsvp?.googleSheetUrl) || '';

    if (sheetUrl && sheetUrl.trim()) {
      try {
        await fetch(sheetUrl.trim(), {
          method: 'POST',
          mode: 'no-cors', // Sử dụng no-cors để gửi dữ liệu mượt mà tới Google Apps Script
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Lỗi khi gửi lên Google Sheet:', err);
      }
    } else {
      // Giả lập độ trễ nếu chưa gắn Google Sheet
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }

    const isYes = (!decisionInput || decisionInput.value === 'yes');
    const rsvpTexts = (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.texts?.rsvp) || {};
    const modalCfg = rsvpTexts.thankYouModal || {};

    const toastMsg = isYes
      ? (rsvpTexts.thankYouToast || modalCfg.messageYes || 'cảm ơn đã xác nhận, chúng tôi rất vui khi được đón tiếp Quý khách')
      : (modalCfg.messageNo || 'Cảm ơn đã phản hồi, hẹn gặp lại Quý khách trong dịp sớm nhất!');
    
    showToast(toastMsg);
    showThankYouModal({ isYes });

    form.reset();
    if (customGuestsBox) customGuestsBox.style.display = 'none';
    if (customGuestsInput) {
      customGuestsInput.value = '';
      customGuestsInput.required = false;
    }
    form.querySelectorAll('.radio-option').forEach((opt) => opt.classList.remove('checked'));
    // Khôi phục lựa chọn mặc định cho radio
    form.querySelectorAll('input[type="radio"][checked]').forEach((r) => {
      r.checked = true;
      r.closest('.radio-option')?.classList.add('checked');
    });
  });
}

/* =====================================================
   6. Image Lightbox
   ===================================================== */
function initLightbox() {
  const overlay = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-image');
  const closeBtn = document.getElementById('lightbox-close');

  if (!overlay || !lightboxImg) return;

  const galleryImages = document.querySelectorAll('.gallery-zoomable');
  galleryImages.forEach((img) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      if (document.body.classList.contains('admin-mode-active')) return;
      lightboxImg.src = img.getAttribute('src') || img.src;
      lightboxImg.alt = img.alt || 'Ảnh cưới';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeLightbox();
    }
  });
}

/* =====================================================
   7. Scroll Fade In Animations (Intersection Observer)
   ===================================================== */
function initAnimations() {
  const animatedElements = document.querySelectorAll('.fade-on-scroll');
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate__animated', 'animate__fadeInUp');
          entry.target.style.opacity = '1';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  animatedElements.forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

/* =====================================================
   Helper: Toast Notification (Căn giữa màn hình, đè lên trên cùng)
   ===================================================== */
function applyToastCenterStyles(toast, isShow) {
  if (!toast) return;
  if (!isShow) {
    toast.style.setProperty('display', 'none', 'important');
    toast.style.setProperty('opacity', '0', 'important');
    toast.style.setProperty('pointer-events', 'none', 'important');
    return;
  }
  toast.style.setProperty('display', 'flex', 'important');
  toast.style.setProperty('position', 'fixed', 'important');
  toast.style.setProperty('top', '50%', 'important');
  toast.style.setProperty('left', '50%', 'important');
  toast.style.setProperty('bottom', 'auto', 'important');
  toast.style.setProperty('right', 'auto', 'important');
  toast.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');
  toast.style.setProperty('z-index', '2147483647', 'important');
  toast.style.setProperty('background', 'rgba(28, 18, 22, 0.96)', 'important');
  toast.style.setProperty('color', '#FFFFFF', 'important');
  toast.style.setProperty('padding', '16px 28px', 'important');
  toast.style.setProperty('border-radius', '18px', 'important');
  toast.style.setProperty('box-shadow', '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.22)', 'important');
  toast.style.setProperty('backdrop-filter', 'blur(16px)', 'important');
  toast.style.setProperty('-webkit-backdrop-filter', 'blur(16px)', 'important');
  toast.style.setProperty('max-width', 'min(90vw, 460px)', 'important');
  toast.style.setProperty('text-align', 'center', 'important');
  toast.style.setProperty('line-height', '1.5', 'important');
  toast.style.setProperty('font-size', '14px', 'important');
  toast.style.setProperty('font-weight', '500', 'important');
  toast.style.setProperty('align-items', 'center', 'important');
  toast.style.setProperty('justify-content', 'center', 'important');
  toast.style.setProperty('opacity', '1', 'important');
  toast.style.setProperty('pointer-events', 'none', 'important');
  toast.style.setProperty('transition', 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)', 'important');
}

let toastTimeout = null;
function showToast(message) {
  let toast = document.getElementById('toast-notice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerHTML = message;
  toast.classList.add('show');
  applyToastCenterStyles(toast, true);

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    applyToastCenterStyles(toast, false);
  }, 3500);
}

/* =====================================================
   Helper: Thank-You Modal Popup (Hộp thoại cảm ơn trang trọng)
   ===================================================== */
function showThankYouModal({ isYes }) {
  const modal = document.getElementById('rsvp-thankyou-modal');
  if (!modal) return;

  const cfg = (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.texts?.rsvp) || {};
  const modalCfg = cfg.thankYouModal || {};

  if (modalCfg.enabled === false) return; // Cho phép tắt popup nếu config đặt enabled: false

  const iconEl = document.getElementById('rsvp-modal-icon');
  const titleEl = document.getElementById('rsvp-modal-title');
  const nameEl = document.getElementById('rsvp-modal-name');
  const msgEl = document.getElementById('rsvp-modal-message');
  const closeBtn = document.getElementById('rsvp-modal-close');

  if (iconEl) iconEl.textContent = isYes ? '💖' : '💌';
  if (titleEl) {
    titleEl.textContent = modalCfg.title || (isYes ? 'CẢM ƠN QUÝ KHÁCH' : 'CẢM ƠN ĐÃ PHẢN HỒI');
  }

  // Ẩn dòng tên khách theo yêu cầu: không cần cảm ơn + tên khách
  if (nameEl) {
    nameEl.style.display = 'none';
  }

  if (msgEl) {
    if (isYes) {
      msgEl.textContent = modalCfg.messageYes || cfg.thankYouToast || 'cảm ơn đã xác nhận, chúng tôi rất vui khi được đón tiếp Quý khách';
    } else {
      msgEl.textContent = modalCfg.messageNo || 'Cảm ơn đã phản hồi, hẹn gặp lại Quý khách trong dịp sớm nhất!';
    }
  }

  if (closeBtn) {
    closeBtn.textContent = modalCfg.buttonText || 'Đóng';
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');

  // Bắn pháo giấy chúc mừng nếu khách xác nhận tham dự
  if (isYes && typeof triggerConfettiBurst === 'function') {
    triggerConfettiBurst(window.innerWidth / 2, window.innerHeight / 2);
  }

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', onKeyDown);
    }
  };
  document.addEventListener('keydown', onKeyDown);
}

/* =====================================================
   Màn Hình & Hoạt Ảnh Mở Đầu Thiệp Cưới (Opening Screen)
   ===================================================== */
function initOpeningScreen() {
  const overlay = document.getElementById('opening-overlay');
  const openBtn = document.getElementById('btn-open-invitation');
  const replayBtn = document.getElementById('btn-replay-opening');
  const chibiEl = document.getElementById('opening-chibi-img');
  const musicBtn = document.getElementById('music-control');

  if (!overlay || !openBtn) return;

  const cfg = typeof WEDDING_CONFIG !== 'undefined' ? WEDDING_CONFIG : {};
  if (cfg.openingScreen?.enabled === false) {
    overlay.classList.add('is-hidden');
    if (replayBtn) replayBtn.style.display = 'none';
    return;
  }

  // Khóa cuộn trang khi thiệp chưa mở
  document.body.classList.add('opening-locked');

  let isOpening = false;

  // Hiệu ứng pháo hoa / cánh hoa bung nở khi mở thiệp
  function triggerConfettiBurst(x, y) {
    const emojis = ['🌸', '✨', '❤', '💖', '💍', '✦', '🎉', '🌸'];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'opening-confetti-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const dist = 90 + Math.random() * 180;
      const tx = Math.cos(angle) * dist + 'px';
      const ty = Math.sin(angle) * dist - (30 + Math.random() * 60) + 'px';
      const rot = (Math.random() * 720 - 360) + 'deg';
      const scale = (0.7 + Math.random() * 0.8).toFixed(2);

      p.style.setProperty('--tx', tx);
      p.style.setProperty('--ty', ty);
      p.style.setProperty('--rot', rot);
      p.style.setProperty('--scale', scale);
      p.style.left = (x || window.innerWidth / 2) + 'px';
      p.style.top = (y || window.innerHeight / 2) + 'px';

      document.body.appendChild(p);
      setTimeout(() => {
        if (p.parentNode) p.parentNode.removeChild(p);
      }, 1250);
    }
  }

  // Hàm mở thiệp & khởi động trải nghiệm
  function openInvitation() {
    if (isOpening) return;
    isOpening = true;

    // 1. Cặp đôi chibi nhún nhảy ăn mừng
    if (chibiEl) {
      chibiEl.classList.remove('chibi-celebrate');
      // Buộc reflow để kích hoạt lại hoạt ảnh
      void chibiEl.offsetWidth;
      chibiEl.classList.add('chibi-celebrate');
    }

    // 2. Bắn tung hoa giấy / trái tim lung linh
    const rect = openBtn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    triggerConfettiBurst(centerX, centerY);

    // 3. Tự động phát nhạc nền đám cưới qua cử chỉ tương tác (chỉ áp dụng cho khách, không bật khi ở chế độ sửa)
    const isEditingMode = document.body.classList.contains('admin-mode-active')
      || window.location.hash === '#admin'
      || sessionStorage.getItem('wedding_admin_auth') === 'true';

    if (!isEditingMode && musicBtn && !musicBtn.classList.contains('is-playing')) {
      try {
        musicBtn.click();
      } catch (err) {
        console.warn('Không thể tự động phát nhạc:', err);
      }
    }

    // 4. Mở rèm che điện ảnh & mở khóa cuộn trang
    setTimeout(() => {
      overlay.classList.add('is-closing');
      document.body.classList.remove('opening-locked');

      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      setTimeout(() => {
        overlay.classList.add('is-hidden');
        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        isOpening = false;
      }, 850);
    }, 650);
  }

  openBtn.addEventListener('click', openInvitation);

  // Chạm vào ảnh chibi cũng mở thiệp tạo cảm giác tương tác vui nhộn
  if (chibiEl) {
    chibiEl.addEventListener('click', openInvitation);
  }

  // Phím Enter hoặc Space để mở thiệp nếu đang xem màn hình mở đầu
  window.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-hidden') && !isOpening) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openInvitation();
      }
    }
  });

  // Nút xem lại thiệp mở đầu từ thanh tiện ích nổi
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      overlay.classList.remove('is-hidden');
      requestAnimationFrame(() => {
        overlay.classList.remove('is-closing');
        document.body.classList.add('opening-locked');
        if (chibiEl) chibiEl.classList.remove('chibi-celebrate');
        window.scrollTo({ top: 0 });
      });
    });
  }
}

/* =====================================================
   0.1 Personalized Guest Link Handler (/tên_khách)
   ===================================================== */
function initPersonalizedGuestLink() {
  let slug = '';
  
  // 1. Kiểm tra Query Parameter (?to=... hoặc ?guest=... hoặc ?u=...)
  const urlParams = new URLSearchParams(window.location.search);
  const paramVal = urlParams.get('to') || urlParams.get('guest') || urlParams.get('u');
  if (paramVal) {
    slug = paramVal.trim();
  }

  // 2. Kiểm tra Hash (ví dụ: #/Thiep_cuoi_gui_chi_lan)
  if (!slug && window.location.hash) {
    const hashVal = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (hashVal && hashVal !== 'admin' && !hashVal.startsWith('admin_') && hashVal !== 'github') {
      slug = window.location.hash.replace(/^#\/?/, '').trim();
    }
  }

  // 3. Kiểm tra Pathname (CHỈ khi chạy qua http: hoặc https:, TUYỆT ĐỐI KHÔNG đọc khi mở file:/// cục bộ)
  if (!slug && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = decodeURIComponent(segments[segments.length - 1]).trim();
      const hasFileExt = /\.[a-z0-9]{2,5}$/i.test(lastSegment);
      const isSystemPath = hasFileExt || lastSegment.includes(':') || lastSegment.toLowerCase() === 'admin' || lastSegment.toLowerCase() === 'github';
      
      if (!isSystemPath) {
        let isKnownGuest = false;
        try {
          const guestList = JSON.parse(localStorage.getItem('wedding_guest_list') || '[]');
          isKnownGuest = guestList.some(g => {
            const gSlug = (g.slug || '').replace(/^\/+|\/+$/g, '').toLowerCase();
            const curSlug = lastSegment.toLowerCase();
            return gSlug === curSlug || gSlug === curSlug.replace(/^thiep_cuoi_gui_/, '');
          });
        } catch (e) {}

        const startsWithThiep = /^thiep(_cuoi)?(_gui)?_/i.test(lastSegment);

        if (isKnownGuest || startsWithThiep || segments.length === 1) {
          slug = lastSegment;
        }
      }
    }
  }

  // Nếu không có slug hợp lệ thì dừng lại, giữ nguyên nội dung mặc định của thiệp
  if (!slug) {
    applyQrGuestVisibility('');
    return;
  }

  // Lọc an toàn: nếu slug là tên file html hoặc đường dẫn ổ đĩa thì bỏ qua ngay
  if (/\.(html|htm|php|js|css|json)$/i.test(slug) || slug.includes(':') || slug.includes('/')) {
    applyQrGuestVisibility('');
    return;
  }

  let matchedGuest = null;
  try {
    const guestList = JSON.parse(localStorage.getItem('wedding_guest_list') || '[]');
    matchedGuest = guestList.find(g => {
      const gSlug = (g.slug || '').replace(/^\/+|\/+$/g, '').toLowerCase();
      const currentSlug = slug.toLowerCase();
      return gSlug === currentSlug || gSlug === currentSlug.replace(/^thiep_cuoi_gui_/, '');
    });
  } catch (e) {}

  let displayName = '';
  let fullName = '';
  let guestOf = '';

  if (matchedGuest) {
    displayName = matchedGuest.displayName || '';
    fullName = matchedGuest.fullName || displayName;
    guestOf = matchedGuest.guestOf || '';
  } else {
    let raw = decodeURIComponent(slug);
    raw = raw.replace(/^thiep_cuoi_gui_/i, '').replace(/^thiep_cuoi_/i, '').replace(/^thiep_/i, '');
    raw = raw.replace(/[_-]+/g, ' ').trim();
    displayName = raw.replace(/\b\w/g, l => l.toUpperCase());
    fullName = displayName;
  }

  if (!displayName) {
    applyQrGuestVisibility('');
    return;
  }

  // 1. Màn hình mở đầu
  const openingSub = document.querySelector('[data-bind="opening-subtitle"]');
  if (openingSub) {
    openingSub.textContent = `Trân trọng kính mời: ${displayName}`;
  }

  // 2. Thiệp mời chính
  const inviteGuest = document.querySelector('[data-bind="invitation-guest-label"]');
  if (inviteGuest) {
    inviteGuest.textContent = `${displayName} cùng gia đình`;
  }

  // 3. Form RSVP họ tên
  const rsvpNameInput = document.querySelector('.vs-attendance-name');
  if (rsvpNameInput) {
    rsvpNameInput.value = fullName || displayName;
  }

  // 4. Form RSVP: Tự động tick chọn Cô dâu / Chú rể
  if (guestOf) {
    const radio = document.querySelector(`input[name="guest_of"][value="${guestOf}"]`);
    if (radio) {
      radio.checked = true;
      document.querySelectorAll('input[name="guest_of"]').forEach(r => {
        const opt = r.closest('.radio-option');
        if (opt) {
          if (r.checked) opt.classList.add('checked');
          else opt.classList.remove('checked');
        }
      });
    }
  }

  // 5. Điều hướng hiển thị thông tin QR Mừng Cưới theo đối tượng khách
  window._currentGuestOf = guestOf || '';
  applyQrGuestVisibility(guestOf);
}

/**
 * Điều hướng hiển thị thông tin QR Mừng Cưới theo đối tượng khách:
 * - 'groom': chỉ hiển thị thẻ tài khoản & QR Chú rể
 * - 'bride': chỉ hiển thị thẻ tài khoản & QR Cô dâu
 * - rỗng / admin: hiển thị cả 2 thẻ tài khoản & QR Chú rể và Cô dâu
 */
function applyQrGuestVisibility(guestOf) {
  const cardGroom = document.getElementById('bank-card-groom');
  const cardBride = document.getElementById('bank-card-bride');
  const grid = document.getElementById('bank-cards-grid');
  if (!cardGroom || !cardBride) return;

  // Nếu đang ở Chế độ Nhà phát triển (#admin), luôn hiển thị cả 2 thẻ để chỉnh sửa
  if (document.body.classList.contains('admin-mode-active')) {
    cardGroom.style.display = '';
    cardBride.style.display = '';
    if (grid) grid.style.gridTemplateColumns = '';
    return;
  }

  const normalized = (guestOf || '').trim().toLowerCase();
  if (normalized === 'groom') {
    cardGroom.style.display = '';
    cardBride.style.display = 'none';
    if (grid) grid.style.gridTemplateColumns = '1fr';
  } else if (normalized === 'bride') {
    cardGroom.style.display = 'none';
    cardBride.style.display = '';
    if (grid) grid.style.gridTemplateColumns = '1fr';
  } else {
    // Không xác định (link gốc): hiển thị cả 2 thẻ
    cardGroom.style.display = '';
    cardBride.style.display = '';
    if (grid) grid.style.gridTemplateColumns = '';
  }
}

/* =====================================================
   VISUAL ADMIN / DEVELOPER MODE MODULE (#admin)
   ===================================================== */
function initVisualAdminModule() {
  // Danh sách trường tự động sinh (không cho phép nhập con trỏ chuột)
  const AUTO_GENERATED_BINDS = [
    'couple-names-invite',
    'couple-footer',
    'wedding-date-dots',
    'wedding-date-full',
    'countdown-days-label',
    'countdown-hours-label',
    'countdown-minutes-label',
    'countdown-seconds-label',
    'event-ceremony-date',
    'event-reception-date'
  ];

  // Bảng placeholder cho các trường rỗng khi bật Admin Mode
  const EMPTY_FIELD_PLACEHOLDERS = {
    'groom-father': 'Bố Chú Rể',
    'groom-mother': 'Mẹ Chú Rể',
    'groom-address': 'Địa chỉ Nhà Trai',
    'bride-father': 'Bố Cô Dâu',
    'bride-mother': 'Mẹ Cô Dâu',
    'bride-address': 'Địa chỉ Nhà Gái',
    'footer-thankyou': 'Lời cảm ơn chân trang',
    'rsvp-subtitle': 'PHẢN HỒI THAM DỰ',
    'rsvp-heading': 'Xác Nhận Tham Dự',
    'rsvp-deadline-text': 'Xin vui lòng xác nhận trước ngày...',
    'rsvp-attendance-label': 'Tiêu đề xác nhận tham gia',
    'rsvp-guestof-label': 'Tiêu đề khách của ai',
    'bank-groom-account-holder': 'Tên chủ TK Chú Rể',
    'bank-groom-name': 'Ngân hàng Chú Rể',
    'bank-groom-account-number': 'Số tài khoản Chú Rể',
    'bank-bride-account-holder': 'Tên chủ TK Cô Dâu',
    'bank-bride-name': 'Ngân hàng Cô Dâu',
    'bank-bride-account-number': 'Số tài khoản Cô Dâu'
  };

  const loginModal = document.getElementById('admin-login-modal');
  const loginForm = document.getElementById('admin-login-form');
  const pwdInput = document.getElementById('admin-password-input');
  const trapInput = document.getElementById('admin-trap-field');
  const errorEl = document.getElementById('admin-login-error');
  const cancelBtn = document.getElementById('admin-login-cancel');
  const lockoutBanner = document.getElementById('admin-lockout-banner');
  const lockoutMsg = document.getElementById('admin-lockout-msg');
  const lockoutTimer = document.getElementById('admin-lockout-timer');
  const submitBtn = document.getElementById('admin-login-submit');
  const pwdGroup = document.getElementById('admin-password-group');

  const toolbar = document.getElementById('admin-toolbar');
  const btnSave = document.getElementById('admin-btn-save');
  const btnGithub = document.getElementById('admin-btn-github');
  const btnDownload = document.getElementById('admin-btn-download');
  const btnExit = document.getElementById('admin-btn-exit');

  const ghModal = document.getElementById('admin-github-modal');
  const ghRepoInput = document.getElementById('admin-gh-repo');
  const ghTokenInput = document.getElementById('admin-gh-token');
  const ghBranchInput = document.getElementById('admin-gh-branch');
  const ghSaveBtn = document.getElementById('admin-gh-save');
  const ghCloseBtn = document.getElementById('admin-gh-close');
  const ghTestBtn = document.getElementById('admin-gh-test');
  const ghTokenToggleBtn = document.getElementById('admin-gh-token-toggle');
  const ghEncryptSyncCheckbox = document.getElementById('admin-gh-encrypt-sync');
  const ghStatusBadge = document.getElementById('admin-gh-status-badge');
  const ghTestAlert = document.getElementById('admin-gh-test-alert');

  const imgModal = document.getElementById('admin-image-modal');
  const imgPreview = document.getElementById('admin-image-preview');
  const imgFileInput = document.getElementById('admin-image-file');
  const imgUrlInput = document.getElementById('admin-image-url');
  const imgApplyBtn = document.getElementById('admin-image-apply');
  const imgCloseBtn = document.getElementById('admin-image-close');

  let activeImgTarget = null;
  let countdownTimerId = null;

  // SHA-256 hash của mật khẩu mặc định 'hoanthinh2026'
  const DEFAULT_PWD_HASH = 'c1c599c19243acfbbc89730b5551795c22cbbdd8d67f7321a6e0b39bb566f28d';

  // 1. Kiểm tra trạng thái khóa (Chống F5)
  function checkLockoutStatus() {
    const lockUntil = parseInt(localStorage.getItem('admin_lock_until') || '0', 10);
    const now = Date.now();
    if (now < lockUntil) {
      applyLockoutUI(lockUntil);
      return true;
    }
    clearLockoutUI();
    return false;
  }

  function applyLockoutUI(lockUntil, customMsg) {
    if (!lockoutBanner || !lockoutTimer) return;
    lockoutBanner.style.display = 'block';
    if (customMsg && lockoutMsg) lockoutMsg.innerText = customMsg;
    if (submitBtn) submitBtn.disabled = true;
    if (pwdGroup) pwdGroup.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';

    if (countdownTimerId) clearInterval(countdownTimerId);

    function update() {
      const remainingMs = lockUntil - Date.now();
      if (remainingMs <= 0) {
        clearInterval(countdownTimerId);
        clearLockoutUI();
        return;
      }
      const totalSec = Math.ceil(remainingMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      lockoutTimer.innerText = `⏳ Thử lại sau: ${mins} phút ${String(secs).padStart(2, '0')} giây`;
    }

    update();
    countdownTimerId = setInterval(update, 1000);
  }

  function clearLockoutUI() {
    if (countdownTimerId) {
      clearInterval(countdownTimerId);
      countdownTimerId = null;
    }
    localStorage.removeItem('admin_lock_until');
    if (lockoutBanner) lockoutBanner.style.display = 'none';
    if (submitBtn) submitBtn.disabled = false;
    if (pwdGroup) pwdGroup.style.display = 'block';
  }

  // 2. Mở / Đóng Modal
  function openModal(modal) {
    if (modal) modal.style.display = 'flex';
  }
  function closeModal(modal) {
    if (modal) modal.style.display = 'none';
  }

  // === MODULE MÃ HÓA AES-256-GCM + PBKDF2 CHO GITHUB SYNC ===
  async function deriveEncryptionKey(password, saltUint8) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltUint8,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  function bufToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToBuf(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function encryptGitHubPayload(payloadObj, password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveEncryptionKey(password, salt);
    const data = enc.encode(JSON.stringify(payloadObj));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return {
      salt: bufToBase64(salt),
      iv: bufToBase64(iv),
      ciphertext: bufToBase64(ciphertext)
    };
  }

  async function decryptGitHubPayload(encryptedObj, password) {
    if (!encryptedObj || !encryptedObj.salt || !encryptedObj.iv || !encryptedObj.ciphertext) {
      throw new Error('Dữ liệu mã hóa không đầy đủ');
    }
    const salt = new Uint8Array(base64ToBuf(encryptedObj.salt));
    const iv = new Uint8Array(base64ToBuf(encryptedObj.iv));
    const ciphertext = base64ToBuf(encryptedObj.ciphertext);
    const key = await deriveEncryptionKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  }

  // 3. Xử lý Hash URL #admin và #github
  function handleRoute() {
    const hash = window.location.hash.toLowerCase();
    const isGithubRoute = hash === '#github' || window.location.pathname.endsWith('/github');
    const isAdminRoute = hash === '#admin';

    if (isGithubRoute || isAdminRoute) {
      if (typeof window.__stopWeddingMusic === 'function') {
        window.__stopWeddingMusic();
      }
      const isAuthed = sessionStorage.getItem('wedding_admin_auth') === 'true';
      if (isAuthed) {
        if (isGithubRoute) {
          openGitHubSettingsModal();
        } else {
          activateAdminMode(false);
        }
      } else {
        openModal(loginModal);
        checkLockoutStatus();
        if (pwdInput && !submitBtn.disabled) {
          setTimeout(() => pwdInput.focus(), 150);
        }
      }
    }
  }

  // 4. Xử lý Đăng Nhập
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      closeModal(loginModal);
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin' || hash === '#github') {
        history.replaceState(null, null, window.location.pathname + window.location.search);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (checkLockoutStatus()) return;

      // === CƠ CHẾ BẪY BOT HONEYPOT ===
      if (trapInput && trapInput.value.trim() !== '') {
        // Phát hiện Bot! Khóa 1 giờ chống F5
        const lockUntil = Date.now() + 60 * 60 * 1000;
        localStorage.setItem('admin_lock_until', lockUntil.toString());
        applyLockoutUI(lockUntil, '⚠️ Đã phát hiện bot tự động! Chức năng quản trị bị khóa trong 1 giờ.');
        return;
      }

      const enteredPwd = pwdInput ? pwdInput.value : '';
      if (!enteredPwd) {
        if (errorEl) {
          errorEl.innerText = 'Vui lòng nhập mật khẩu quản trị!';
          errorEl.style.display = 'block';
        }
        return;
      }

      // Trích xuất mã ngụy trang từ backupGoogleSheetUrl (nằm trong texts.rsvp hoặc rsvp)
      let targetHash = '';
      if (typeof WEDDING_CONFIG !== 'undefined') {
        const backupUrl = (WEDDING_CONFIG.texts && WEDDING_CONFIG.texts.rsvp && WEDDING_CONFIG.texts.rsvp.backupGoogleSheetUrl)
          || (WEDDING_CONFIG.rsvp && WEDDING_CONFIG.rsvp.backupGoogleSheetUrl)
          || WEDDING_CONFIG.backupGoogleSheetUrl
          || '';
        const match = backupUrl.match(/\/macros\/s\/AKfycb_([a-f0-9]+)(?:_BA)?\/exec/i);
        if (match && match[1]) {
          targetHash = match[1].toLowerCase();
        }
      }

      // Hash SHA-256 kèm muối bảo mật (Salt)
      let hashHex = '';
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(enteredPwd + '_thinhhoan_wedding_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
      } catch (err) {
        hashHex = '';
      }

      const isMatch = targetHash ? (hashHex === targetHash) : (enteredPwd && hashHex);

      if (isMatch) {
        // Đăng nhập thành công
        localStorage.removeItem('admin_failed_attempts');
        sessionStorage.setItem('wedding_admin_auth', 'true');
        sessionStorage.setItem('wedding_admin_pwd_tmp', enteredPwd);
        window.__currentAdminPwd = enteredPwd;
        closeModal(loginModal);
        if (pwdInput) pwdInput.value = '';
        if (errorEl) errorEl.style.display = 'none';

        // Tự động giải mã cấu hình GitHub nếu có trong config.js
        if (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.githubSync && WEDDING_CONFIG.githubSync.encrypted) {
          try {
            const decrypted = await decryptGitHubPayload(WEDDING_CONFIG.githubSync.encrypted, enteredPwd);
            if (decrypted && decrypted.repo && decrypted.token) {
              localStorage.setItem('wedding_admin_gh', JSON.stringify(decrypted));
              showAdminToast('🔑 Đã tự động kích hoạt kết nối GitHub cho thiết bị này!');
            }
          } catch (err) {
            console.warn('Không thể giải mã cấu hình GitHub bằng mật khẩu vừa nhập:', err);
          }
        }

        const hash = window.location.hash.toLowerCase();
        const isGithubRoute = hash === '#github' || window.location.pathname.endsWith('/github');
        if (isGithubRoute) {
          openGitHubSettingsModal();
        } else {
          activateAdminMode(true);
        }
      } else {
        // Mật khẩu sai -> Tính số lần nhập
        let failed = parseInt(localStorage.getItem('admin_failed_attempts') || '0', 10) + 1;
        if (failed >= 5) {
          const lockUntil = Date.now() + 15 * 60 * 1000; // Khóa 15 phút
          localStorage.setItem('admin_lock_until', lockUntil.toString());
          localStorage.removeItem('admin_failed_attempts');
          applyLockoutUI(lockUntil, 'Đã nhập sai quá 5 lần! Chức năng quản trị bị khóa trong 15 phút.');
        } else {
          localStorage.setItem('admin_failed_attempts', failed.toString());
          if (errorEl) {
            errorEl.innerText = `Mật khẩu không đúng! Bạn còn ${5 - failed} lần thử.`;
            errorEl.style.display = 'block';
          }
        }
      }
    });
  }

  // Helper phân tích ngày nhập từ bàn phím
  function parseUserDateString(str) {
    if (!str) return null;
    const clean = str.trim();
    const match1 = clean.match(/(\d{1,2})[\s\.\/\-]+(\d{1,2})[\s\.\/\-]+(\d{4})/);
    if (match1) {
      const d = parseInt(match1[1], 10);
      const m = parseInt(match1[2], 10);
      const y = parseInt(match1[3], 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2020) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
    const match2 = clean.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
    if (match2) {
      const d = parseInt(match2[1], 10);
      const m = parseInt(match2[2], 10);
      const y = parseInt(match2[3], 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2020) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
    return null;
  }

  // Helper phân tích giờ nhập từ bàn phím
  function parseUserTimeString(str) {
    if (!str) return null;
    const clean = str.trim();
    const match = clean.match(/(\d{1,2})\s*(?:giờ|h|:)\s*(\d{1,2})?/i);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = match[2] ? parseInt(match[2], 10) : 0;
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    return null;
  }

  function handleDataBindInput(e) {
    const el = e.currentTarget;
    const key = el.getAttribute('data-bind');
    const val = el.innerText.trim();

    if (typeof WEDDING_CONFIG === 'undefined') window.WEDDING_CONFIG = {};
    if (!WEDDING_CONFIG.groom) WEDDING_CONFIG.groom = {};
    if (!WEDDING_CONFIG.bride) WEDDING_CONFIG.bride = {};
    if (!WEDDING_CONFIG.venues) WEDDING_CONFIG.venues = {};
    if (!WEDDING_CONFIG.venues.invitation) WEDDING_CONFIG.venues.invitation = {};
    if (!WEDDING_CONFIG.venues.ceremony) WEDDING_CONFIG.venues.ceremony = {};
    if (!WEDDING_CONFIG.venues.reception) WEDDING_CONFIG.venues.reception = {};
    if (!WEDDING_CONFIG.texts) WEDDING_CONFIG.texts = {};
    if (!WEDDING_CONFIG.bankAccount) WEDDING_CONFIG.bankAccount = {};

    // 1. Đồng bộ tức thì tên Chú rể sang các vị trí khác
    if (key === 'couple-hero-groom' || key === 'groom-name') {
      WEDDING_CONFIG.groom.name = val;
      document.querySelectorAll('[data-bind="couple-hero-groom"], [data-bind="groom-name"]').forEach(other => {
        if (other !== el) other.innerText = val;
      });
      const inviteNames = document.querySelector('[data-bind="couple-names-invite"]');
      if (inviteNames) inviteNames.innerText = `${val} ❤ ${WEDDING_CONFIG.bride?.name || ''}`;
      const footerNames = document.querySelector('[data-bind="couple-footer"]');
      if (footerNames) footerNames.innerText = `${WEDDING_CONFIG.bride?.name || ''} & ${val}`;
      document.title = `${WEDDING_CONFIG.bride?.name || ''} & ${val} — Thiệp Cưới 2026`;
    }

    // 2. Đồng bộ tức thì tên Cô dâu sang các vị trí khác
    else if (key === 'couple-hero-bride' || key === 'bride-name') {
      WEDDING_CONFIG.bride.name = val;
      document.querySelectorAll('[data-bind="couple-hero-bride"], [data-bind="bride-name"]').forEach(other => {
        if (other !== el) other.innerText = val;
      });
      const inviteNames = document.querySelector('[data-bind="couple-names-invite"]');
      if (inviteNames) inviteNames.innerText = `${WEDDING_CONFIG.groom?.name || ''} ❤ ${val}`;
      const footerNames = document.querySelector('[data-bind="couple-footer"]');
      if (footerNames) footerNames.innerText = `${val} & ${WEDDING_CONFIG.groom?.name || ''}`;
      document.title = `${val} & ${WEDDING_CONFIG.groom?.name || ''} — Thiệp Cưới 2026`;
    }

    // 3. Phân tích ngày cưới khi người dùng gõ (Đồng bộ theo thời gian thực từ Đầu trang thiệp / Hero)
    else if (key === 'wedding-date-day' || key === 'wedding-date-month' || key === 'wedding-date-year') {
      const dEl = document.querySelector('.wedding-date-master-row [data-bind="wedding-date-day"]') || document.querySelector('[data-bind="wedding-date-day"]');
      const mEl = document.querySelector('.wedding-date-master-row [data-bind="wedding-date-month"]') || document.querySelector('[data-bind="wedding-date-month"]');
      const yEl = document.querySelector('.wedding-date-master-row [data-bind="wedding-date-year"]') || document.querySelector('[data-bind="wedding-date-year"]');
      const d = dEl ? dEl.innerText.trim() : '';
      const m = mEl ? mEl.innerText.trim() : '';
      const y = yEl ? yEl.innerText.trim() : '';
      if (d && m && y && !isNaN(d) && !isNaN(m) && !isNaN(y)) {
        const iso = `${y}-${pad(m)}-${pad(d)}`;
        WEDDING_CONFIG.weddingDate = iso;
        const testD = parseLocalDate(iso);
        if (testD && !isNaN(testD.getTime())) {
          // Cập nhật dòng ngày đầy đủ
          const fullEl = document.querySelector('[data-bind="wedding-date-full"]');
          if (fullEl) fullEl.innerText = formatDateFull(testD);
          // Cập nhật tất cả các vị trí hiển thị ngày dạng chấm (Opening, Hero, Footer)
          document.querySelectorAll('[data-bind="wedding-date-dots"]').forEach(other => {
            other.innerText = formatDateDots(testD);
          });
          // Cập nhật ngày cho Lễ Thành Hôn và Tiệc Cưới
          const cerDateEl = document.querySelector('[data-bind="event-ceremony-date"]');
          if (cerDateEl) cerDateEl.innerText = formatDateShort(testD);
          const recDateEl = document.querySelector('[data-bind="event-reception-date"]');
          if (recDateEl) recDateEl.innerText = formatDateShort(testD);
          // Cập nhật đồng hồ đếm ngược theo thời gian thực
          if (typeof initCountdown === 'function') {
            initCountdown();
          }
        }
      }
    }
    else if (key === 'wedding-date-dots') {
      document.querySelectorAll('[data-bind="wedding-date-dots"]').forEach(other => {
        if (other !== el) other.innerText = val;
      });
      const parsedDate = parseUserDateString(val);
      if (parsedDate) {
        WEDDING_CONFIG.weddingDate = parsedDate;
      }
    }
    else if (key === 'wedding-date-full') {
      const parsedDate = parseUserDateString(val);
      if (parsedDate) {
        WEDDING_CONFIG.weddingDate = parsedDate;
      }
    }

    // 4. Phân tích giờ cưới khi người dùng gõ
    else if (key === 'wedding-time-hour' || key === 'wedding-time-minute') {
      const hEl = document.querySelector('.wedding-time-row [data-bind="wedding-time-hour"]') || document.querySelector('[data-bind="wedding-time-hour"]');
      const mEl = document.querySelector('.wedding-time-row [data-bind="wedding-time-minute"]') || document.querySelector('[data-bind="wedding-time-minute"]');
      const h = hEl ? hEl.innerText.trim() : '';
      const m = mEl ? mEl.innerText.trim() : '';
      if (h !== '' && m !== '' && !isNaN(h) && !isNaN(m)) {
        WEDDING_CONFIG.weddingTime = `${pad(h)}:${pad(m)}`;
        if (typeof initCountdown === 'function') {
          initCountdown();
        }
      }
    }
    else if (key === 'wedding-time-text') {
      const parsedTime = parseUserTimeString(val);
      if (parsedTime) {
        WEDDING_CONFIG.weddingTime = parsedTime;
      }
      const match = val.match(/^(.*?)(?:vào lúc|\d{1,2}\s*(?:giờ|h|:))/i);
      if (match && match[1] && match[1].trim()) {
        if (!WEDDING_CONFIG.texts.invitation) WEDDING_CONFIG.texts.invitation = {};
        WEDDING_CONFIG.texts.invitation.timePrefix = match[1].trim();
      }
    }

    // 5. Ngày âm lịch
    else if (key === 'wedding-lunar-date') {
      WEDDING_CONFIG.lunarDate = val.replace(/^\(|\)$/g, '').trim();
    }

    // 6. Địa chỉ thiệp mời chính
    else if (key === 'invitation-venue') {
      const clean = val.replace(/<br\s*\/?>/gi, ' ').trim();
      if (clean.includes(':')) {
        const parts = clean.split(':');
        WEDDING_CONFIG.venues.invitation.location = parts[0].trim();
        WEDDING_CONFIG.venues.invitation.address = parts.slice(1).join(':').trim();
      } else {
        WEDDING_CONFIG.venues.invitation.location = '';
        WEDDING_CONFIG.venues.invitation.address = clean;
      }
    }

    // 7. Bố mẹ & địa chỉ 2 bên
    else if (key === 'groom-father') WEDDING_CONFIG.groom.father = val;
    else if (key === 'groom-mother') WEDDING_CONFIG.groom.mother = val;
    else if (key === 'groom-address') WEDDING_CONFIG.groom.address = val;
    else if (key === 'bride-father') WEDDING_CONFIG.bride.father = val;
    else if (key === 'bride-mother') WEDDING_CONFIG.bride.mother = val;
    else if (key === 'bride-address') WEDDING_CONFIG.bride.address = val;

    // 8. Tiêu đề Nhà Trai / Nhà Gái
    else if (key === 'invitation-groom-family-title') {
      if (!WEDDING_CONFIG.texts.invitation) WEDDING_CONFIG.texts.invitation = {};
      WEDDING_CONFIG.texts.invitation.groomFamilyTitle = val;
    }
    else if (key === 'invitation-bride-family-title') {
      if (!WEDDING_CONFIG.texts.invitation) WEDDING_CONFIG.texts.invitation = {};
      WEDDING_CONFIG.texts.invitation.brideFamilyTitle = val;
    }

    // 9. Sự kiện Lễ Vu Quy
    else if (key === 'event-ceremony-title') WEDDING_CONFIG.venues.ceremony.title = val;
    else if (key === 'event-ceremony-time') WEDDING_CONFIG.venues.ceremony.time = val;
    else if (key === 'event-ceremony-date') WEDDING_CONFIG.venues.ceremony.dateText = val;
    else if (key === 'event-ceremony-address') {
      const clean = val.replace(/<br\s*\/?>/gi, '\n').trim();
      if (clean.includes('\n')) {
        const lines = clean.split('\n').map(s => s.trim().replace(/^[,:\s]+|[,:\s]+$/g, '')).filter(Boolean);
        WEDDING_CONFIG.venues.ceremony.locationName = lines[0] || '';
        WEDDING_CONFIG.venues.ceremony.address = lines.slice(1).join(', ') || '';
      } else {
        WEDDING_CONFIG.venues.ceremony.locationName = '';
        WEDDING_CONFIG.venues.ceremony.address = clean.replace(/^[,:\s]+|[,:\s]+$/g, '');
      }
    }

    // 10. Sự kiện Tiệc Cưới
    else if (key === 'event-reception-title') WEDDING_CONFIG.venues.reception.title = val;
    else if (key === 'event-reception-time') WEDDING_CONFIG.venues.reception.time = val;
    else if (key === 'event-reception-date') WEDDING_CONFIG.venues.reception.dateText = val;
    else if (key === 'event-reception-address') {
      const clean = val.replace(/<br\s*\/?>/gi, '\n').trim();
      if (clean.includes('\n')) {
        const lines = clean.split('\n').map(s => s.trim().replace(/^[,:\s]+|[,:\s]+$/g, '')).filter(Boolean);
        WEDDING_CONFIG.venues.reception.locationName = lines[0] || '';
        WEDDING_CONFIG.venues.reception.address = lines.slice(1).join(', ') || '';
      } else {
        WEDDING_CONFIG.venues.reception.locationName = '';
        WEDDING_CONFIG.venues.reception.address = clean.replace(/^[,:\s]+|[,:\s]+$/g, '');
      }
    }

    // 11. Ngân hàng & Mừng cưới
    else if (key === 'bank-groom-account-holder') {
      if (!WEDDING_CONFIG.bankAccount) WEDDING_CONFIG.bankAccount = {};
      if (!WEDDING_CONFIG.bankAccount.groom) WEDDING_CONFIG.bankAccount.groom = {};
      WEDDING_CONFIG.bankAccount.groom.accountHolder = val;
      WEDDING_CONFIG.bankAccount.accountHolder = val;
    }
    else if (key === 'bank-groom-name') {
      if (!WEDDING_CONFIG.bankAccount) WEDDING_CONFIG.bankAccount = {};
      if (!WEDDING_CONFIG.bankAccount.groom) WEDDING_CONFIG.bankAccount.groom = {};
      WEDDING_CONFIG.bankAccount.groom.bankName = val;
      WEDDING_CONFIG.bankAccount.bankName = val;
    }
    else if (key === 'bank-groom-account-number') {
      if (!WEDDING_CONFIG.bankAccount) WEDDING_CONFIG.bankAccount = {};
      if (!WEDDING_CONFIG.bankAccount.groom) WEDDING_CONFIG.bankAccount.groom = {};
      const cleanNum = val.replace(/\s+/g, '');
      WEDDING_CONFIG.bankAccount.groom.accountNumber = cleanNum;
      WEDDING_CONFIG.bankAccount.accountNumber = cleanNum;
      const copyGroom = document.getElementById('copy-bank-groom-btn') || document.getElementById('copy-bank-btn');
      if (copyGroom) copyGroom.setAttribute('data-account', cleanNum);
    }
    else if (key === 'bank-bride-account-holder') {
      if (!WEDDING_CONFIG.bankAccount) WEDDING_CONFIG.bankAccount = {};
      if (!WEDDING_CONFIG.bankAccount.bride) WEDDING_CONFIG.bankAccount.bride = {};
      WEDDING_CONFIG.bankAccount.bride.accountHolder = val;
    }
    else if (key === 'bank-bride-name') {
      if (!WEDDING_CONFIG.bankAccount) WEDDING_CONFIG.bankAccount = {};
      if (!WEDDING_CONFIG.bankAccount.bride) WEDDING_CONFIG.bankAccount.bride = {};
      WEDDING_CONFIG.bankAccount.bride.bankName = val;
    }
    else if (key === 'bank-bride-account-number') {
      if (!WEDDING_CONFIG.bankAccount) WEDDING_CONFIG.bankAccount = {};
      if (!WEDDING_CONFIG.bankAccount.bride) WEDDING_CONFIG.bankAccount.bride = {};
      const cleanNum = val.replace(/\s+/g, '');
      WEDDING_CONFIG.bankAccount.bride.accountNumber = cleanNum;
      const copyBride = document.getElementById('copy-bank-bride-btn');
      if (copyBride) copyBride.setAttribute('data-account', cleanNum);
    }
    else if (key === 'bank-account-holder') WEDDING_CONFIG.bankAccount.accountHolder = val;
    else if (key === 'bank-name') WEDDING_CONFIG.bankAccount.bankName = val;
    else if (key === 'bank-account-number') WEDDING_CONFIG.bankAccount.accountNumber = val.replace(/\s+/g, '');
  }

  function handleEmptyFieldFocus(e) {
    const el = e.currentTarget;
    const ph = el.getAttribute('data-empty-placeholder');
    if (ph && el.innerText.trim() === ph) {
      el.innerText = '';
    }
  }

  function handleEmptyFieldBlur(e) {
    const el = e.currentTarget;
    let ph = el.getAttribute('data-empty-placeholder');
    const key = el.getAttribute('data-bind');
    if (!el.innerText.trim()) {
      if (!ph && key) {
        ph = EMPTY_FIELD_PLACEHOLDERS[key] || `[Nhấp để nhập ${key}]`;
        el.setAttribute('data-empty-placeholder', ph);
      }
      if (ph) {
        el.innerText = ph;
        el.classList.add('admin-empty-field');
      }
    } else if (el.innerText.trim()) {
      el.classList.remove('admin-empty-field');
    }
  }

  // 5. Kích Hoạt Chế Độ Nhà Phát Triển (Visual Click-to-Edit)
  function activateAdminMode(showWelcomeToast = false) {
    if (typeof window.__stopWeddingMusic === 'function') {
      window.__stopWeddingMusic();
    }
    document.body.classList.add('admin-mode-active');
    if (toolbar) toolbar.style.display = 'flex';

    // Đảm bảo hiển thị cả hai cột bố mẹ để admin có thể thêm/sửa
    const rowFathers = document.querySelector('.parents-row-fathers');
    const rowMothers = document.querySelector('.parents-row-mothers');
    const parentsContainer = document.querySelector('.parents-container');
    if (rowFathers) rowFathers.style.display = '';
    if (rowMothers) rowMothers.style.display = '';
    if (parentsContainer) parentsContainer.style.display = '';

    // Cho phép sửa trực tiếp mọi văn bản có data-bind & gắn lắng nghe đồng bộ theo thời gian thực
    document.querySelectorAll('[data-bind]').forEach(el => {
      const key = el.getAttribute('data-bind');

      // Khóa con trỏ chuột tại các trường tự động sinh ra
      if (AUTO_GENERATED_BINDS.includes(key)) {
        el.removeAttribute('contenteditable');
        el.setAttribute('contenteditable', 'false');
        el.classList.add('admin-field-autogen');
        if (key.startsWith('wedding-date') || key.startsWith('event-')) {
          el.setAttribute('title', '🔒 Trường này được tự động đồng bộ từ ngày cưới tại Mục Thiệp Mời Chính');
        } else {
          el.setAttribute('title', '🔒 Trường này được tự động tạo từ tên Cô dâu & Chú rể (chỉnh sửa tên Cô dâu / Chú rể để đổi)');
        }
        return;
      }

      // Xử lý các trường rỗng: hiển thị khung placeholder để admin có thể nhấp chuột vào sửa
      if (el.style.display === 'none' || !el.innerText.trim()) {
        el.style.display = '';
        el.classList.add('admin-empty-field');
        const ph = EMPTY_FIELD_PLACEHOLDERS[key] || `[Nhấp để nhập ${key}]`;
        if (!el.innerText.trim()) {
          el.setAttribute('data-empty-placeholder', ph);
          el.innerText = ph;
        }
      }

      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
      el.classList.remove('admin-field-autogen');
      el.removeEventListener('input', handleDataBindInput);
      el.addEventListener('input', handleDataBindInput);
      el.removeEventListener('focus', handleEmptyFieldFocus);
      el.addEventListener('focus', handleEmptyFieldFocus);
      el.removeEventListener('blur', handleEmptyFieldBlur);
      el.addEventListener('blur', handleEmptyFieldBlur);
    });

    // Mở màn hình mở đầu nếu đang bị khóa cuộn để admin dễ chỉnh sửa toàn trang
    document.body.classList.remove('opening-locked');
    const openingOverlay = document.getElementById('opening-overlay');
    if (openingOverlay) {
      openingOverlay.classList.add('is-hidden');
      openingOverlay.style.display = 'none';
    }

    // Bắt sự kiện click vào ảnh để mở modal thay ảnh
    document.querySelectorAll('img').forEach(img => {
      if (img.closest('#admin-login-modal') || img.closest('#admin-github-modal') || img.closest('#admin-image-modal')) return;
      img.removeEventListener('click', handleImgClick);
      img.addEventListener('click', handleImgClick);
    });

    // Bật hiển thị cả 2 thẻ mã QR mừng cưới để admin có thể sửa và thay ảnh
    applyQrGuestVisibility('');

    if (showWelcomeToast) {
      showAdminToast('🛠️ Đã bật Chế độ Sửa Trực Quan! Nhấp trực tiếp vào chữ hoặc ảnh để sửa.');
    }
  }

  function handleImgClick(e) {
    if (!document.body.classList.contains('admin-mode-active')) return;
    e.stopPropagation();
    activeImgTarget = this;
    const currentSrc = activeImgTarget.getAttribute('src') || activeImgTarget.src || '';
    if (imgPreview) imgPreview.src = currentSrc;
    if (imgUrlInput) imgUrlInput.value = currentSrc.startsWith('data:') ? '' : currentSrc;
    if (imgFileInput) imgFileInput.value = '';
    openModal(imgModal);
  }

  // 6. Xử lý Thay Đổi Hình Ảnh
  if (imgFileInput) {
    imgFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const rawDataUrl = loadEvt.target.result;
        // Nén ảnh qua Canvas nếu dung lượng lớn
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (imgPreview) imgPreview.src = compressedUrl;
          if (imgUrlInput) imgUrlInput.value = compressedUrl;
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  if (imgApplyBtn) {
    imgApplyBtn.addEventListener('click', () => {
      if (activeImgTarget && imgUrlInput && imgUrlInput.value.trim()) {
        const newSrc = imgUrlInput.value.trim();
        activeImgTarget.src = newSrc;
        activeImgTarget.setAttribute('src', newSrc);

        if (typeof WEDDING_CONFIG === 'undefined') window.WEDDING_CONFIG = {};
        if (!WEDDING_CONFIG.images) WEDDING_CONFIG.images = {};

        const imgBindKey = activeImgTarget.getAttribute('data-img-bind') || activeImgTarget.id;

        if (imgBindKey === 'opening-chibi' || activeImgTarget.id === 'opening-chibi-img') {
          if (!WEDDING_CONFIG.openingScreen) WEDDING_CONFIG.openingScreen = {};
          WEDDING_CONFIG.openingScreen.coupleImage = newSrc;
          WEDDING_CONFIG.images.openingChibi = newSrc;
        } else if (imgBindKey === 'hero') {
          WEDDING_CONFIG.images.hero = newSrc;
        } else if (imgBindKey === 'groom') {
          WEDDING_CONFIG.images.groom = newSrc;
          if (WEDDING_CONFIG.groom) WEDDING_CONFIG.groom.image = newSrc;
        } else if (imgBindKey === 'bride') {
          WEDDING_CONFIG.images.bride = newSrc;
          if (WEDDING_CONFIG.bride) WEDDING_CONFIG.bride.image = newSrc;
        } else if (imgBindKey === 'countdown') {
          WEDDING_CONFIG.images.countdown = newSrc;
        } else if (imgBindKey === 'bank-qr' || imgBindKey === 'bank-qr-groom' || activeImgTarget.getAttribute('data-bind-src') === 'bank-qr-groom-img') {
          WEDDING_CONFIG.images.bankQrGroom = newSrc;
          WEDDING_CONFIG.images.bankQr = newSrc;
          if (!WEDDING_CONFIG.bankAccount) WEDDING_CONFIG.bankAccount = {};
          if (!WEDDING_CONFIG.bankAccount.groom) WEDDING_CONFIG.bankAccount.groom = {};
          WEDDING_CONFIG.bankAccount.qrCodeUrl = newSrc;
          WEDDING_CONFIG.bankAccount.groom.qrCodeUrl = newSrc;
        } else if (imgBindKey === 'bank-qr-bride' || activeImgTarget.getAttribute('data-bind-src') === 'bank-qr-bride-img') {
          WEDDING_CONFIG.images.bankQrBride = newSrc;
          if (!WEDDING_CONFIG.bankAccount) WEDDING_CONFIG.bankAccount = {};
          if (!WEDDING_CONFIG.bankAccount.bride) WEDDING_CONFIG.bankAccount.bride = {};
          WEDDING_CONFIG.bankAccount.bride.qrCodeUrl = newSrc;
        } else if (imgBindKey && imgBindKey.startsWith('gallery-')) {
          const idx = parseInt(imgBindKey.replace('gallery-', ''), 10);
          if (!Array.isArray(WEDDING_CONFIG.images.gallery)) {
            WEDDING_CONFIG.images.gallery = [];
          }
          WEDDING_CONFIG.images.gallery[idx] = newSrc;
        }

        showAdminToast('✓ Đã áp dụng ảnh mới! Nhớ bấm nút [💾 Lưu Thay Đổi] ở góc dưới để lưu vĩnh viễn.');
      }
      closeModal(imgModal);
    });
  }

  if (imgCloseBtn) {
    imgCloseBtn.addEventListener('click', () => closeModal(imgModal));
  }

  // 7. Thoát Chế Độ Admin
  if (btnExit) {
    btnExit.addEventListener('click', () => {
      document.body.classList.remove('admin-mode-active');
      if (toolbar) toolbar.style.display = 'none';
      document.querySelectorAll('[data-bind]').forEach(el => {
        el.removeAttribute('contenteditable');
        el.classList.remove('admin-field-autogen');
        el.classList.remove('admin-empty-field');
        const ph = el.getAttribute('data-empty-placeholder');
        if (ph && el.innerText.trim() === ph) {
          el.innerText = '';
        }
        if (!el.innerText.trim()) {
          el.style.display = 'none';
        }
      });
      applyWeddingConfig();
      applyQrGuestVisibility(window._currentGuestOf || '');
      history.replaceState(null, null, window.location.pathname + window.location.search);
      showAdminToast('Đã thoát Chế độ Nhà Phát Triển.');
    });
  }

  // 8. Cấu Hình GitHub Modal & Trang /#github
  function showGhAlert(type, message) {
    if (!ghTestAlert) return;
    ghTestAlert.className = `admin-gh-test-alert ${type}`;
    ghTestAlert.innerHTML = message;
    ghTestAlert.style.display = 'block';
  }

  function hideGhAlert() {
    if (ghTestAlert) ghTestAlert.style.display = 'none';
  }

  function updateGitHubStatusBadge() {
    if (!ghStatusBadge) return;
    const saved = JSON.parse(localStorage.getItem('wedding_admin_gh') || '{}');
    const isEncrypted = Boolean(typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.githubSync && WEDDING_CONFIG.githubSync.encrypted);

    if (isEncrypted) {
      const syncTime = WEDDING_CONFIG.githubSync.updatedAt ? ` (Cập nhật: ${WEDDING_CONFIG.githubSync.updatedAt})` : '';
      ghStatusBadge.className = 'admin-gh-status-badge connected';
      ghStatusBadge.innerHTML = `<span class="status-dot">🟢</span> <span class="status-text">Đã đồng bộ mã hóa AES-256${syncTime}</span>`;
    } else if (saved.token && saved.repo) {
      ghStatusBadge.className = 'admin-gh-status-badge connected';
      ghStatusBadge.innerHTML = `<span class="status-dot">🟢</span> <span class="status-text">Đã kết nối: ${saved.repo} (Bộ nhớ máy này)</span>`;
    } else {
      ghStatusBadge.className = 'admin-gh-status-badge disconnected';
      ghStatusBadge.innerHTML = `<span class="status-dot">⚪</span> <span class="status-text">Chưa kết nối GitHub</span>`;
    }
  }

  function loadGitHubSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('wedding_admin_gh') || '{}');
      if (ghRepoInput) ghRepoInput.value = saved.repo || 'Mr2D-lab/Thiep_cuoi_THINH_HOAN';
      if (ghTokenInput && saved.token) ghTokenInput.value = saved.token;
      if (ghBranchInput) ghBranchInput.value = saved.branch || 'main';
      updateGitHubStatusBadge();
      return saved;
    } catch (e) {
      return {};
    }
  }

  function openGitHubSettingsModal() {
    loadGitHubSettings();
    hideGhAlert();
    openModal(ghModal);
  }

  if (btnGithub) {
    btnGithub.addEventListener('click', () => {
      openGitHubSettingsModal();
    });
  }

  if (ghTokenToggleBtn && ghTokenInput) {
    ghTokenToggleBtn.addEventListener('click', () => {
      if (ghTokenInput.type === 'password') {
        ghTokenInput.type = 'text';
        ghTokenToggleBtn.innerText = '🙈';
      } else {
        ghTokenInput.type = 'password';
        ghTokenToggleBtn.innerText = '👁️';
      }
    });
  }

  if (ghCloseBtn) {
    ghCloseBtn.addEventListener('click', () => {
      closeModal(ghModal);
      const hash = window.location.hash.toLowerCase();
      if (hash === '#github') {
        history.replaceState(null, null, window.location.pathname + window.location.search);
      }
    });
  }

  // Nút Kiểm Tra Kết Nối (Test Connection)
  if (ghTestBtn) {
    ghTestBtn.addEventListener('click', async () => {
      const repo = ghRepoInput?.value.trim() || '';
      const token = ghTokenInput?.value.trim() || '';

      if (!repo || !token) {
        showGhAlert('error', '⚠️ Vui lòng nhập cả Tên Repository và GitHub Token trước khi kiểm tra!');
        return;
      }

      showGhAlert('loading', '⏳ Đang kiểm tra kết nối với GitHub API...');
      ghTestBtn.disabled = true;

      try {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json'
          }
        });

        if (res.ok) {
          const repoData = await res.json();
          const canPush = repoData.permissions ? repoData.permissions.push : true;
          if (canPush) {
            showGhAlert('success', `✓ <b>Kết nối thành công!</b> Token có toàn quyền ghi vào repository <b>${repoData.full_name}</b>.`);
          } else {
            showGhAlert('error', `⚠️ Token hợp lệ nhưng chưa có quyền ghi (push) vào repository ${repoData.full_name}. Vui lòng tạo token có quyền <b>repo</b>.`);
          }
        } else if (res.status === 401) {
          showGhAlert('error', '❌ <b>Token GitHub không hợp lệ</b> hoặc đã hết hạn (401 Unauthorized).');
        } else if (res.status === 404) {
          showGhAlert('error', `❌ <b>Không tìm thấy repository</b> "${repo}" (404 Not Found). Kiểm tra lại tài khoản/tên repo.`);
        } else {
          showGhAlert('error', `❌ Lỗi kết nối GitHub (${res.status}). Vui lòng kiểm tra lại.`);
        }
      } catch (err) {
        showGhAlert('error', `❌ Lỗi kết nối mạng: ${err.message}`);
      } finally {
        ghTestBtn.disabled = false;
      }
    });
  }

  // Nút Lưu Cấu Hình (Có tùy chọn Mã Hóa AES-256 Đồng Bộ)
  if (ghSaveBtn) {
    ghSaveBtn.addEventListener('click', async () => {
      const repo = ghRepoInput?.value.trim() || '';
      const token = ghTokenInput?.value.trim() || '';
      const branch = ghBranchInput?.value.trim() || 'main';
      const doEncryptSync = ghEncryptSyncCheckbox ? ghEncryptSyncCheckbox.checked : true;

      if (!repo || !token) {
        showGhAlert('error', '⚠️ Vui lòng nhập cả Tên Repository và GitHub Token!');
        return;
      }

      const payloadObj = { repo, token, branch };
      localStorage.setItem('wedding_admin_gh', JSON.stringify(payloadObj));

      if (doEncryptSync) {
        const adminPwd = window.__currentAdminPwd || sessionStorage.getItem('wedding_admin_pwd_tmp') || '';
        if (!adminPwd) {
          showGhAlert('error', '⚠️ Vui lòng đăng nhập lại mật khẩu Admin trước khi lưu cấu hình.');
          return;
        }
        ghSaveBtn.disabled = true;
        const origBtnText = ghSaveBtn.innerText;
        ghSaveBtn.innerText = '⏳ Đang mã hóa & đồng bộ...';
        showGhAlert('loading', '⏳ Đang mã hóa AES-256 và lưu cấu hình lên GitHub...');

        try {
          const encryptedPayload = await encryptGitHubPayload(payloadObj, adminPwd);

          if (typeof WEDDING_CONFIG === 'undefined') window.WEDDING_CONFIG = {};
          WEDDING_CONFIG.githubSync = {
            enabled: true,
            encrypted: encryptedPayload,
            updatedAt: new Date().toLocaleString('vi-VN')
          };

          const cfg = harvestUpdatedConfig();
          cfg.githubSync = WEDDING_CONFIG.githubSync;
          const code = generateConfigJsString(cfg);

          const branchParam = branch || 'main';
          const apiUrl = `https://api.github.com/repos/${repo}/contents/config.js?ref=${encodeURIComponent(branchParam)}`;

          let sha = null;
          const getRes = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github+json'
            }
          });
          if (getRes.ok) {
            const getData = await getRes.json();
            sha = getData.sha;
          }

          const base64Content = btoa(encodeURIComponent(code).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
          const putUrl = `https://api.github.com/repos/${repo}/contents/config.js`;
          const putRes = await fetch(putUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Cập nhật cấu hình GitHub đồng bộ mã hóa AES-256',
              content: base64Content,
              sha: sha || undefined,
              branch: branchParam
            })
          });

          if (!putRes.ok) {
            const errData = await putRes.json().catch(() => ({}));
            throw new Error(errData.message || `Lỗi GitHub (${putRes.status})`);
          }

          showGhAlert('success', '🎉 <b>Đã mã hóa và đồng bộ thành công!</b> Giờ đây bạn có thể mở web trên bất kỳ máy tính/điện thoại nào, chỉ cần nhập mật khẩu Admin là tự động kết nối GitHub.');
          showAdminToast('✓ Đã mã hóa và đồng bộ cấu hình GitHub lên đám mây!');
          updateGitHubStatusBadge();
        } catch (err) {
          console.error('Lỗi khi mã hóa & đồng bộ GitHub:', err);
          showGhAlert('error', `⚠️ Đã lưu cấu hình trên máy này nhưng chưa thể đồng bộ lên GitHub: ${err.message}`);
        } finally {
          ghSaveBtn.disabled = false;
          ghSaveBtn.innerText = origBtnText;
        }
      } else {
        showGhAlert('success', '✓ Đã lưu cấu hình GitHub vào bộ nhớ máy này!');
        showAdminToast('Đã lưu cấu hình GitHub!');
        updateGitHubStatusBadge();
      }
    });
  }

  // 9. Thu Thập Dữ Liệu Sau Khi Sửa (Reverse Binding)
  function harvestUpdatedConfig() {
    let baseConfig = {};
    if (typeof WEDDING_CONFIG !== 'undefined') {
      try {
        baseConfig = JSON.parse(JSON.stringify(WEDDING_CONFIG));
      } catch (e) {
        baseConfig = {};
      }
    }

    if (!baseConfig.groom) baseConfig.groom = {};
    if (!baseConfig.bride) baseConfig.bride = {};
    if (!baseConfig.texts) baseConfig.texts = {};
    if (!baseConfig.venues) baseConfig.venues = {};
    if (!baseConfig.venues.invitation) baseConfig.venues.invitation = {};
    if (!baseConfig.openingScreen) baseConfig.openingScreen = {};
    if (!baseConfig.bankAccount) baseConfig.bankAccount = {};
    if (!baseConfig.images) baseConfig.images = {};

    function getText(bindKey) {
      const el = document.querySelector(`[data-bind="${bindKey}"]`);
      if (!el) return null;
      const ph = el.getAttribute('data-empty-placeholder');
      const txt = el.innerText.trim();
      if (ph && txt === ph) return '';
      return txt;
    }

    // Cô dâu & Chú rể (Quét đa điểm: Hero, Couple section,...)
    const gName = getText('groom-name') || getText('couple-hero-groom');
    if (gName !== null && gName !== '') {
      baseConfig.groom.name = gName;
      const gParts = gName.split(/\s+/).filter(Boolean);
      if (gParts.length > 0) baseConfig.groom.shortName = gParts[gParts.length - 1];
    }

    const bName = getText('bride-name') || getText('couple-hero-bride');
    if (bName !== null && bName !== '') {
      baseConfig.bride.name = bName;
      const bParts = bName.split(/\s+/).filter(Boolean);
      if (bParts.length > 0) baseConfig.bride.shortName = bParts[bParts.length - 1];
    }

    const gFather = getText('groom-father'); if (gFather !== null) baseConfig.groom.father = gFather;
    const gMother = getText('groom-mother'); if (gMother !== null) baseConfig.groom.mother = gMother;
    const gAddr = getText('groom-address'); if (gAddr !== null) baseConfig.groom.address = gAddr;

    const bFather = getText('bride-father'); if (bFather !== null) baseConfig.bride.father = bFather;
    const bMother = getText('bride-mother'); if (bMother !== null) baseConfig.bride.mother = bMother;
    const bAddr = getText('bride-address'); if (bAddr !== null) baseConfig.bride.address = bAddr;

    // Ngày cưới & Giờ cưới (Tự động nhận diện chuỗi ngày giờ gõ tay)
    const dValEl = document.querySelector('.wedding-date-master-row [data-bind="wedding-date-day"]') || document.querySelector('[data-bind="wedding-date-day"]');
    const mValEl = document.querySelector('.wedding-date-master-row [data-bind="wedding-date-month"]') || document.querySelector('[data-bind="wedding-date-month"]');
    const yValEl = document.querySelector('.wedding-date-master-row [data-bind="wedding-date-year"]') || document.querySelector('[data-bind="wedding-date-year"]');
    const dVal = dValEl ? dValEl.innerText.trim() : getText('wedding-date-day');
    const mVal = mValEl ? mValEl.innerText.trim() : getText('wedding-date-month');
    const yVal = yValEl ? yValEl.innerText.trim() : getText('wedding-date-year');
    if (dVal && mVal && yVal && !isNaN(dVal) && !isNaN(mVal) && !isNaN(yVal)) {
      baseConfig.weddingDate = `${yVal}-${pad(mVal)}-${pad(dVal)}`;
    } else {
      const dateDots = getText('wedding-date-dots');
      const dateFull = getText('wedding-date-full');
      const parsedDate = parseUserDateString(dateDots) || parseUserDateString(dateFull);
      if (parsedDate) {
        baseConfig.weddingDate = parsedDate;
      }
    }

    const hValEl = document.querySelector('.wedding-time-row [data-bind="wedding-time-hour"]') || document.querySelector('[data-bind="wedding-time-hour"]');
    const minValEl = document.querySelector('.wedding-time-row [data-bind="wedding-time-minute"]') || document.querySelector('[data-bind="wedding-time-minute"]');
    const hVal = hValEl ? hValEl.innerText.trim() : getText('wedding-time-hour');
    const minVal = minValEl ? minValEl.innerText.trim() : getText('wedding-time-minute');
    if (hVal !== null && minVal !== null && hVal !== '' && minVal !== '' && !isNaN(hVal) && !isNaN(minVal)) {
      baseConfig.weddingTime = `${pad(hVal)}:${pad(minVal)}`;
    } else {
      const timeText = getText('wedding-time-text');
      if (timeText !== null) {
        const parsedTime = parseUserTimeString(timeText);
        if (parsedTime) {
          baseConfig.weddingTime = parsedTime;
        }
        const match = timeText.match(/^(.*?)(?:vào lúc|\d{1,2}\s*(?:giờ|h|:))/i);
        if (match && match[1] && match[1].trim()) {
          if (!baseConfig.texts.invitation) baseConfig.texts.invitation = {};
          baseConfig.texts.invitation.timePrefix = match[1].trim();
        }
      }
    }

    // Ngày âm lịch
    const lunar = getText('wedding-lunar-date');
    if (lunar !== null) baseConfig.lunarDate = lunar.replace(/^\(|\)$/g, '').trim();

    // Địa chỉ thiệp mời chính
    const invVenue = getText('invitation-venue');
    if (invVenue !== null) {
      const cleanInv = invVenue.replace(/<br\s*\/?>/gi, ' ').trim();
      if (cleanInv.includes(':')) {
        const parts = cleanInv.split(':');
        baseConfig.venues.invitation.location = parts[0].trim();
        baseConfig.venues.invitation.address = parts.slice(1).join(':').trim();
      } else {
        baseConfig.venues.invitation.location = '';
        baseConfig.venues.invitation.address = cleanInv;
      }
    }

    // Tiêu đề Nhà Trai / Nhà Gái
    if (!baseConfig.texts.invitation) baseConfig.texts.invitation = {};
    const gFam = getText('invitation-groom-family-title'); if (gFam !== null) baseConfig.texts.invitation.groomFamilyTitle = gFam;
    const bFam = getText('invitation-bride-family-title'); if (bFam !== null) baseConfig.texts.invitation.brideFamilyTitle = bFam;

    // Sự kiện 1: Lễ Vu Quy
    if (!baseConfig.venues.ceremony) baseConfig.venues.ceremony = {};
    const cerTitle = getText('event-ceremony-title'); if (cerTitle !== null) baseConfig.venues.ceremony.title = cerTitle;
    const cerTime = getText('event-ceremony-time'); if (cerTime !== null) baseConfig.venues.ceremony.time = cerTime;
    const cerDate = getText('event-ceremony-date'); if (cerDate !== null) baseConfig.venues.ceremony.dateText = cerDate;
    const cerAddr = getText('event-ceremony-address');
    if (cerAddr !== null) {
      const cleanCer = cerAddr.replace(/<br\s*\/?>/gi, '\n').trim();
      if (cleanCer.includes('\n')) {
        const lines = cleanCer.split('\n').map(s => s.trim().replace(/^[,:\s]+|[,:\s]+$/g, '')).filter(Boolean);
        baseConfig.venues.ceremony.locationName = lines[0] || '';
        baseConfig.venues.ceremony.address = lines.slice(1).join(', ') || '';
      } else {
        baseConfig.venues.ceremony.locationName = '';
        baseConfig.venues.ceremony.address = cleanCer.replace(/^[,:\s]+|[,:\s]+$/g, '');
      }
    }

    // Sự kiện 2: Tiệc Cưới
    if (!baseConfig.venues.reception) baseConfig.venues.reception = {};
    const recTitle = getText('event-reception-title'); if (recTitle !== null) baseConfig.venues.reception.title = recTitle;
    const recTime = getText('event-reception-time'); if (recTime !== null) baseConfig.venues.reception.time = recTime;
    const recDate = getText('event-reception-date'); if (recDate !== null) baseConfig.venues.reception.dateText = recDate;
    const recAddr = getText('event-reception-address');
    if (recAddr !== null) {
      const cleanRec = recAddr.replace(/<br\s*\/?>/gi, '\n').trim();
      if (cleanRec.includes('\n')) {
        const lines = cleanRec.split('\n').map(s => s.trim().replace(/^[,:\s]+|[,:\s]+$/g, '')).filter(Boolean);
        baseConfig.venues.reception.locationName = lines[0] || '';
        baseConfig.venues.reception.address = lines.slice(1).join(', ') || '';
      } else {
        baseConfig.venues.reception.locationName = '';
        baseConfig.venues.reception.address = cleanRec.replace(/^[,:\s]+|[,:\s]+$/g, '');
      }
    }

    // Văn bản thiệp
    if (!baseConfig.texts.hero) baseConfig.texts.hero = {};
    const heroSub = getText('hero-subtitle'); if (heroSub !== null) baseConfig.texts.hero.subtitle = heroSub;

    const invHeading = getText('invitation-heading'); if (invHeading !== null) baseConfig.texts.invitation.heading = invHeading;
    const invGuest = getText('invitation-guest-label'); if (invGuest !== null) baseConfig.texts.invitation.guestLabel = invGuest;
    const invSub = getText('invitation-subheading'); if (invSub !== null) baseConfig.texts.invitation.subheading = invSub;
    const invBless = getText('invitation-blessing'); if (invBless !== null) baseConfig.texts.invitation.blessing = invBless;

    const poem = getText('poem-text'); if (poem !== null) baseConfig.texts.poem = poem;

    if (!baseConfig.texts.couple) baseConfig.texts.couple = {};
    const cSub = getText('couple-subtitle'); if (cSub !== null) baseConfig.texts.couple.subtitle = cSub;
    const cHead = getText('couple-heading'); if (cHead !== null) baseConfig.texts.couple.heading = cHead;
    const gRole = getText('groom-role'); if (gRole !== null) baseConfig.texts.couple.groomRole = gRole;
    const bRole = getText('bride-role'); if (bRole !== null) baseConfig.texts.couple.brideRole = bRole;

    if (!baseConfig.texts.quote) baseConfig.texts.quote = {};
    const qTxt = getText('quote-text'); if (qTxt !== null) baseConfig.texts.quote.text = qTxt;
    const qAuth = getText('quote-author'); if (qAuth !== null) baseConfig.texts.quote.author = qAuth;

    // Gallery
    if (!baseConfig.texts.gallery) baseConfig.texts.gallery = {};
    const galSub = getText('gallery-subtitle'); if (galSub !== null) baseConfig.texts.gallery.subtitle = galSub;
    const galHead = getText('gallery-heading'); if (galHead !== null) baseConfig.texts.gallery.heading = galHead;

    // Countdown
    if (!baseConfig.texts.countdown) baseConfig.texts.countdown = {};
    const cdSub = getText('countdown-subtitle'); if (cdSub !== null) baseConfig.texts.countdown.subtitle = cdSub;
    const cdHead = getText('countdown-heading'); if (cdHead !== null) baseConfig.texts.countdown.heading = cdHead;
    const cdDays = getText('countdown-days-label'); if (cdDays !== null) baseConfig.texts.countdown.daysLabel = cdDays;
    const cdHours = getText('countdown-hours-label'); if (cdHours !== null) baseConfig.texts.countdown.hoursLabel = cdHours;
    const cdMins = getText('countdown-minutes-label'); if (cdMins !== null) baseConfig.texts.countdown.minutesLabel = cdMins;
    const cdSecs = getText('countdown-seconds-label'); if (cdSecs !== null) baseConfig.texts.countdown.secondsLabel = cdSecs;

    // Events header
    if (!baseConfig.texts.eventsHeader) baseConfig.texts.eventsHeader = {};
    const evSub = getText('events-subtitle'); if (evSub !== null) baseConfig.texts.eventsHeader.subtitle = evSub;
    const evHead = getText('events-heading'); if (evHead !== null) baseConfig.texts.eventsHeader.heading = evHead;

    // Màn hình mở đầu
    const opTitle = getText('opening-title'); if (opTitle !== null) baseConfig.openingScreen.title = opTitle;
    const opSub = getText('opening-subtitle'); if (opSub !== null) baseConfig.openingScreen.subtitle = opSub;
    const opBtn = getText('opening-button-text'); if (opBtn !== null) baseConfig.openingScreen.buttonText = opBtn;
    const opHint = getText('opening-hint-text'); if (opHint !== null) baseConfig.openingScreen.hintText = opHint;

    // Mừng Cưới (Gift)
    if (!baseConfig.texts.gift) baseConfig.texts.gift = {};
    const giftSub = getText('gift-subtitle'); if (giftSub !== null) baseConfig.texts.gift.subtitle = giftSub;
    const giftHead = getText('gift-heading'); if (giftHead !== null) baseConfig.texts.gift.heading = giftHead;
    const giftNote = getText('gift-envelope-note'); if (giftNote !== null) baseConfig.texts.gift.envelopeNote = giftNote;
    const giftQr = getText('gift-qr-instruction'); if (giftQr !== null) baseConfig.texts.gift.qrInstruction = giftQr;

    // Ngân hàng
    const accHolder = getText('bank-account-holder'); if (accHolder !== null) baseConfig.bankAccount.accountHolder = accHolder;
    const bNameBank = getText('bank-name'); if (bNameBank !== null) baseConfig.bankAccount.bankName = bNameBank;
    const bAccNum = getText('bank-account-number'); if (bAccNum !== null) baseConfig.bankAccount.accountNumber = bAccNum;

    // RSVP Form texts
    if (!baseConfig.texts.rsvp) baseConfig.texts.rsvp = {};
    const rsvpSub = getText('rsvp-subtitle'); if (rsvpSub !== null) baseConfig.texts.rsvp.subtitle = rsvpSub;
    const rsvpHead = getText('rsvp-heading'); if (rsvpHead !== null) baseConfig.texts.rsvp.heading = rsvpHead;
    const rsvpBtn = getText('rsvp-btn-text'); if (rsvpBtn !== null) baseConfig.texts.rsvp.buttonText = rsvpBtn;
    const rsvpDead = getText('rsvp-deadline-text'); if (rsvpDead !== null) baseConfig.texts.rsvp.prompt = rsvpDead;

    const rsvpNameLbl = getText('rsvp-name-label');
    if (rsvpNameLbl !== null) {
      if (!baseConfig.texts.rsvp.nameField) baseConfig.texts.rsvp.nameField = {};
      baseConfig.texts.rsvp.nameField.label = rsvpNameLbl;
    }

    if (!baseConfig.texts.rsvp.attendanceField) baseConfig.texts.rsvp.attendanceField = {};
    const rsvpAttLbl = getText('rsvp-attendance-label');
    if (rsvpAttLbl !== null) {
      baseConfig.texts.rsvp.attendanceField.label = rsvpAttLbl;
    }
    const attYes = getText('rsvp-attendance-yes'); if (attYes !== null) baseConfig.texts.rsvp.attendanceField.yesOption = attYes;
    const attNo = getText('rsvp-attendance-no'); if (attNo !== null) baseConfig.texts.rsvp.attendanceField.noOption = attNo;

    if (!baseConfig.texts.rsvp.guestOfField) baseConfig.texts.rsvp.guestOfField = {};
    const rsvpGuestOfLbl = getText('rsvp-guestof-label');
    if (rsvpGuestOfLbl !== null) {
      baseConfig.texts.rsvp.guestOfField.label = rsvpGuestOfLbl;
    }
    const gBride = getText('rsvp-guestof-bride'); if (gBride !== null) baseConfig.texts.rsvp.guestOfField.brideOption = gBride;
    const gGroom = getText('rsvp-guestof-groom'); if (gGroom !== null) baseConfig.texts.rsvp.guestOfField.groomOption = gGroom;

    const rsvpAccLbl = getText('rsvp-accompany-label');
    if (rsvpAccLbl !== null) {
      if (!baseConfig.texts.rsvp.accompanyField) baseConfig.texts.rsvp.accompanyField = {};
      baseConfig.texts.rsvp.accompanyField.label = rsvpAccLbl;
    }

    const rsvpMsgLbl = getText('rsvp-message-label');
    if (rsvpMsgLbl !== null) {
      if (!baseConfig.texts.rsvp.messageField) baseConfig.texts.rsvp.messageField = {};
      baseConfig.texts.rsvp.messageField.label = rsvpMsgLbl;
    }

    // Footer
    if (!baseConfig.texts.footer) baseConfig.texts.footer = {};
    const fThank = getText('footer-thankyou'); if (fThank !== null) baseConfig.texts.footer.thankYou = fThank;

    // Thu thập thông tin tài khoản ngân hàng mừng cưới
    if (!baseConfig.bankAccount) baseConfig.bankAccount = {};
    if (!baseConfig.bankAccount.groom) baseConfig.bankAccount.groom = {};
    if (!baseConfig.bankAccount.bride) baseConfig.bankAccount.bride = {};

    const gHolder = getText('bank-groom-account-holder'); if (gHolder !== null) { baseConfig.bankAccount.groom.accountHolder = gHolder; baseConfig.bankAccount.accountHolder = gHolder; }
    const gBank = getText('bank-groom-name'); if (gBank !== null) { baseConfig.bankAccount.groom.bankName = gBank; baseConfig.bankAccount.bankName = gBank; }
    const gNum = getText('bank-groom-account-number'); if (gNum !== null) { baseConfig.bankAccount.groom.accountNumber = gNum.replace(/\s+/g, ''); baseConfig.bankAccount.accountNumber = gNum.replace(/\s+/g, ''); }

    const bHolder = getText('bank-bride-account-holder'); if (bHolder !== null) baseConfig.bankAccount.bride.accountHolder = bHolder;
    const bBank = getText('bank-bride-name'); if (bBank !== null) baseConfig.bankAccount.bride.bankName = bBank;
    const bNum = getText('bank-bride-account-number'); if (bNum !== null) baseConfig.bankAccount.bride.accountNumber = bNum.replace(/\s+/g, '');

    // Thu thập 100% hình ảnh trên trang (An toàn, không bị ghi đè thuộc tính cũ)
    function readImg(selector, currentConfigVal) {
      const el = document.querySelector(selector);
      if (!el) return currentConfigVal || '';
      const attr = el.getAttribute('src');
      if (attr && !attr.startsWith('blob:')) return attr;
      if (el.src && !el.src.startsWith('blob:')) return el.src;
      return currentConfigVal || '';
    }

    if (!baseConfig.images) baseConfig.images = {};

    baseConfig.images.hero = readImg('[data-img-bind="hero"]', baseConfig.images.hero);

    const groomImgSrc = readImg('[data-img-bind="groom"]', baseConfig.images.groom);
    baseConfig.images.groom = groomImgSrc;
    baseConfig.groom.image = groomImgSrc;

    const brideImgSrc = readImg('[data-img-bind="bride"]', baseConfig.images.bride);
    baseConfig.images.bride = brideImgSrc;
    baseConfig.bride.image = brideImgSrc;

    baseConfig.images.countdown = readImg('[data-img-bind="countdown"]', baseConfig.images.countdown);

    const chibiSrc = readImg('#opening-chibi-img, [data-img-bind="opening-chibi"]', baseConfig.images.openingChibi);
    baseConfig.images.openingChibi = chibiSrc;
    baseConfig.openingScreen.coupleImage = chibiSrc;

    const qrGroomSrc = readImg('[data-img-bind="bank-qr-groom"], [data-img-bind="bank-qr"]', baseConfig.images.bankQrGroom || baseConfig.images.bankQr);
    baseConfig.images.bankQrGroom = qrGroomSrc;
    baseConfig.images.bankQr = qrGroomSrc;
    baseConfig.bankAccount.groom.qrCodeUrl = qrGroomSrc;
    baseConfig.bankAccount.qrCodeUrl = qrGroomSrc;

    const qrBrideSrc = readImg('[data-img-bind="bank-qr-bride"]', baseConfig.images.bankQrBride);
    baseConfig.images.bankQrBride = qrBrideSrc;
    baseConfig.bankAccount.bride.qrCodeUrl = qrBrideSrc;

    const galleryImgs = [];
    for (let i = 0; i < 6; i++) {
      const gSrc = readImg(`[data-img-bind="gallery-${i}"]`, (baseConfig.images.gallery && baseConfig.images.gallery[i]) || '');
      if (gSrc) galleryImgs.push(gSrc);
    }
    if (galleryImgs.length > 0) {
      baseConfig.images.gallery = galleryImgs;
    }

    // Cấu hình đồng bộ GitHub mã hóa
    if (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.githubSync) {
      baseConfig.githubSync = WEDDING_CONFIG.githubSync;
    }

    return baseConfig;
  }

  function generateConfigJsString(configObj, buildTimestamp) {
    const vTime = buildTimestamp || Date.now().toString();
    return `/* ==========================================================================\n   BẢNG CẤU HÌNH THIỆP CƯỚI 2026 (Cập nhật: ${vTime})\n   ========================================================================== */\n\nconst WEDDING_CONFIG = ${JSON.stringify(configObj, null, 2)};\n\nif (typeof window !== 'undefined') {\n  window.WEDDING_CONFIG = WEDDING_CONFIG;\n  window._weddingConfigBuildTime = "${vTime}";\n}\n`;
  }

  // 10. Tải File config.js Về Máy
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const cfg = harvestUpdatedConfig();
      const code = generateConfigJsString(cfg);
      const blob = new Blob([code], { type: 'text/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'config.js';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showAdminToast('📥 Đã tải file config.js về máy thành công!');
    });
  }

  // 11. Lưu Trực Tiếp Lên GitHub API & Local Draft
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const cfg = harvestUpdatedConfig();
      window.WEDDING_CONFIG = cfg;

      // Bước 1: Lưu vào localStorage dự phòng ngay lập tức (đảm bảo không bao giờ mất dữ liệu trên máy)
      try {
        localStorage.setItem('wedding_config_local_draft', JSON.stringify(cfg));
        localStorage.setItem('wedding_config_draft_time', Date.now().toString());
      } catch (e) {
        console.warn('Lỗi lưu local draft:', e);
      }

      // TỐI ƯU 1: CẬP NHẬT GIAO DIỆN TỨC THÌ (0.05 GIÂY!)
      // Không cần chờ mạng, không cần F5 - Màn hình cập nhật ngay trước mắt!
      applyWeddingConfig();
      initCountdown();

      // Phản hồi nút bấm tức thì (Instant Button Feedback)
      const originalBtnText = btnSave.innerHTML;
      btnSave.innerHTML = '✓ <span>Đã lưu!</span>';
      btnSave.classList.add('admin-btn-saved');
      setTimeout(() => {
        btnSave.innerHTML = originalBtnText;
        btnSave.classList.remove('admin-btn-saved');
      }, 1600);

      const ghSettings = loadGitHubSettings();
      if (!ghSettings.repo || !ghSettings.token) {
        showAdminToast('⚡ Đã cập nhật giao diện ngay lập tức! (Chưa cài Token GitHub để đồng bộ cho khách)');
        return;
      }

      showAdminToast('⚡ Đã lưu vào máy! Đang kết nối đồng bộ GitHub...');

      // TỐI ƯU 2: ĐỒNG BỘ GITHUB CHẠY NGẦM (NON-BLOCKING BACKGROUND SYNC)
      syncConfigToGitHub(cfg, ghSettings);
    });
  }

  // Quản lý hiển thị đếm ngược tiến trình đồng bộ lên GitHub & Vercel
  const SyncCountdownManager = {
    indicator: null,
    icon: null,
    title: null,
    subtitle: null,
    progressBar: null,
    retryBtn: null,
    closeBtn: null,
    timerId: null,
    pollTimerId: null,
    hideTimerId: null,
    startTime: 0,
    githubEstMs: 0,
    githubActualMs: 0,
    vercelEstMs: 0,
    totalEstMs: 0,
    stage: 0, // 1: GitHub upload, 2: Vercel deploy, 3: Completed
    expectedBuildTime: null,
    expectedSha: null,

    _bindElements() {
      this.indicator = document.getElementById('admin-sync-indicator');
      this.icon = document.getElementById('admin-sync-icon');
      this.title = document.getElementById('admin-sync-title');
      this.subtitle = document.getElementById('admin-sync-sub');
      this.progressBar = document.getElementById('admin-sync-progress-bar');
      this.retryBtn = document.getElementById('admin-sync-retry-btn');
      this.closeBtn = document.getElementById('admin-sync-close-btn');

      if (this.closeBtn) {
        this.closeBtn.onclick = () => this.hide();
      }
    },

    start(payloadKb, buildTimestamp, retryCallback) {
      this._bindElements();
      if (!this.indicator) return;

      this.clearAllTimers();

      // 1. Tính toán thời gian dự kiến 2 giai đoạn:
      // - Giai đoạn 1 (GitHub): 1.5s cơ sở + upload theo dung lượng (~140 KB/s)
      // - Giai đoạn 2 (Vercel): 28.0s (đóng gói static build & phân phối CDN toàn cầu)
      const githubSec = Math.max(2.0, Math.round((1.5 + payloadKb / 140) * 10) / 10);
      const vercelSec = 28.0;
      const totalSec = githubSec + vercelSec; // khoảng 30s - 35s

      this.githubEstMs = githubSec * 1000;
      this.vercelEstMs = vercelSec * 1000;
      this.totalEstMs = totalSec * 1000;
      this.startTime = Date.now();
      this.stage = 1;
      this.expectedBuildTime = buildTimestamp;

      this.indicator.className = 'admin-sync-indicator syncing stage-github';
      this.indicator.style.display = 'block';
      if (this.icon) this.icon.innerText = '📦';
      if (this.title) this.title.innerText = `Đang tải dữ liệu lên GitHub (${payloadKb} KB)...`;
      if (this.retryBtn) this.retryBtn.style.display = 'none';

      const updateCountdown = () => {
        const elapsedMs = Date.now() - this.startTime;
        const remainingMs = Math.max(0, this.totalEstMs - elapsedMs);
        const remainingSec = Math.ceil(remainingMs / 1000);

        if (this.stage === 1) {
          // Giai đoạn 1: Tiến trình từ 0% đến 20%
          const ghProgress = Math.min(20, (elapsedMs / this.githubEstMs) * 20);
          if (this.progressBar) this.progressBar.style.width = `${ghProgress}%`;
          if (this.subtitle) {
            this.subtitle.innerText = `⏳ Dự kiến toàn bộ: còn ~${remainingSec}s (Bao gồm Vercel xuất bản)`;
          }
        } else if (this.stage === 2) {
          // Giai đoạn 2: Tiến trình từ 20% đến 95%
          const vercelElapsed = elapsedMs - this.githubActualMs;
          const vercelProgress = Math.min(95, 20 + (vercelElapsed / this.vercelEstMs) * 75);
          if (this.progressBar) this.progressBar.style.width = `${vercelProgress}%`;

          if (this.subtitle) {
            if (remainingMs > 0) {
              this.subtitle.innerText = `⏳ Đang triển khai toàn cầu: còn ~${remainingSec}s...`;
            } else {
              this.subtitle.innerText = `⏳ Đang kích hoạt CDN toàn cầu...`;
            }
          }

          // Khi hết thời gian đếm ngược mà chưa bắt được polling, tự động hoàn tất
          if (remainingMs <= 0 && elapsedMs >= this.totalEstMs) {
            this.success(elapsedMs / 1000);
          }
        }
      };

      updateCountdown();
      this.timerId = setInterval(updateCountdown, 100);
    },

    // Khi GitHub API trả về 200 OK -> Chuyển sang Giai đoạn 2: Vercel Deploy!
    onGitHubCommitted(commitSha) {
      if (this.stage !== 1) return;
      this.stage = 2;
      this.expectedSha = commitSha;
      this.githubActualMs = Date.now() - this.startTime;

      if (!this.indicator) this._bindElements();
      if (!this.indicator) return;

      this.indicator.className = 'admin-sync-indicator syncing stage-vercel';
      if (this.icon) this.icon.innerText = '🌐';
      if (this.title) this.title.innerText = 'GitHub đã lưu! Vercel đang xuất bản web...';

      // Khởi động thăm dò nhẹ xem Vercel đã phục vụ bản mới chưa
      this.startVercelPolling();
    },

    // Thăm dò kiểm tra xem Vercel CDN đã nhận bản mới chưa
    startVercelPolling() {
      if (this.pollTimerId) clearInterval(this.pollTimerId);

      // Bắt đầu thăm dò sau 16 giây từ lúc bắt đầu (Vercel cần tối thiểu 16s để build)
      const checkFn = async () => {
        if (this.stage !== 2) return;
        try {
          const res = await fetch(`/config.js?_vcheck=${Date.now()}`, {
            cache: 'no-store'
          });
          if (res.ok) {
            const text = await res.text();
            // Kiểm tra xem config trên Vercel đã khớp với thay đổi gần nhất chưa
            const isMatch = (this.expectedBuildTime && text.includes(this.expectedBuildTime)) ||
                            (this.expectedSha && text.includes(this.expectedSha)) ||
                            (window.WEDDING_CONFIG?.groom?.name && text.includes(window.WEDDING_CONFIG.groom.name));

            if (isMatch) {
              const actualDuration = (Date.now() - this.startTime) / 1000;
              this.success(actualDuration);
            }
          }
        } catch (e) {
          // Bỏ qua lỗi mạng ngầm khi thăm dò
        }
      };

      // Đặt lịch thăm dò mỗi 3.5 giây
      this.pollTimerId = setInterval(checkFn, 3500);
    },

    success(actualDurationSec) {
      this.clearAllTimers();
      this.stage = 3;
      this._bindElements();
      if (!this.indicator) return;

      this.indicator.className = 'admin-sync-indicator success';
      if (this.icon) this.icon.innerText = '🎉';
      if (this.title) this.title.innerText = 'Vercel đã xuất bản xong!';
      if (this.subtitle) {
        const secText = typeof actualDurationSec === 'number' ? ` trong ${actualDurationSec.toFixed(1)}s` : '';
        this.subtitle.innerText = `Hoàn tất${secText} • Mọi thiết bị đều đã xem được bản mới!`;
      }
      if (this.progressBar) this.progressBar.style.width = '100%';
      if (this.retryBtn) this.retryBtn.style.display = 'none';

      if (this.hideTimerId) clearTimeout(this.hideTimerId);
      this.hideTimerId = setTimeout(() => {
        this.hide();
      }, 4000);
    },

    error(errMessage, retryCallback) {
      this.clearAllTimers();
      this.stage = 0;
      this._bindElements();
      if (!this.indicator) return;

      this.indicator.className = 'admin-sync-indicator error';
      if (this.icon) this.icon.innerText = '❌';
      if (this.title) this.title.innerText = 'Không thể đồng bộ lên GitHub!';
      if (this.subtitle) this.subtitle.innerText = errMessage || 'Lỗi kết nối mạng hoặc Token GitHub không hợp lệ.';
      if (this.progressBar) this.progressBar.style.width = '100%';

      if (this.retryBtn && typeof retryCallback === 'function') {
        this.retryBtn.style.display = 'inline-block';
        this.retryBtn.onclick = () => {
          retryCallback();
        };
      }
    },

    clearAllTimers() {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
      if (this.pollTimerId) {
        clearInterval(this.pollTimerId);
        this.pollTimerId = null;
      }
      if (this.hideTimerId) {
        clearTimeout(this.hideTimerId);
        this.hideTimerId = null;
      }
    },

    hide() {
      this.clearAllTimers();
      if (this.indicator) {
        this.indicator.style.display = 'none';
      }
    }
  };

  // Đồng bộ cấu hình lên GitHub chạy ngầm (Non-blocking Background Sync + Countdown + SHA Cache)
  async function syncConfigToGitHub(cfg, ghSettings) {
    const buildTimestamp = Date.now().toString();
    const code = generateConfigJsString(cfg, buildTimestamp);
    const branch = ghSettings.branch || 'main';
    const apiUrl = `https://api.github.com/repos/${ghSettings.repo}/contents/config.js?ref=${encodeURIComponent(branch)}`;
    const putUrl = `https://api.github.com/repos/${ghSettings.repo}/contents/config.js`;

    // Mã hóa Base64 chuẩn UTF-8
    const base64Content = btoa(encodeURIComponent(code).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));

    // Tính kích thước dung lượng thực tế gửi đi (KB)
    const payloadSizeKb = Math.max(1, Math.round((base64Content.length * 0.75) / 1024));

    // Khởi động giao diện đếm ngược đồng bộ (bao gồm cả Vercel)
    SyncCountdownManager.start(payloadSizeKb, buildTimestamp, () => {
      syncConfigToGitHub(cfg, ghSettings);
    });

    try {
      // TỐI ƯU 3: Lấy SHA từ bộ nhớ đệm (Cache) để giảm 50% thời gian gọi mạng
      let sha = sessionStorage.getItem('wedding_config_sha') || null;

      async function fetchFreshSha() {
        const getRes = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${ghSettings.token}`,
            'Accept': 'application/vnd.github+json'
          }
        });
        if (getRes.ok) {
          const getData = await getRes.json();
          return getData.sha;
        } else if (getRes.status === 404) {
          return null;
        } else {
          const errData = await getRes.json().catch(() => ({}));
          throw new Error(errData.message || `Lỗi kiểm tra GitHub (${getRes.status})`);
        }
      }

      async function sendPut(commitSha) {
        return await fetch(putUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${ghSettings.token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Cập nhật cấu hình thiệp cưới từ Web Admin',
            content: base64Content,
            sha: commitSha || undefined,
            branch: branch
          })
        });
      }

      // Nếu chưa có SHA trong cache, lấy mới
      if (!sha) {
        sha = await fetchFreshSha();
      }

      // Gửi PUT commit trực tiếp lên GitHub
      let putRes = await sendPut(sha);

      // Nếu trả về lỗi 409 (Conflict - SHA hết hạn): Tự động lấy lại SHA mới nhất và thử lại ngay
      if (putRes.status === 409) {
        console.warn('SHA cache hết hạn, đang lấy SHA mới và gửi lại...');
        sha = await fetchFreshSha();
        putRes = await sendPut(sha);
      }

      if (!putRes.ok) {
        const putErr = await putRes.json().catch(() => ({}));
        throw new Error(putErr.message || `Lỗi ghi file GitHub (${putRes.status})`);
      }

      const putData = await putRes.json().catch(() => ({}));
      if (putData.content && putData.content.sha) {
        sessionStorage.setItem('wedding_config_sha', putData.content.sha);
      }

      // Chuyển sang Giai đoạn 2: Vercel đang xuất bản web!
      SyncCountdownManager.onGitHubCommitted(putData.content?.sha);
    } catch (err) {
      console.error('GitHub API Background Sync Error:', err);
      SyncCountdownManager.error(err.message, () => {
        syncConfigToGitHub(cfg, ghSettings);
      });
    }
  }

  // --- MODULE QUẢN LÝ THIỆP GỬI KHÁCH ---
  const guestModal = document.getElementById('admin-guest-modal');
  const btnOpenGuest = document.getElementById('admin-btn-create-guest');
  const guestModalClose = document.getElementById('admin-guest-modal-close');
  const guestListClose = document.getElementById('admin-guest-list-close');

  const tabBtnCreate = document.getElementById('tab-btn-create-guest');
  const tabBtnList = document.getElementById('tab-btn-guest-list');
  const tabPaneCreate = document.getElementById('tab-pane-create-guest');
  const tabPaneList = document.getElementById('tab-pane-guest-list');

  const guestPronounSelect = document.getElementById('admin-guest-pronoun');
  const guestFullnameInput = document.getElementById('admin-guest-fullname');
  const guestDisplaynameInput = document.getElementById('admin-guest-displayname');
  const guestSlugInput = document.getElementById('admin-guest-slug');
  const guestConfirmBtn = document.getElementById('admin-guest-confirm-btn');

  const guestResultBox = document.getElementById('admin-guest-result-box');
  const guestResultUrl = document.getElementById('admin-guest-result-url');
  const btnCopyResultLink = document.getElementById('admin-btn-copy-result-link');
  const linkPreviewResult = document.getElementById('admin-link-preview-result');

  const guestCountBadge = document.getElementById('guest-count-badge');
  const totalGuestsCount = document.getElementById('admin-total-guests-count');
  const guestTbody = document.getElementById('admin-guest-tbody');
  const guestEmptyMsg = document.getElementById('admin-guest-empty-msg');
  const btnCopyAllLinks = document.getElementById('admin-btn-copy-all-links');

  const labelBride = document.getElementById('label-guest-bride');
  const labelGroom = document.getElementById('label-guest-groom');

  // Nút Khôi Phục Git
  const btnRevert = document.getElementById('admin-btn-revert');

  function slugifyVietnamese(text) {
    if (!text) return 'khach';
    let t = text.replace(/đ/g, 'd').replace(/Đ/g, 'D');
    t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'khach';
  }

  function autoSuggestGuestFields() {
    const pronoun = guestPronounSelect ? guestPronounSelect.value.trim() : 'Chị';
    const fullname = guestFullnameInput ? guestFullnameInput.value.trim() : '';
    
    let shortName = fullname;
    const parts = fullname.split(/\s+/).filter(Boolean);
    if (parts.length > 0) {
      shortName = parts[parts.length - 1];
    }
    
    const suggestedDisplay = shortName ? `${pronoun} ${shortName}` : pronoun;
    if (guestDisplaynameInput && (!guestDisplaynameInput.value || guestDisplaynameInput.dataset.autoGenerated === 'true')) {
      guestDisplaynameInput.value = suggestedDisplay;
      guestDisplaynameInput.dataset.autoGenerated = 'true';
    }

    const currentDisplay = (guestDisplaynameInput && guestDisplaynameInput.value.trim()) || suggestedDisplay;
    const slugName = slugifyVietnamese(currentDisplay);
    const suggestedSlug = `Thiep_cuoi_gui_${slugName}`;

    if (guestSlugInput && (!guestSlugInput.value || guestSlugInput.dataset.autoGenerated === 'true')) {
      guestSlugInput.value = suggestedSlug;
      guestSlugInput.dataset.autoGenerated = 'true';
    }
  }

  if (guestPronounSelect) guestPronounSelect.addEventListener('change', () => {
    if (guestDisplaynameInput) guestDisplaynameInput.dataset.autoGenerated = 'true';
    if (guestSlugInput) guestSlugInput.dataset.autoGenerated = 'true';
    autoSuggestGuestFields();
  });

  if (guestFullnameInput) guestFullnameInput.addEventListener('input', () => {
    autoSuggestGuestFields();
  });

  if (guestDisplaynameInput) {
    guestDisplaynameInput.addEventListener('input', () => {
      guestDisplaynameInput.dataset.autoGenerated = 'false';
      const slugName = slugifyVietnamese(guestDisplaynameInput.value.trim());
      if (guestSlugInput && guestSlugInput.dataset.autoGenerated !== 'false') {
        guestSlugInput.value = `Thiep_cuoi_gui_${slugName}`;
      }
    });
  }

  if (guestSlugInput) {
    guestSlugInput.addEventListener('input', () => {
      guestSlugInput.dataset.autoGenerated = 'false';
    });
  }

  function updateGuestOfToggle(choice) {
    if (choice === 'groom') {
      if (labelBride) labelBride.classList.remove('active');
      if (labelGroom) labelGroom.classList.add('active');
      const r = document.querySelector('input[name="admin_guest_of_choice"][value="groom"]');
      if (r) r.checked = true;
    } else {
      if (labelGroom) labelGroom.classList.remove('active');
      if (labelBride) labelBride.classList.add('active');
      const r = document.querySelector('input[name="admin_guest_of_choice"][value="bride"]');
      if (r) r.checked = true;
    }
  }

  if (labelBride) labelBride.addEventListener('click', () => updateGuestOfToggle('bride'));
  if (labelGroom) labelGroom.addEventListener('click', () => updateGuestOfToggle('groom'));

  function switchGuestTab(tabName) {
    if (tabName === 'list') {
      if (tabBtnCreate) tabBtnCreate.classList.remove('active');
      if (tabBtnList) tabBtnList.classList.add('active');
      if (tabPaneCreate) tabPaneCreate.style.display = 'none';
      if (tabPaneList) tabPaneList.style.display = 'block';
      renderGuestTable();
    } else {
      if (tabBtnList) tabBtnList.classList.remove('active');
      if (tabBtnCreate) tabBtnCreate.classList.add('active');
      if (tabPaneList) tabPaneList.style.display = 'none';
      if (tabPaneCreate) tabPaneCreate.style.display = 'block';
    }
  }

  if (tabBtnCreate) tabBtnCreate.addEventListener('click', () => switchGuestTab('create'));
  if (tabBtnList) tabBtnList.addEventListener('click', () => switchGuestTab('list'));

  if (btnOpenGuest) {
    btnOpenGuest.addEventListener('click', () => {
      openModal(guestModal);
      switchGuestTab('create');
      updateGuestCountBadge();
      loadGuestsFromGitHub();
    });
  }

  if (guestModalClose) guestModalClose.addEventListener('click', () => closeModal(guestModal));
  if (guestListClose) guestListClose.addEventListener('click', () => closeModal(guestModal));

  function getLocalGuests() {
    try {
      return JSON.parse(localStorage.getItem('wedding_guest_list') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveLocalGuests(list) {
    localStorage.setItem('wedding_guest_list', JSON.stringify(list));
    updateGuestCountBadge();
  }

  function updateGuestCountBadge() {
    const list = getLocalGuests();
    if (guestCountBadge) guestCountBadge.innerText = list.length.toString();
    if (totalGuestsCount) totalGuestsCount.innerText = list.length.toString();
  }

  async function syncGuestsToGitHub(list) {
    const ghSettings = loadGitHubSettings();
    if (!ghSettings.repo || !ghSettings.token) return;

    try {
      const branch = ghSettings.branch || 'main';
      const apiUrl = `https://api.github.com/repos/${ghSettings.repo}/contents/guests.json?ref=${encodeURIComponent(branch)}`;

      let sha = null;
      const getRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${ghSettings.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      }

      const jsonString = JSON.stringify(list, null, 2);
      const base64Content = btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));

      const putUrl = `https://api.github.com/repos/${ghSettings.repo}/contents/guests.json`;
      await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ghSettings.token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Cập nhật danh sách khách mời từ Web Admin',
          content: base64Content,
          sha: sha || undefined,
          branch: branch
        })
      });
    } catch (err) {
      console.warn('Không thể đồng bộ guests.json lên GitHub:', err);
    }
  }

  async function loadGuestsFromGitHub() {
    const ghSettings = loadGitHubSettings();
    if (!ghSettings.repo || !ghSettings.token) return;

    try {
      const branch = ghSettings.branch || 'main';
      const apiUrl = `https://api.github.com/repos/${ghSettings.repo}/contents/guests.json?ref=${encodeURIComponent(branch)}`;
      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${ghSettings.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const decoded = decodeURIComponent(escape(atob(data.content)));
        const list = JSON.parse(decoded);
        if (Array.isArray(list)) {
          saveLocalGuests(list);
          renderGuestTable();
        }
      }
    } catch (e) {}
  }

  if (guestConfirmBtn) {
    guestConfirmBtn.addEventListener('click', async () => {
      const pronoun = guestPronounSelect ? guestPronounSelect.value.trim() : 'Chị';
      const fullName = guestFullnameInput ? guestFullnameInput.value.trim() : '';
      const displayName = guestDisplaynameInput ? guestDisplaynameInput.value.trim() : `${pronoun} ${fullName}`;
      const slugInputVal = guestSlugInput ? guestSlugInput.value.trim().replace(/^\/+|\/+$/g, '') : '';

      if (!fullName && !displayName) {
        alert('Vui lòng nhập họ tên hoặc tên hiển thị trên thiệp!');
        return;
      }

      const slug = slugInputVal || `Thiep_cuoi_gui_${slugifyVietnamese(displayName)}`;
      const guestOfChoice = document.querySelector('input[name="admin_guest_of_choice"]:checked')?.value || 'bride';

      const fullUrl = `${window.location.origin}/${slug}`;

      const newGuest = {
        id: 'g_' + Date.now(),
        pronoun,
        fullName: fullName || displayName,
        displayName,
        guestOf: guestOfChoice,
        slug,
        fullUrl,
        createdAt: new Date().toLocaleString('vi-VN')
      };

      const list = getLocalGuests();
      const existingIdx = list.findIndex(g => g.slug === slug);
      if (existingIdx >= 0) {
        list[existingIdx] = newGuest;
      } else {
        list.unshift(newGuest);
      }

      saveLocalGuests(list);
      syncGuestsToGitHub(list);

      if (guestResultBox && guestResultUrl) {
        guestResultUrl.value = fullUrl;
        if (linkPreviewResult) linkPreviewResult.href = fullUrl;
        guestResultBox.style.display = 'block';
        guestResultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      showAdminToast(`🎉 Đã tạo thiệp cho "${displayName}" thành công!`);
    });
  }

  if (btnCopyResultLink) {
    btnCopyResultLink.addEventListener('click', () => {
      if (guestResultUrl && guestResultUrl.value) {
        navigator.clipboard.writeText(guestResultUrl.value).then(() => {
          showAdminToast('✓ Đã sao chép đường link thiệp gửi khách!');
        }).catch(() => {
          showAdminToast('Link: ' + guestResultUrl.value);
        });
      }
    });
  }

  function renderGuestTable() {
    const list = getLocalGuests();
    if (!guestTbody) return;

    if (list.length === 0) {
      guestTbody.innerHTML = '';
      if (guestEmptyMsg) guestEmptyMsg.style.display = 'block';
      return;
    }

    if (guestEmptyMsg) guestEmptyMsg.style.display = 'none';

    guestTbody.innerHTML = list.map((g) => {
      const guestOfLabel = g.guestOf === 'groom' ? '🤵 Chú rể' : '👰 Cô dâu';
      return `
        <tr>
          <td><b class="text-[#8B263E]">${g.displayName || ''}</b></td>
          <td>${g.fullName || ''}</td>
          <td><span class="text-xs font-medium">${guestOfLabel}</span></td>
          <td><code class="text-xs text-[#1E3A8A]">/${g.slug}</code></td>
          <td style="text-align:right; white-space:nowrap;">
            <button type="button" class="admin-tbl-btn admin-tbl-copy" data-url="${g.fullUrl}" title="Sao chép link">📋 Copy</button>
            <a href="${g.fullUrl}" target="_blank" class="admin-tbl-btn admin-tbl-view" title="Xem thử thiệp">👁️ Xem</a>
            <button type="button" class="admin-tbl-btn admin-tbl-del" data-id="${g.id}" title="Xóa khách này">🗑️ Xóa</button>
          </td>
        </tr>
      `;
    }).join('');

    guestTbody.querySelectorAll('.admin-tbl-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        if (url) {
          navigator.clipboard.writeText(url).then(() => {
            showAdminToast('✓ Đã sao chép link!');
          });
        }
      });
    });

    guestTbody.querySelectorAll('.admin-tbl-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Bạn có chắc chắn muốn xóa thiệp của khách mời này không?')) return;
        const currentList = getLocalGuests().filter(g => g.id !== id);
        saveLocalGuests(currentList);
        syncGuestsToGitHub(currentList);
        renderGuestTable();
        showAdminToast('Đã xóa khách mời khỏi danh sách.');
      });
    });
  }

  if (btnCopyAllLinks) {
    btnCopyAllLinks.addEventListener('click', () => {
      const list = getLocalGuests();
      if (list.length === 0) {
        alert('Danh sách đang trống!');
        return;
      }
      const text = list.map(g => `${g.displayName} (${g.fullName}) - ${g.guestOf === 'groom' ? 'Khách Chú rể' : 'Khách Cô dâu'}: ${g.fullUrl}`).join('\n');
      navigator.clipboard.writeText(text).then(() => {
        showAdminToast('✓ Đã sao chép toàn bộ danh sách link khách mời!');
      });
    });
  }

  // Nút [🔄 Khôi Phục] (Reset / Revert từ Git)
  if (btnRevert) {
    btnRevert.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc chắn muốn hủy các chỉnh sửa chưa lưu và khôi phục lại dữ liệu gần nhất từ GitHub không?')) return;

      try {
        localStorage.removeItem('wedding_config_local_draft');
        localStorage.removeItem('wedding_config_draft_time');
      } catch (e) {}

      const ghSettings = loadGitHubSettings();
      showAdminToast('⏳ Đang khôi phục dữ liệu gần nhất...');

      try {
        let loadedConfig = null;
        if (ghSettings.repo && ghSettings.token) {
          const branch = ghSettings.branch || 'main';
          const apiUrl = `https://api.github.com/repos/${ghSettings.repo}/contents/config.js?ref=${encodeURIComponent(branch)}`;
          const res = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${ghSettings.token}`,
              'Accept': 'application/vnd.github+json'
            }
          });
          if (res.ok) {
            const data = await res.json();
            const decodedCode = decodeURIComponent(escape(atob(data.content)));
            const fn = new Function(decodedCode + '; return typeof WEDDING_CONFIG !== "undefined" ? WEDDING_CONFIG : null;');
            loadedConfig = fn();
          }
        }

        if (loadedConfig) {
          window.WEDDING_CONFIG = loadedConfig;
        }

        if (typeof applyWeddingConfig === 'function') {
          applyWeddingConfig();
        }

        document.querySelectorAll('[data-bind]').forEach(el => {
          el.setAttribute('contenteditable', 'true');
          el.setAttribute('spellcheck', 'false');
        });

        showAdminToast('🔄 Đã khôi phục lại dữ liệu gốc từ GitHub thành công!');
      } catch (err) {
        console.error('Lỗi khi khôi phục:', err);
        alert('Không thể tải từ GitHub: ' + err.message + '\nĐang nạp lại từ bộ nhớ trình duyệt...');
        if (typeof applyWeddingConfig === 'function') applyWeddingConfig();
      }
    });
  }

  let adminToastTimer = null;
  function showAdminToast(msg) {
    const toast = document.getElementById('toast-notice');
    if (toast) {
      toast.innerHTML = msg;
      toast.classList.add('show');
      if (typeof applyToastCenterStyles === 'function') {
        applyToastCenterStyles(toast, true);
      }
      if (adminToastTimer) clearTimeout(adminToastTimer);
      adminToastTimer = setTimeout(() => {
        toast.classList.remove('show');
        if (typeof applyToastCenterStyles === 'function') {
          applyToastCenterStyles(toast, false);
        }
      }, 3500);
    } else {
      alert(msg);
    }
  }

  // 12. Kích hoạt định tuyến & kiểm tra hash sau khi toàn bộ module đã sẵn sàng
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}


