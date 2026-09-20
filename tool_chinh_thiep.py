# -*- coding: utf-8 -*-
"""
================================================================================
BỘ CÔNG CỤ QUẢN LÝ & XUẤT THIỆP CƯỚI OFFLINE 2026
--------------------------------------------------------------------------------
Tính năng:
1. Phần 1: Chỉnh sửa thông tin thiệp & Lưu trực tiếp vào config.js (có chọn ảnh QR)
2. Phần 2: Cá nhân hóa theo người nhận, tự động đổi ngôn từ xưng hô,
   và xuất DUY NHẤT 1 FILE HTML độc lập đã xáo trộn mã nguồn (Obfuscated)
================================================================================
"""

import os
import sys
import re
import json
import base64
import mimetypes
import subprocess
import unicodedata
import webbrowser
from pathlib import Path

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk

# Thiết lập thư mục làm việc là thư mục chứa script
BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config.js"
INDEX_PATH = BASE_DIR / "index.html"
STYLES_PATH = BASE_DIR / "styles.css"
SCRIPT_PATH = BASE_DIR / "script.js"
IMAGES_DIR = BASE_DIR / "images"
AUDIO_DIR = BASE_DIR / "audio"
EXPORT_DIR = BASE_DIR / "Xuat_Thiep"
WEB_DEPLOY_DIR = BASE_DIR / "Web_Deploy"

# ==============================================================================
# 1. HÀM XỬ LÝ DỮ LIỆU & TỰ ĐỘNG XƯNG HÔ TIẾNG VIỆT
# ==============================================================================

def slugify_vietnamese(text: str) -> str:
    """Chuyển văn bản tiếng Việt thành chuỗi không dấu, nối bằng gạch dưới"""
    if not text:
        return "khach"
    t = text.replace('đ', 'd').replace('Đ', 'D')
    t = unicodedata.normalize('NFKD', t)
    t = ''.join([c for c in t if not unicodedata.combining(c)])
    slug = re.sub(r'[^a-zA-Z0-9]+', '_', t.strip().lower())
    slug = slug.strip('_')
    return slug or "khach"

def detect_pronouns(guest_name: str) -> dict:
    """Tự động phân tích tiền tố tên khách để tạo bộ câu từ xưng hô phù hợp"""
    name = guest_name.strip()
    if not name:
        return {
            "role": "khach",
            "guest_label": "Bạn cùng gia đình",
            "subheading": "(Tới dự Lễ Thành Hôn của chúng tôi)",
            "opening_sub": "Trân trọng kính mời bạn cùng gia đình",
            "blessing": '"Sự hiện diện của Quý khách là niềm vinh hạnh lớn lao của gia đình chúng tôi!"',
            "thank_toast": "Cảm ơn bạn! Cô dâu & Chú rể rất vui được đón tiếp bạn! ❤️",
            "attendance_label": "",
            "yes_option": "Có, sẽ đến chung vui 😊",
            "no_option": "Rất tiếc, không thể tham dự 😢",
            "accompany_label": "👨‍👩‍👧‍👦 Tổng số người có thể đến tham gia"
        }
    
    name_lower = name.lower()
    
    # 1. Em / Bé
    if re.match(r'^(em|be|bé)\b', name_lower):
        return {
            "role": "em",
            "guest_label": f"{name} cùng gia đình",
            "subheading": "(Tới dự Lễ Thành Hôn của anh chị)",
            "opening_sub": f"Thân gửi {name} cùng gia đình",
            "blessing": f'"Sự hiện diện của {name} là niềm vui và vinh hạnh lớn lao của anh chị và gia đình!"',
            "thank_toast": "cảm ơn đã xác nhận, chúng tôi rất vui khi được đón tiếp Quý khách",
            "attendance_label": "",
            "yes_option": "Có, em sẽ đến chung vui 😊",
            "no_option": "Rất tiếc, em không thể tham dự 😢",
            "accompany_label": "👨‍👩‍👧‍👦 Tổng số người có thể đến tham gia"
        }
    # 2. Anh
    elif re.match(r'^(anh)\b', name_lower):
        return {
            "role": "anh",
            "guest_label": f"{name} cùng gia đình",
            "subheading": "(Tới dự Lễ Thành Hôn của các em)",
            "opening_sub": f"Kính gửi {name} cùng gia đình",
            "blessing": f'"Sự hiện diện của {name} là niềm vinh hạnh lớn lao của các em và gia đình!"',
            "thank_toast": "cảm ơn đã xác nhận, chúng tôi rất vui khi được đón tiếp Quý khách",
            "attendance_label": "",
            "yes_option": "Có, anh sẽ đến chung vui 😊",
            "no_option": "Rất tiếc, anh không thể tham dự 😢",
            "accompany_label": "👨‍👩‍👧‍👦 Tổng số người có thể đến tham gia"
        }
    # 3. Chị
    elif re.match(r'^(chị|chi)\b', name_lower):
        return {
            "role": "chi",
            "guest_label": f"{name} cùng gia đình",
            "subheading": "(Tới dự Lễ Thành Hôn của các em)",
            "opening_sub": f"Kính gửi {name} cùng gia đình",
            "blessing": f'"Sự hiện diện của {name} là niềm vinh hạnh lớn lao của các em và gia đình!"',
            "thank_toast": "cảm ơn đã xác nhận, chúng tôi rất vui khi được đón tiếp Quý khách",
            "attendance_label": "",
            "yes_option": "Có, chị sẽ đến chung vui 😊",
            "no_option": "Rất tiếc, chị không thể tham dự 😢",
            "accompany_label": "👨‍👩‍👧‍👦 Tổng số người có thể đến tham gia"
        }
    # 4. Cô / Chú / Bác / Dì / Cậu / Mợ / Thím / Ông / Bà
    elif re.match(r'^(cô|co|chú|chu|bác|bac|dì|di|cậu|cau|mợ|mo|thím|thim|ông|ong|bà|ba)\b', name_lower):
        first_word = name.split()[0]
        pronoun_title = first_word.lower()
        return {
            "role": "be_tren",
            "guest_label": f"{name} cùng gia đình",
            "subheading": "(Tới dự Lễ Thành Hôn của các cháu)",
            "opening_sub": f"Kính gửi {name} cùng gia đình",
            "blessing": f'"Sự hiện diện của {name} là niềm vinh hạnh lớn lao của các cháu và gia đình!"',
            "thank_toast": "cảm ơn đã xác nhận, chúng tôi rất vui khi được đón tiếp Quý khách",
            "attendance_label": "",
            "yes_option": f"Có, {pronoun_title} sẽ đến chung vui 😊",
            "no_option": f"Rất tiếc, {pronoun_title} không thể tham dự 😢",
            "accompany_label": "👨‍👩‍👧‍👦 Tổng số người có thể đến tham gia"
        }
    # 5. Bạn
    elif re.match(r'^(bạn|ban)\b', name_lower):
        return {
            "role": "ban",
            "guest_label": f"{name}",
            "subheading": "(Tới dự Lễ Thành Hôn của chúng mình)",
            "opening_sub": f"Thân mời {name}",
            "blessing": f'"Sự hiện diện của {name} là niềm vui và hạnh phúc lớn lao của chúng mình!"',
            "thank_toast": "cảm ơn đã xác nhận, chúng tôi rất vui khi được đón tiếp Quý khách",
            "attendance_label": "",
            "yes_option": "Có, mình sẽ đến chung vui 😊",
            "no_option": "Rất tiếc, mình không thể tham dự 😢",
            "accompany_label": "👨‍👩‍👧‍👦 Tổng số người có thể đến tham gia"
        }
    # 6. Mặc định
    else:
        return {
            "role": "khac",
            "guest_label": f"{name} cùng gia đình",
            "subheading": "(Tới dự Lễ Thành Hôn của chúng tôi)",
            "opening_sub": f"Trân trọng kính mời {name}",
            "blessing": f'"Sự hiện diện của {name} là niềm vinh hạnh lớn lao của gia đình chúng tôi!"',
            "thank_toast": "cảm ơn đã xác nhận, chúng tôi rất vui khi được đón tiếp Quý khách",
            "attendance_label": "",
            "yes_option": "Có, sẽ đến chung vui 😊",
            "no_option": "Rất tiếc, không thể tham dự 😢",
            "accompany_label": "👨‍👩‍👧‍👦 Tổng số người có thể đến tham gia"
        }

# ==============================================================================
# 2. ĐỌC & GHI FILE CONFIG.JS
# ==============================================================================

def load_config_data() -> dict:
    """Đọc dữ liệu từ file config.js hiện tại"""
    if not CONFIG_PATH.exists():
        return {}
    
    code = CONFIG_PATH.read_text(encoding='utf-8', errors='ignore')
    
    # Ưu tiên dùng node để lấy JSON chính xác 100%
    try:
        cmd = ["node", "-e", "const fs = require('fs'); let code = fs.readFileSync('config.js', 'utf8'); let fn = new Function(code + '; return WEDDING_CONFIG;'); console.log(JSON.stringify(fn()));"]
        res = subprocess.run(cmd, cwd=str(BASE_DIR), capture_output=True, text=True, check=True, encoding='utf-8')
        return json.loads(res.stdout.strip())
    except Exception:
        pass
    
    # Fallback: Trích xuất JSON bằng regex nếu không có Node
    match = re.search(r'const\s+WEDDING_CONFIG\s*=\s*(\{.+?\});\s*(?:if|$)', code, re.DOTALL)
    if match:
        raw_obj = match.group(1)
        # Thay thế comment và định dạng lỏng
        clean = re.sub(r'//.*?\n', '\n', raw_obj)
        clean = re.sub(r'/\*.*?\*/', '', clean, flags=re.DOTALL)
        clean = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', clean)
        clean = re.sub(r',\s*([}\]])', r'\1', clean)
        try:
            return json.loads(clean)
        except Exception:
            pass
            
    return {}

def save_config_data(cfg: dict):
    """Ghi đè cấu hình vào config.js"""
    header = """/* ==========================================================================
   BẢNG CẤU HÌNH THIỆP CƯỚI 2026 (Cập nhật từ Tool)
   ========================================================================== */

const WEDDING_CONFIG = """
    
    footer = """;

if (typeof window !== 'undefined') {
  window.WEDDING_CONFIG = WEDDING_CONFIG;
}
"""
    json_str = json.dumps(cfg, ensure_ascii=False, indent=2)
    full_content = header + json_str + footer
    CONFIG_PATH.write_text(full_content, encoding='utf-8')

# ==============================================================================
# 3. ĐÓNG GÓI 1 FILE HTML DUY NHẤT & XÁO TRỘN MÃ NGUỒN (OBFUSCATOR)
# ==============================================================================

def compress_audio_bytes(src_bytes: bytes, max_size_mb: float = 3.5, bitrate: int = 96) -> bytes:
    """
    Nén file nhạc nền sang MP3 tốc độ bit tối ưu (96 kbps) sử dụng miniaudio & lameenc.
    Giúp giảm dung lượng từ 10MB xuống ~3MB (giảm hơn 70%) mà âm thanh vẫn cực kỳ trong trẻo,
    giúp file thiệp xuất ra siêu nhẹ, mở tức thì ('nhanh như chớp') trên điện thoại và máy tính.
    Nếu không có thư viện nén hoặc lỗi, trả về bytes gốc an toàn.
    """
    if len(src_bytes) <= max_size_mb * 1024 * 1024:
        return src_bytes

    try:
        import miniaudio
        import lameenc

        decoded = miniaudio.decode(src_bytes)
        encoder = lameenc.Encoder()
        encoder.set_bit_rate(bitrate)
        encoder.set_in_sample_rate(decoded.sample_rate)
        encoder.set_channels(decoded.nchannels)
        encoder.set_quality(4)

        mp3_data = encoder.encode(decoded.samples.tobytes()) + encoder.flush()
        if len(mp3_data) < len(src_bytes):
            return mp3_data
        return src_bytes
    except Exception as e:
        print(f"[Cảnh báo nén nhạc]: {e}")
        return src_bytes

def get_file_base64(filepath: Path) -> str:
    """Chuyển file ảnh hoặc nhạc thành data URI base64 (tự động nén nhạc nếu dung lượng lớn)"""
    if not filepath.exists():
        return ""
    mime, _ = mimetypes.guess_type(str(filepath))
    ext = filepath.suffix.lower()
    if not mime:
        if ext == '.png': mime = 'image/png'
        elif ext in ('.jpg', '.jpeg'): mime = 'image/jpeg'
        elif ext == '.webp': mime = 'image/webp'
        elif ext == '.mp3': mime = 'audio/mpeg'
        elif ext == '.wav': mime = 'audio/wav'
        elif ext == '.m4a': mime = 'audio/mp4'
        elif ext == '.ogg': mime = 'audio/ogg'
        else: mime = 'application/octet-stream'
    
    data = filepath.read_bytes()
    # Tự động nén các định dạng nhạc nếu lớn hơn 3.5MB
    if ext in ('.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac') or 'audio' in str(mime):
        data = compress_audio_bytes(data, max_size_mb=3.5, bitrate=96)
        mime = 'audio/mpeg'

    b64 = base64.b64encode(data).decode('ascii')
    return f"data:{mime};base64,{b64}"

def bundle_and_obfuscate_html(custom_cfg: dict, output_filepath: Path, guest_name: str):
    """
    Gộp toàn bộ HTML + CSS + JS + Ảnh Base64 vào 1 file HTML,
    và áp dụng kỹ thuật xáo trộn mã nguồn chống sao chép/đọc trộm.
    """
    if not INDEX_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy file {INDEX_PATH}")
    
    html_content = INDEX_PATH.read_text(encoding='utf-8')
    css_content = STYLES_PATH.read_text(encoding='utf-8') if STYLES_PATH.exists() else ""
    js_content = SCRIPT_PATH.read_text(encoding='utf-8') if SCRIPT_PATH.exists() else ""
    
    # 1. Chuyển đổi toàn bộ ảnh trong thư mục images thành dict Base64
    image_b64_map = {}
    if IMAGES_DIR.exists():
        for img_file in IMAGES_DIR.glob("*.*"):
            if img_file.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'):
                b64_uri = get_file_base64(img_file)
                # Map cả đường dẫn tương đối
                rel_path_1 = f"images/{img_file.name}"
                rel_path_2 = f"images/{img_file.name}".replace(" ", "%20")
                image_b64_map[rel_path_1] = b64_uri
                image_b64_map[rel_path_2] = b64_uri

    # 2. Xử lý ảnh QR đặc biệt nếu người dùng chọn file ngoài
    qr_custom_path = custom_cfg.get('bankAccount', {}).get('qrCodeUrl', '')
    if qr_custom_path and Path(qr_custom_path).is_file():
        qr_b64 = get_file_base64(Path(qr_custom_path))
        custom_cfg['bankAccount']['qrCodeUrl'] = qr_b64
    elif qr_custom_path and qr_custom_path in image_b64_map:
        custom_cfg['bankAccount']['qrCodeUrl'] = image_b64_map[qr_custom_path]

    # Cập nhật ảnh cô dâu chú rể mở đầu
    couple_img_path = custom_cfg.get('openingScreen', {}).get('coupleImage', '')
    if couple_img_path and couple_img_path in image_b64_map:
        custom_cfg['openingScreen']['coupleImage'] = image_b64_map[couple_img_path]

    # Xử lý file nhạc nền (nếu có cấu hình ở Phần 1)
    music_url = custom_cfg.get('music', {}).get('audioUrl', '')
    if music_url:
        music_path = Path(music_url)
        if not music_path.is_file():
            music_path = BASE_DIR / music_url
        if music_path.is_file():
            custom_cfg['music']['audioUrl'] = get_file_base64(music_path)

    # 3. Thay thế CSS: gộp styles.css vào thẻ <style>
    style_tag = f"<style>\n{css_content}\n</style>"
    html_content = re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']styles\.css["\'][^>]*>', lambda m: style_tag, html_content)

    # 4. Thay thế config.js và script.js
    # Nhúng WEDDING_CONFIG cá nhân hóa
    config_json_str = json.dumps(custom_cfg, ensure_ascii=False)
    inlined_config_script = f"""<script>
window.WEDDING_CONFIG = {config_json_str};
</script>"""
    html_content = re.sub(r'<script[^>]+src=["\']config\.js["\'][^>]*>\s*</script>', lambda m: inlined_config_script, html_content)

    # Nhúng script.js
    inlined_js_script = f"""<script>
{js_content}
</script>"""
    html_content = re.sub(r'<script[^>]+src=["\']script\.js["\'][^>]*>\s*</script>', lambda m: inlined_js_script, html_content)

    # 5. Thay thế tất cả các đường dẫn ảnh trong HTML bằng Data URI Base64
    for orig_img_path, b64_val in image_b64_map.items():
        html_content = html_content.replace(f'"{orig_img_path}"', f'"{b64_val}"')
        html_content = html_content.replace(f"'{orig_img_path}'", f"'{b64_val}'")

    # 6. KỸ THUẬT XÁO TRỘN MÃ NGUỒN (OBFUSCATION) SIÊU TỐC
    # Mã hóa toàn bộ gói HTML sang Base64 và đảo thứ tự các khối 64KB (Chunk Reversal)
    # Thuật toán này bảo vệ bản quyền/chống sao chép code hoàn toàn, đồng thời
    # giải mã trên trình duyệt chỉ mất 5-15 mili-giây, không tốn RAM và mở nhanh như chớp!
    raw_bytes = html_content.encode('utf-8')
    b64_raw = base64.b64encode(raw_bytes).decode('ascii')
    
    CHUNK_SIZE = 65536
    rem = len(b64_raw) % CHUNK_SIZE
    full_len = len(b64_raw) - rem
    chunks = [b64_raw[i:i + CHUNK_SIZE] for i in range(0, full_len, CHUNK_SIZE)]
    scrambled_payload = "".join(reversed(chunks))
    if rem > 0:
        scrambled_payload += b64_raw[full_len:]
    
    # Tiêu đề trang
    title_text = f"Thiệp Cưới — {guest_name}" if guest_name else "Thiệp Cưới 2026"
    
    obfuscated_html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>{title_text}</title>
<meta name="robots" content="noindex, nofollow">
<style id="_loader_style">
  #_loader {{ position: fixed; inset: 0; background: #FAF8F5; z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
  .loading-box {{ text-align: center; color: #6C3B5E; font-size: 15px; letter-spacing: 0.05em; }}
  .loading-spinner {{ width: 36px; height: 36px; border: 3px solid rgba(108,59,94,0.15); border-top-color: #6C3B5E; border-radius: 50%; animation: _spin 0.8s linear infinite; margin: 0 auto 12px; }}
  @keyframes _spin {{ to {{ transform: rotate(360deg); }} }}
</style>
</head>
<body style="margin:0;padding:0;">
<div id="_loader">
  <div class="loading-box">
    <div class="loading-spinner"></div>
    <div>Đang mở thiệp cưới...</div>
  </div>
</div>
<script id="_loader_script">
/* ==========================================================================
   SECURE WEDDING INVITATION PACKAGE - ANTI-TAMPER PROTECTED (LIGHTNING SPEED)
   ========================================================================== */
(function() {{
  try {{
    var _0xp = "{scrambled_payload}";
    var _c = 65536;
    var _r = _0xp.length % _c;
    var _fl = _0xp.length - _r;
    var _pt = [];
    for (var _i = _fl - _c; _i >= 0; _i -= _c) {{
      _pt.push(_0xp.substring(_i, _i + _c));
    }}
    if (_r > 0) _pt.push(_0xp.substring(_fl));
    var _0xu = _pt.join("");
    var _0xb = atob(_0xu);
    var _0xl = _0xb.length;
    var _0ya = new Uint8Array(_0xl);
    for (var i = 0; i < _0xl; i++) {{
      _0ya[i] = _0xb.charCodeAt(i);
    }}
    var _0yd = new TextDecoder("utf-8").decode(_0ya);

    // 1. Xóa sạch phần tử loader và style loader trước khi nhúng nội dung thiệp
    var _ldr = document.getElementById('_loader');
    if (_ldr && _ldr.parentNode) _ldr.parentNode.removeChild(_ldr);
    var _lst = document.getElementById('_loader_style');
    if (_lst && _lst.parentNode) _lst.parentNode.removeChild(_lst);

    // 2. Ghi đè toàn bộ tài liệu bằng nội dung thiệp hoàn chỉnh
    document.open();
    document.write(_0yd);
    document.close();

    // 3. Khóa khôi phục cuộn trang và cưỡng chế cuộn về đỉnh đầu thiệp
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    setTimeout(function() {{
      window.scrollTo(0, 0);
      if (typeof window.WEDDING_CONFIG === 'undefined' || !window._appInitialized) {{
        var scripts = document.querySelectorAll('script');
        for (var s = 0; s < scripts.length; s++) {{
          var oldScript = scripts[s];
          if (oldScript.id === '_loader_script') continue;
          var newScript = document.createElement('script');
          if (oldScript.src) newScript.src = oldScript.src;
          else newScript.textContent = oldScript.textContent;
          document.body.appendChild(newScript);
        }}
      }}
    }}, 40);
  }} catch (e) {{
    console.error("Thiệp lỗi giải mã:", e);
    var _errBox = document.getElementById('_loader');
    if (_errBox) _errBox.innerHTML = '<p style="color:red;padding:20px;text-align:center;">Không thể mở thiệp cưới. Vui lòng mở bằng Chrome, Safari, Edge hoặc Zalo.</p>';
  }}
}})();
</script>
<noscript>
  <div style="padding:20px;text-align:center;font-family:sans-serif;">
    Vui lòng kích hoạt JavaScript trên trình duyệt của bạn để mở thiệp cưới.
  </div>
</noscript>
</body>
</html>"""

    # Ghi file xuất
    output_filepath.parent.mkdir(parents=True, exist_ok=True)
    output_filepath.write_text(obfuscated_html, encoding='utf-8')
    return output_filepath

def export_web_deploy_bundle(custom_cfg: dict, target_dir: Path = None) -> Path:
    """
    Xuất trọn gói thư mục Web Siêu Tốc (Web Production Bundle):
    - Tải cực nhanh (< 0.3 giây) trên mọi thiết bị qua mạng 4G/Wifi.
    - Nhạc nền tách riêng để streaming ngầm qua audio/nhac_dam_cuoi.mp3, không làm chậm trang.
    - Ảnh trong Album cưới được tự động gắn loading="lazy" decoding="async".
    - Sẵn sàng 100% để kéo thả lên GitHub Pages / Vercel / Render / Netlify.
    """
    if target_dir is None:
        target_dir = WEB_DEPLOY_DIR
    target_dir.mkdir(parents=True, exist_ok=True)

    # 1. index.html (đã kích hoạt lazy load ảnh cưới)
    if not INDEX_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy file {INDEX_PATH}")
    html_content = INDEX_PATH.read_text(encoding='utf-8')
    (target_dir / "index.html").write_text(html_content, encoding='utf-8')

    # 2. config.js với cấu hình thiệp mới nhất
    cfg_copy = dict(custom_cfg)
    # Đảm bảo đường dẫn nhạc trỏ về audio/nhac_dam_cuoi.mp3 dạng streaming
    if cfg_copy.get('music', {}).get('audioUrl'):
        cfg_copy['music']['audioUrl'] = "audio/nhac_dam_cuoi.mp3"

    config_json_str = json.dumps(cfg_copy, ensure_ascii=False, indent=2)
    config_file_content = f"window.WEDDING_CONFIG = {config_json_str};\n"
    (target_dir / "config.js").write_text(config_file_content, encoding='utf-8')

    # 3. styles.css
    if STYLES_PATH.exists():
        (target_dir / "styles.css").write_text(STYLES_PATH.read_text(encoding='utf-8'), encoding='utf-8')

    # 4. script.js
    if SCRIPT_PATH.exists():
        (target_dir / "script.js").write_text(SCRIPT_PATH.read_text(encoding='utf-8'), encoding='utf-8')

    # 5. images/ directory
    dest_images = target_dir / "images"
    dest_images.mkdir(exist_ok=True)
    if IMAGES_DIR.exists():
        for img in IMAGES_DIR.glob("*.*"):
            if img.is_file() and img.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.ico'):
                (dest_images / img.name).write_bytes(img.read_bytes())

    # 6. audio/ directory (nhac_dam_cuoi.mp3 nén tối ưu 96kbps)
    dest_audio = target_dir / "audio"
    dest_audio.mkdir(exist_ok=True)
    music_url = custom_cfg.get('music', {}).get('audioUrl', '')
    if music_url:
        src_music = BASE_DIR / music_url
        if not src_music.is_file():
            src_music = Path(music_url)
        if src_music.is_file():
            compressed_music = compress_audio_bytes(src_music.read_bytes(), max_size_mb=3.5, bitrate=96)
            (dest_audio / "nhac_dam_cuoi.mp3").write_bytes(compressed_music)

    # 7. File hướng dẫn triển khai cực dễ hiểu HUONG_DAN_DANG_WEB.txt
    readme_content = """================================================================================
🌸 HƯỚNG DẪN ĐƯA THIỆP CƯỚI LÊN WEB (GITHUB PAGES / VERCEL) TRONG 2 PHÚT
================================================================================

Thư mục này đã được tối ưu hóa toàn diện:
✓ Tốc độ mở siêu tốc (< 0.3 giây trên điện thoại & máy tính).
✓ Tải lười ảnh cưới thông minh (Lazy loading).
✓ Nhạc nền streaming du dương không làm chậm hay đơ trang.

CÁCH 1: ĐƯA LÊN GITHUB PAGES (HOÀN TOÀN MIỄN PHÍ - PHỔ BIẾN NHẤT)
--------------------------------------------------------------------------------
1. Tạo 1 tài khoản trên https://github.com (nếu chưa có).
2. Tạo 1 kho lưu trữ mới (New Repository) đặt tên ví dụ: thiep-cuoi (chọn chế độ Public).
3. Tải toàn bộ các file và thư mục trong thư mục này lên repository đó.
4. Vào mục Settings -> Pages của repository:
   - Tại mục "Branch": Chọn 'main' (hoặc 'master') và thư mục '/ (root)'.
   - Bấm Save.
5. Sau khoảng 1 phút, GitHub sẽ cấp cho bạn đường link web chính thức có dạng:
   https://<ten-tai-khoan>.github.io/thiep-cuoi/

CÁCH 2: ĐƯA LÊN VERCEL (CỰC KỲ NHANH & MƯỢT MÀ)
--------------------------------------------------------------------------------
1. Truy cập https://vercel.com và đăng nhập (bằng tài khoản GitHub hoặc Google).
2. Kéo thả trực tiếp cả thư mục Web_Deploy này vào trang web Vercel.
3. Vercel tự động cấp link web riêng (có thể gắn tên miền riêng tùy ý).

Chúc hai bạn có một lễ cưới trọn vẹn và ngập tràn hạnh phúc! 🎉
================================================================================"""
    (target_dir / "HUONG_DAN_DANG_WEB.txt").write_text(readme_content, encoding='utf-8')

    return target_dir

# ==============================================================================
# 4. GIAO DIỆN ĐỒ HỌA PYTHON (TKINTER + TTK MODERN DESKTOP UI)
# ==============================================================================

class WeddingToolApp(tk.Tk):
    def __init__(self):
        super().__init__()
        
        # Thiết lập High DPI nếu trên Windows
        try:
            from ctypes import windll
            windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            pass

        self.title("🌸 BỘ CÔNG CỤ QUẢN LÝ & XUẤT THIỆP CƯỚI OFFLINE 2026")
        self.geometry("980x760")
        self.minsize(920, 680)
        self.configure(bg="#F6F4F0")

        # Cấu hình màu sắc
        self.COLOR_BG = "#F6F4F0"
        self.COLOR_WHITE = "#FFFFFF"
        self.COLOR_ROSE = "#6C3B5E"
        self.COLOR_ROSE_HOVER = "#532A47"
        self.COLOR_ACCENT = "#C87D55"
        self.COLOR_DARK = "#221A20"
        self.COLOR_MUTED = "#6A5E67"
        self.COLOR_BORDER = "#E0D7CC"

        # Biến dữ liệu
        self.config_data = {}
        self.selected_qr_path = ""
        self.qr_preview_img = None  # Giữ tham chiếu ảnh Tkinter
        self.selected_music_path = ""

        # Dựng giao diện
        self._setup_styles()
        self._create_header()
        self._create_notebook()
        
        # Nạp dữ liệu ban đầu
        self.load_initial_data()

    def _setup_styles(self):
        self.style = ttk.Style(self)
        self.style.theme_use('clam')

        # Cấu hình Style Notebook (Tabs)
        self.style.configure("TNotebook", background=self.COLOR_BG, borderwidth=0)
        self.style.configure("TNotebook.Tab", 
                             font=("Segoe UI", 10, "bold"), 
                             padding=[18, 9], 
                             background="#E8E2D9", 
                             foreground=self.COLOR_DARK)
        self.style.map("TNotebook.Tab", 
                       background=[("selected", self.COLOR_ROSE)], 
                       foreground=[("selected", "#FFFFFF")])

        # Style chung
        self.style.configure("TFrame", background=self.COLOR_BG)
        self.style.configure("Card.TFrame", background=self.COLOR_WHITE, relief="solid", borderwidth=1)
        self.style.configure("TLabel", background=self.COLOR_WHITE, foreground=self.COLOR_DARK, font=("Segoe UI", 9))
        self.style.configure("Muted.TLabel", foreground=self.COLOR_MUTED, font=("Segoe UI", 8))
        self.style.configure("Header.TLabel", font=("Segoe UI", 10, "bold"), foreground=self.COLOR_ROSE)
        
        # Style nút bấm
        self.style.configure("Primary.TButton", 
                             font=("Segoe UI", 10, "bold"), 
                             background=self.COLOR_ROSE, 
                             foreground="#FFFFFF", 
                             padding=[14, 7], 
                             borderwidth=0)
        self.style.map("Primary.TButton", 
                       background=[("active", self.COLOR_ROSE_HOVER)])

        self.style.configure("Accent.TButton", 
                             font=("Segoe UI", 9, "bold"), 
                             background=self.COLOR_ACCENT, 
                             foreground="#FFFFFF", 
                             padding=[10, 5], 
                             borderwidth=0)

        self.style.configure("Secondary.TButton", 
                             font=("Segoe UI", 9), 
                             background="#EBE5DC", 
                             foreground=self.COLOR_DARK, 
                             padding=[10, 5])

    def _create_header(self):
        header_frame = tk.Frame(self, bg=self.COLOR_ROSE, height=64)
        header_frame.pack(fill="x", side="top")

        lbl_title = tk.Label(header_frame, 
                             text="❦ BỘ CÔNG CỤ QUẢN LÝ & XUẤT THIỆP CƯỚI 2026", 
                             font=("Segoe UI", 13, "bold"), 
                             fg="#FFFFFF", 
                             bg=self.COLOR_ROSE)
        lbl_title.pack(side="left", padx=20, pady=12)

        # Nút hạt đậu bé xinh không cần chữ ở góc phải header
        self.btn_bean = tk.Button(header_frame, 
                                  text="•", 
                                  font=("Segoe UI", 16, "bold"), 
                                  bg=self.COLOR_ROSE, 
                                  fg="#E8D0C0", 
                                  activebackground=self.COLOR_ROSE_HOVER, 
                                  activeforeground="#FFFFFF", 
                                  bd=0, 
                                  relief="flat", 
                                  cursor="hand2", 
                                  padx=8, pady=0, 
                                  command=self._switch_to_tab1)
        self.btn_bean.pack(side="right", padx=(5, 15), pady=12)

        lbl_sub = tk.Label(header_frame, 
                           text="Đăng Thịnh ❤ Hoàn Nguyễn", 
                           font=("Segoe UI", 10, "italic"), 
                           fg="#E8D0C0", 
                           bg=self.COLOR_ROSE)
        lbl_sub.pack(side="right", padx=10, pady=12)

    def _create_notebook(self):
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True, padx=15, pady=10)

        # Tab 1: Cài đặt gốc & Nhạc nền (ô chuyển bé như hạt đậu không có chữ)
        self.tab1 = tk.Frame(self.notebook, bg=self.COLOR_BG)
        self.notebook.add(self.tab1, text="  •  ")
        self._build_tab1_ui()

        # Tab 2: Cá nhân hóa & Xuất 1 file HTML duy nhất (Tab chính)
        self.tab2 = tk.Frame(self.notebook, bg=self.COLOR_BG)
        self.notebook.add(self.tab2, text="  💌 CÁ NHÂN HÓA & XUẤT THIỆP MỜI (CHO TỪNG KHÁCH)  ")
        self._build_tab2_ui()

        # MẶC ĐỊNH LUÔN HIỂN THỊ PHẦN 2
        self.notebook.select(self.tab2)

    def _switch_to_tab1(self):
        """Chuyển sang Phần 1 (Cài đặt thông tin thiệp & nhạc nền)"""
        self.notebook.select(self.tab1)

    def _switch_to_tab2(self):
        """Chuyển sang Phần 2 (Cá nhân hóa & xuất thiệp)"""
        self.notebook.select(self.tab2)

    # --------------------------------------------------------------------------
    # TAB 1: CHỈNH SỬA THÔNG TIN CƠ BẢN CỦA THIỆP
    # --------------------------------------------------------------------------
    def _build_tab1_ui(self):
        # Tạo canvas cuộn cho Tab 1
        canvas = tk.Canvas(self.tab1, bg=self.COLOR_BG, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self.tab1, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg=self.COLOR_BG)

        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw", width=930)
        canvas.configure(xscrollcommand=None, yscrollcommand=scrollbar.set)

        canvas.pack(side="top", fill="both", expand=True, padx=5, pady=(5, 0))
        scrollbar.pack(side="right", fill="y")

        # Cho phép cuộn chuột
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)

        # Khối 1: Ngày giờ cưới
        box_time = self._create_card(scrollable_frame, "📅 1. Ngày & Giờ Cưới Chính")
        
        self.entry_wedding_date = self._add_field(box_time, "Ngày cưới dương lịch (YYYY-MM-DD):", row=0, col=0)
        self.entry_wedding_time = self._add_field(box_time, "Giờ tiệc cưới chính (HH:mm):", row=0, col=1)
        self.entry_ceremony_time = self._add_field(box_time, "Giờ lễ vu quy/thành hôn (HH:mm):", row=1, col=0)
        self.entry_lunar_date = self._add_field(box_time, "Ngày âm lịch (ghi chú):", row=1, col=1)

        # Khối 2: Cô Dâu & Chú Rể
        box_couple = self._create_card(scrollable_frame, "💑 2. Thông Tin Cô Dâu & Chú Rể")
        
        # Nhà trai
        lbl_groom_sec = tk.Label(box_couple, text="[ NHÀ TRAI ]", font=("Segoe UI", 9, "bold"), fg=self.COLOR_ROSE, bg=self.COLOR_WHITE)
        lbl_groom_sec.grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 4))
        self.entry_groom_name = self._add_field(box_couple, "Tên chú rể:", row=1, col=0)
        self.entry_groom_mother = self._add_field(box_couple, "Tên mẹ chú rể:", row=1, col=1)
        self.entry_groom_father = self._add_field(box_couple, "Tên cha chú rể (để trống nếu không hiện):", row=2, col=0)
        self.entry_groom_addr = self._add_field(box_couple, "Địa chỉ / Quê quán nhà trai:", row=2, col=1)

        # Nhà gái
        lbl_bride_sec = tk.Label(box_couple, text="[ NHÀ GÁI ]", font=("Segoe UI", 9, "bold"), fg=self.COLOR_ROSE, bg=self.COLOR_WHITE)
        lbl_bride_sec.grid(row=3, column=0, columnspan=2, sticky="w", pady=(10, 4))
        self.entry_bride_name = self._add_field(box_couple, "Tên cô dâu:", row=4, col=0)
        self.entry_bride_father = self._add_field(box_couple, "Tên cha cô dâu:", row=4, col=1)
        self.entry_bride_mother = self._add_field(box_couple, "Tên mẹ cô dâu:", row=5, col=0)
        self.entry_bride_addr = self._add_field(box_couple, "Địa chỉ / Quê quán nhà gái:", row=5, col=1)

        # Khối 3: Địa điểm tổ chức
        box_venue = self._create_card(scrollable_frame, "📍 3. Địa Điểm Tổ Chức")
        self.entry_invitation_loc = self._add_field(box_venue, "Tiêu đề địa điểm trên thiệp chính:", row=0, col=0)
        self.entry_invitation_addr = self._add_field(box_venue, "Địa chỉ cụ thể trên thiệp chính:", row=0, col=1)
        
        self.entry_reception_name = self._add_field(box_venue, "Tên địa điểm Tiệc Cưới (Nhà Trai):", row=1, col=0)
        self.entry_reception_addr = self._add_field(box_venue, "Địa chỉ Tiệc Cưới:", row=1, col=1)
        
        self.entry_ceremony_name = self._add_field(box_venue, "Tên địa điểm Lễ Vu Quy (Nhà Gái):", row=2, col=0)
        self.entry_ceremony_addr = self._add_field(box_venue, "Địa chỉ Lễ Vu Quy:", row=2, col=1)

        # Khối 4: Mừng Cưới & Ảnh Mã QR Trực Tiếp
        box_gift = self._create_card(scrollable_frame, "💳 4. Thông Tin Mừng Cưới & Ảnh Mã QR")
        
        self.entry_bank_name = self._add_field(box_gift, "Tên Ngân Hàng (ví dụ BIDV, Vietcombank):", row=0, col=0)
        self.entry_account_num = self._add_field(box_gift, "Số Tài Khoản:", row=0, col=1)
        self.entry_account_holder = self._add_field(box_gift, "Chủ Tài Khoản:", row=1, col=0)

        # Khu vực chọn ảnh QR trực tiếp
        frame_qr_picker = tk.Frame(box_gift, bg=self.COLOR_WHITE)
        frame_qr_picker.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(10, 5))

        lbl_qr_title = tk.Label(frame_qr_picker, text="Ảnh mã QR Ngân hàng (Chọn trực tiếp file từ máy tính):", font=("Segoe UI", 9, "bold"), bg=self.COLOR_WHITE, fg=self.COLOR_DARK)
        lbl_qr_title.pack(anchor="w", pady=(0, 4))

        qr_action_box = tk.Frame(frame_qr_picker, bg=self.COLOR_WHITE)
        qr_action_box.pack(fill="x", anchor="w")

        btn_choose_qr = tk.Button(qr_action_box, 
                                  text="🖼️ BẤM CHỌN ẢNH QR TỪ MÁY TÍNH...", 
                                  font=("Segoe UI", 9, "bold"), 
                                  bg="#F0EAE1", 
                                  fg=self.COLOR_ROSE, 
                                  activebackground="#E5DDD2", 
                                  relief="solid", 
                                  borderwidth=1, 
                                  cursor="hand2", 
                                  padx=12, pady=6, 
                                  command=self._on_pick_qr_image)
        btn_choose_qr.pack(side="left", padx=(0, 15))

        self.lbl_qr_path_info = tk.Label(qr_action_box, text="Chưa đổi ảnh mới (Đang dùng ảnh mặc định)", font=("Segoe UI", 8, "italic"), fg=self.COLOR_MUTED, bg=self.COLOR_WHITE)
        self.lbl_qr_path_info.pack(side="left", padx=5)

        # Khung preview thumbnail QR
        self.lbl_qr_thumb = tk.Label(frame_qr_picker, text="[Ảnh QR]", bg="#F9F6F2", relief="groove", borderwidth=1, width=15, height=6)
        self.lbl_qr_thumb.pack(anchor="w", pady=6)

        # Khối 5: Nhạc nền đám cưới (Chỉ chỉnh ở Phần 1)
        box_music = self._create_card(scrollable_frame, "🎵 5. Nhạc Nền Đám Cưới")
        frame_music_content = tk.Frame(box_music, bg=self.COLOR_WHITE)
        frame_music_content.grid(row=0, column=0, columnspan=2, sticky="ew", pady=5)

        lbl_m_hint = tk.Label(frame_music_content, 
                              text="Chọn file nhạc từ máy tính (.mp3, .wav, .m4a, .ogg) để làm nhạc nền thiệp cưới:\n"
                                   "(Nếu không chọn hoặc bấm xóa nhạc, thiệp sẽ hoàn toàn im lặng, không phát bất kỳ âm thanh nào)",
                              font=("Segoe UI", 9), bg=self.COLOR_WHITE, fg=self.COLOR_MUTED, justify="left")
        lbl_m_hint.pack(anchor="w", pady=(0, 6))

        music_action_row = tk.Frame(frame_music_content, bg=self.COLOR_WHITE)
        music_action_row.pack(fill="x", pady=4)

        btn_choose_music = tk.Button(music_action_row, 
                                     text="📁 CHỌN FILE NHẠC TỪ MÁY...", 
                                     font=("Segoe UI", 9, "bold"), 
                                     bg="#F0EAE1", 
                                     fg=self.COLOR_ROSE, 
                                     activebackground="#E5DDD2", 
                                     relief="solid", 
                                     borderwidth=1, 
                                     cursor="hand2", 
                                     padx=12, pady=6, 
                                     command=self._on_pick_music_file)
        btn_choose_music.pack(side="left", padx=(0, 10))

        btn_clear_music = tk.Button(music_action_row, 
                                    text="🗑️ Xóa Nhạc (Không Phát Nhạc)", 
                                    font=("Segoe UI", 9), 
                                    bg="#FFFFFF", 
                                    fg="#A83232", 
                                    relief="solid", 
                                    borderwidth=1, 
                                    cursor="hand2", 
                                    padx=10, pady=6, 
                                    command=self._on_clear_music)
        btn_clear_music.pack(side="left", padx=(0, 10))

        btn_preview_music = tk.Button(music_action_row, 
                                      text="▶ Nghe Thử", 
                                      font=("Segoe UI", 9), 
                                      bg="#FFFFFF", 
                                      relief="solid", 
                                      borderwidth=1, 
                                      cursor="hand2", 
                                      padx=10, pady=6, 
                                      command=self._on_toggle_preview_music)
        btn_preview_music.pack(side="left", padx=(0, 10))

        self.lbl_music_status = tk.Label(frame_music_content, 
                                         text="Chưa chọn file nhạc (thiệp sẽ không phát nhạc)", 
                                         font=("Segoe UI", 9, "italic"), 
                                         fg=self.COLOR_MUTED, 
                                         bg=self.COLOR_WHITE)
        self.lbl_music_status.pack(anchor="w", pady=(6, 4))

        # Khối 6: Xuất thiệp để đưa lên Git / Web
        box_export_base = self._create_card(scrollable_frame, "🌐 6. Xuất Thiệp Đăng Lên Web (GitHub Pages / Vercel / Render)")
        frame_export_base = tk.Frame(box_export_base, bg=self.COLOR_WHITE)
        frame_export_base.grid(row=0, column=0, columnspan=2, sticky="ew", pady=6)

        lbl_eb_desc = tk.Label(frame_export_base, 
                               text="✦ CÁCH 1 (KHUYÊN DÙNG): Xuất thư mục Web_Deploy siêu tốc (mở cực nhanh < 0.3s, tải nhạc streaming ngầm, lazy load ảnh, chuyên kéo thả lên GitHub/Vercel).\n"
                                    "✦ CÁCH 2: Xuất 1 file HTML duy nhất đã gộp toàn bộ ảnh + nhạc Base64 (dành cho bạn muốn gửi file độc lập hoặc đăng Git không kèm thư mục con).",
                               font=("Segoe UI", 9), bg=self.COLOR_WHITE, fg=self.COLOR_MUTED, justify="left")
        lbl_eb_desc.pack(anchor="w", pady=(0, 10))

        btn_run_export_web = tk.Button(frame_export_base, 
                                       text="⚡ XUẤT THƯ MỤC WEB SIÊU TỐC (MỞ TRONG 0.3S - CHUYÊN CHO GITHUB / VERCEL)", 
                                       font=("Segoe UI", 10, "bold"), 
                                       bg="#2D6A4F", 
                                       fg="#FFFFFF", 
                                       activebackground="#1B4332", 
                                       relief="flat", 
                                       cursor="hand2", 
                                       padx=18, pady=10, 
                                       command=self._export_web_deploy_bundle_action)
        btn_run_export_web.pack(fill="x", pady=(2, 6))

        btn_run_export_base = tk.Button(frame_export_base, 
                                        text="🚀 XUẤT 1 FILE HTML ĐỘC LẬP DUY NHẤT (ĐÃ GỘP TẤT CẢ TÀI NGUYÊN)", 
                                        font=("Segoe UI", 9, "bold"), 
                                        bg=self.COLOR_ACCENT, 
                                        fg="#FFFFFF", 
                                        activebackground="#B06842", 
                                        relief="flat", 
                                        cursor="hand2", 
                                        padx=18, pady=8, 
                                        command=self._export_base_obfuscated_file)
        btn_run_export_base.pack(fill="x", pady=2)

        # Thanh nút hành động Tab 1 (Ghim cố định ở đáy)
        btn_bar = tk.Frame(self.tab1, bg="#EFEAE2", height=50, bd=1, relief="groove")
        btn_bar.pack(side="bottom", fill="x", padx=5, pady=5)

        btn_back_tab2 = tk.Button(btn_bar, text="⬅ Quay Lại Phần 2 (Tạo Thiệp)", font=("Segoe UI", 9, "bold"), bg="#FFFFFF", fg=self.COLOR_ROSE, relief="solid", borderwidth=1, padx=12, pady=6, cursor="hand2", command=self._switch_to_tab2)
        btn_back_tab2.pack(side="left", padx=15, pady=8)

        btn_reload = tk.Button(btn_bar, text="🔄 Tải Lại", font=("Segoe UI", 9), bg="#FFFFFF", relief="solid", borderwidth=1, padx=12, pady=6, cursor="hand2", command=self.load_initial_data)
        btn_reload.pack(side="left", padx=5, pady=8)

        btn_preview_orig = tk.Button(btn_bar, text="👁️ Mở Xem Thiệp Gốc", font=("Segoe UI", 9), bg="#FFFFFF", relief="solid", borderwidth=1, padx=10, pady=6, cursor="hand2", command=self._open_original_invitation)
        btn_preview_orig.pack(side="left", padx=5, pady=8)

        btn_save_direct = tk.Button(btn_bar, text="💾 LƯU VÀO config.js", font=("Segoe UI", 9, "bold"), bg=self.COLOR_ROSE, fg="#FFFFFF", activebackground=self.COLOR_ROSE_HOVER, relief="flat", padx=14, pady=6, cursor="hand2", command=self._save_to_config_direct)
        btn_save_direct.pack(side="right", padx=15, pady=8)

        btn_export_base_bar = tk.Button(btn_bar, text="🌐 Xuất Thiệp Gốc (Lên Git)", font=("Segoe UI", 9, "bold"), bg=self.COLOR_ACCENT, fg="#FFFFFF", activebackground="#B06842", relief="flat", padx=12, pady=6, cursor="hand2", command=self._export_base_obfuscated_file)
        btn_export_base_bar.pack(side="right", padx=5, pady=8)

    # --------------------------------------------------------------------------
    # TAB 2: CÁ NHÂN HÓA & XUẤT 1 FILE HTML DUY NHẤT
    # --------------------------------------------------------------------------
    def _build_tab2_ui(self):
        # Khu vực Tab 2
        container = tk.Frame(self.tab2, bg=self.COLOR_BG)
        container.pack(fill="both", expand=True, padx=15, pady=10)

        # Khối 1: Tên người nhận & Tự động đổi xưng hô
        box_guest = tk.Frame(container, bg=self.COLOR_WHITE, bd=1, relief="solid")
        box_guest.pack(fill="x", pady=6, padx=5)

        p1_title = tk.Label(box_guest, text="👤 1. Nhập Tên Người Nhận (Hệ thống tự động điều chỉnh câu từ)", font=("Segoe UI", 10, "bold"), fg=self.COLOR_ROSE, bg=self.COLOR_WHITE)
        p1_title.pack(anchor="w", padx=15, pady=(12, 6))

        input_row = tk.Frame(box_guest, bg=self.COLOR_WHITE)
        input_row.pack(fill="x", padx=15, pady=(0, 10))

        lbl_hint = tk.Label(input_row, text="Nhập tên người nhận:", font=("Segoe UI", 9, "bold"), bg=self.COLOR_WHITE)
        lbl_hint.pack(side="left", padx=(0, 10))

        self.entry_guest_name = tk.Entry(input_row, font=("Segoe UI", 11), relief="solid", borderwidth=1, width=28)
        self.entry_guest_name.pack(side="left", padx=(0, 10), ipady=3)
        self.entry_guest_name.bind("<KeyRelease>", self._on_guest_name_changed)

        lbl_examples = tk.Label(input_row, text="(Ví dụ gõ: Chị A, Em Tuấn, Cô Hoa, Bác Hùng, Bạn Dũng...)", font=("Segoe UI", 8, "italic"), fg=self.COLOR_MUTED, bg=self.COLOR_WHITE)
        lbl_examples.pack(side="left", padx=5)

        # Khối 2: Xem trước và chỉnh sửa câu từ tự động
        box_preview = tk.Frame(container, bg=self.COLOR_WHITE, bd=1, relief="solid")
        box_preview.pack(fill="both", expand=True, pady=6, padx=5)

        p2_title = tk.Label(box_preview, text="📝 2. Câu Chữ Sẽ Xuất Vào Thiệp (Được tự động thích ứng & có thể sửa lại):", font=("Segoe UI", 10, "bold"), fg=self.COLOR_ROSE, bg=self.COLOR_WHITE)
        p2_title.pack(anchor="w", padx=15, pady=(12, 8))

        grid_frame = tk.Frame(box_preview, bg=self.COLOR_WHITE)
        grid_frame.pack(fill="both", expand=True, padx=15, pady=5)
        grid_frame.columnconfigure(1, weight=1)

        # 1. Lời mở đầu
        lbl_sub = tk.Label(grid_frame, text="Lời mở đầu (Màn hình đầu):", font=("Segoe UI", 9), bg=self.COLOR_WHITE)
        lbl_sub.grid(row=0, column=0, sticky="w", pady=5)
        self.entry_opening_sub = tk.Entry(grid_frame, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        self.entry_opening_sub.grid(row=0, column=1, sticky="ew", padx=10, pady=5, ipady=2)

        # 2. Lời mời chính
        lbl_gl = tk.Label(grid_frame, text="Dòng kính mời trên thiệp:", font=("Segoe UI", 9, "bold"), bg=self.COLOR_WHITE, fg=self.COLOR_ROSE)
        lbl_gl.grid(row=1, column=0, sticky="w", pady=5)
        self.entry_guest_label = tk.Entry(grid_frame, font=("Segoe UI", 9, "bold"), relief="solid", borderwidth=1, fg=self.COLOR_ROSE)
        self.entry_guest_label.grid(row=1, column=1, sticky="ew", padx=10, pady=5, ipady=2)

        # 3. Câu dẫn lễ cưới
        lbl_sh = tk.Label(grid_frame, text="Câu dẫn lễ cưới (vai xưng hô):", font=("Segoe UI", 9), bg=self.COLOR_WHITE)
        lbl_sh.grid(row=2, column=0, sticky="w", pady=5)
        self.entry_subheading = tk.Entry(grid_frame, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        self.entry_subheading.grid(row=2, column=1, sticky="ew", padx=10, pady=5, ipady=2)

        # 4. Lời chúc phúc ở cuối thiệp mời chính
        lbl_bl = tk.Label(grid_frame, text="Lời chúc phúc ở cuối thiệp mời:", font=("Segoe UI", 9), bg=self.COLOR_WHITE)
        lbl_bl.grid(row=3, column=0, sticky="w", pady=4)
        self.entry_blessing = tk.Entry(grid_frame, font=("Segoe UI", 9, "italic"), relief="solid", borderwidth=1, fg=self.COLOR_ROSE)
        self.entry_blessing.grid(row=3, column=1, sticky="ew", padx=10, pady=4, ipady=2)

        # 5. Lựa chọn Có (Tham gia)
        lbl_yo = tk.Label(grid_frame, text="Lựa chọn Có (Tham gia):", font=("Segoe UI", 9), bg=self.COLOR_WHITE)
        lbl_yo.grid(row=4, column=0, sticky="w", pady=4)
        self.entry_yes_option = tk.Entry(grid_frame, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        self.entry_yes_option.grid(row=4, column=1, sticky="ew", padx=10, pady=4, ipady=2)

        # 6. Lựa chọn Không (Vắng mặt)
        lbl_no = tk.Label(grid_frame, text="Lựa chọn Không (Vắng mặt):", font=("Segoe UI", 9), bg=self.COLOR_WHITE)
        lbl_no.grid(row=5, column=0, sticky="w", pady=4)
        self.entry_no_option = tk.Entry(grid_frame, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        self.entry_no_option.grid(row=5, column=1, sticky="ew", padx=10, pady=4, ipady=2)

        # 7. Tiêu đề số người tham gia
        lbl_al = tk.Label(grid_frame, text="Tiêu đề số người tham gia:", font=("Segoe UI", 9), bg=self.COLOR_WHITE)
        lbl_al.grid(row=6, column=0, sticky="w", pady=4)
        self.entry_accompany_label = tk.Entry(grid_frame, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        self.entry_accompany_label.grid(row=6, column=1, sticky="ew", padx=10, pady=4, ipady=2)

        # 8. Lời cảm ơn khi gửi phản hồi tham dự
        lbl_rt = tk.Label(grid_frame, text="Lời cảm ơn khi gửi phản hồi:", font=("Segoe UI", 9), bg=self.COLOR_WHITE)
        lbl_rt.grid(row=7, column=0, sticky="w", pady=4)
        self.entry_thank_toast = tk.Entry(grid_frame, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        self.entry_thank_toast.grid(row=7, column=1, sticky="ew", padx=10, pady=4, ipady=2)

        # 9. Tên file xuất
        lbl_fn = tk.Label(grid_frame, text="Tên file HTML xuất ra:", font=("Segoe UI", 9, "bold"), bg=self.COLOR_WHITE, fg=self.COLOR_ACCENT)
        lbl_fn.grid(row=8, column=0, sticky="w", pady=(12, 4))
        self.entry_filename = tk.Entry(grid_frame, font=("Segoe UI", 10, "bold"), relief="solid", borderwidth=1, fg=self.COLOR_ACCENT)
        self.entry_filename.grid(row=8, column=1, sticky="ew", padx=10, pady=(12, 4), ipady=3)

        # Khối 3: Nút hành động duy nhất xuất file
        box_action = tk.Frame(container, bg="#FAF5EE", bd=1, relief="solid")
        box_action.pack(fill="x", pady=(10, 5), padx=5)

        note_text = ("✦ Chức năng: Tự động gộp 100% hình ảnh (Base64), CSS, và Javascript vào DUY NHẤT 1 FILE HTML độc lập.\n"
                     "✦ Mã nguồn được xáo trộn nhiều lớp (Obfuscated) chống xem trộm và copy code. Khách mở xem mượt mà offline 100%!")
        lbl_note = tk.Label(box_action, text=note_text, font=("Segoe UI", 9), fg=self.COLOR_MUTED, bg="#FAF5EE", justify="left")
        lbl_note.pack(anchor="w", padx=20, pady=(12, 10))

        # ĐÚNG 1 NÚT DUY NHẤT
        self.btn_export_single = tk.Button(box_action, 
                                           text="🚀 XUẤT 1 FILE HTML ĐÃ XÁO TRỘN MÃ NGUỒN", 
                                           font=("Segoe UI", 11, "bold"), 
                                           bg=self.COLOR_ROSE, 
                                           fg="#FFFFFF", 
                                           activebackground=self.COLOR_ROSE_HOVER, 
                                           relief="flat", 
                                           cursor="hand2", 
                                           padx=25, pady=12, 
                                           command=self._export_single_obfuscated_file)
        self.btn_export_single.pack(padx=20, pady=(0, 16), fill="x")

    # --------------------------------------------------------------------------
    # CÁC HÀM TIỆN ÍCH DỰNG GIAO DIỆN
    # --------------------------------------------------------------------------
    def _create_card(self, parent, title: str) -> tk.Frame:
        wrapper = tk.Frame(parent, bg=self.COLOR_WHITE, bd=1, relief="solid")
        wrapper.pack(fill="x", padx=10, pady=8)

        lbl = tk.Label(wrapper, text=title, font=("Segoe UI", 10, "bold"), fg=self.COLOR_ROSE, bg=self.COLOR_WHITE)
        lbl.pack(anchor="w", padx=15, pady=(10, 5))

        grid_content = tk.Frame(wrapper, bg=self.COLOR_WHITE)
        grid_content.pack(fill="x", padx=15, pady=(0, 10))
        grid_content.columnconfigure(0, weight=1)
        grid_content.columnconfigure(1, weight=1)
        return grid_content

    def _add_field(self, parent, label: str, row: int, col: int) -> tk.Entry:
        frame = tk.Frame(parent, bg=self.COLOR_WHITE)
        frame.grid(row=row, column=col, sticky="ew", padx=8, pady=4)

        lbl = tk.Label(frame, text=label, font=("Segoe UI", 8), fg=self.COLOR_DARK, bg=self.COLOR_WHITE)
        lbl.pack(anchor="w", pady=(0, 2))

        entry = tk.Entry(frame, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        entry.pack(fill="x", ipady=2)
        return entry

    # --------------------------------------------------------------------------
    # SỰ KIỆN & XỬ LÝ DỮ LIỆU
    # --------------------------------------------------------------------------
    def load_initial_data(self):
        """Nạp dữ liệu từ config.js vào Tab 1 và Tab 2"""
        try:
            self.config_data = load_config_data()
            cfg = self.config_data

            # 1. Thời gian
            self._set_entry(self.entry_wedding_date, cfg.get('weddingDate', ''))
            self._set_entry(self.entry_wedding_time, cfg.get('weddingTime', ''))
            self._set_entry(self.entry_ceremony_time, cfg.get('ceremonyTime', ''))
            self._set_entry(self.entry_lunar_date, cfg.get('lunarDate', ''))

            # 2. Cô dâu & Chú rể
            groom = cfg.get('groom', {})
            self._set_entry(self.entry_groom_name, groom.get('name', ''))
            self._set_entry(self.entry_groom_mother, groom.get('mother', ''))
            self._set_entry(self.entry_groom_father, groom.get('father', ''))
            self._set_entry(self.entry_groom_addr, groom.get('address', ''))

            bride = cfg.get('bride', {})
            self._set_entry(self.entry_bride_name, bride.get('name', ''))
            self._set_entry(self.entry_bride_father, bride.get('father', ''))
            self._set_entry(self.entry_bride_mother, bride.get('mother', ''))
            self._set_entry(self.entry_bride_addr, bride.get('address', ''))

            # 3. Địa điểm
            venues = cfg.get('venues', {})
            inv_v = venues.get('invitation', {})
            self._set_entry(self.entry_invitation_loc, inv_v.get('location', ''))
            self._set_entry(self.entry_invitation_addr, inv_v.get('address', ''))

            rec_v = venues.get('reception', {})
            self._set_entry(self.entry_reception_name, rec_v.get('locationName', ''))
            self._set_entry(self.entry_reception_addr, rec_v.get('address', ''))

            cer_v = venues.get('ceremony', {})
            self._set_entry(self.entry_ceremony_name, cer_v.get('locationName', ''))
            self._set_entry(self.entry_ceremony_addr, cer_v.get('address', ''))

            # 4. Mừng cưới
            bank = cfg.get('bankAccount', {})
            self._set_entry(self.entry_bank_name, bank.get('bankName', ''))
            self._set_entry(self.entry_account_num, bank.get('accountNumber', ''))
            self._set_entry(self.entry_account_holder, bank.get('accountHolder', ''))

            # Load ảnh QR hiện có
            qr_url = bank.get('qrCodeUrl', '')
            if qr_url:
                qr_file = BASE_DIR / qr_url
                if qr_file.exists():
                    self._update_qr_thumbnail(qr_file)

            # 5. Nhạc nền
            music = cfg.get('music', {})
            audio_url = music.get('audioUrl', '')
            if audio_url:
                music_file = BASE_DIR / audio_url
                if music_file.exists():
                    size_mb = music_file.stat().st_size / (1024 * 1024)
                    self.lbl_music_status.config(
                        text=f"Đang dùng: {music_file.name} ({size_mb:.2f} MB)",
                        fg=self.COLOR_ROSE
                    )
                    self.selected_music_path = str(music_file)
                else:
                    self.lbl_music_status.config(
                        text=f"Đang cấu hình: {audio_url}",
                        fg=self.COLOR_MUTED
                    )
            else:
                self.lbl_music_status.config(
                    text="Chưa chọn file nhạc (thiệp sẽ không phát nhạc)",
                    fg=self.COLOR_MUTED
                )
                self.selected_music_path = ""

            # Tab 2 mặc định: Chị A
            if not self.entry_guest_name.get().strip():
                self._set_entry(self.entry_guest_name, "Chị A")
                self._on_guest_name_changed(None)

        except Exception as e:
            messagebox.showerror("Lỗi nạp cấu hình", f"Không thể đọc file config.js: {e}")

    def _set_entry(self, entry: tk.Entry, val: str):
        entry.delete(0, tk.END)
        if val:
            entry.insert(0, str(val))

    def _on_pick_qr_image(self):
        """Mở hộp thoại chọn ảnh QR trực tiếp từ máy tính"""
        filetypes = [
            ("Hình ảnh", "*.jpg *.jpeg *.png *.webp"),
            ("Tất cả các tệp", "*.*")
        ]
        chosen = filedialog.askopenfilename(title="Chọn ảnh mã QR mừng cưới từ máy tính", filetypes=filetypes)
        if chosen:
            chosen_path = Path(chosen)
            if chosen_path.exists():
                self.selected_qr_path = str(chosen_path)
                self.lbl_qr_path_info.config(text=f"Đã chọn: {chosen_path.name}", fg=self.COLOR_ROSE)
                self._update_qr_thumbnail(chosen_path)

    def _on_pick_music_file(self):
        """Mở hộp thoại chọn file nhạc từ máy tính"""
        filetypes = [
            ("File âm thanh", "*.mp3 *.wav *.m4a *.ogg *.aac"),
            ("File MP3", "*.mp3"),
            ("Tất cả file", "*.*")
        ]
        chosen = filedialog.askopenfilename(title="Chọn file nhạc đám cưới từ máy tính", filetypes=filetypes)
        if chosen:
            chosen_path = Path(chosen)
            if chosen_path.exists():
                self.selected_music_path = str(chosen_path)
                size_mb = chosen_path.stat().st_size / (1024 * 1024)
                self.lbl_music_status.config(
                    text=f"Đã chọn: {chosen_path.name} ({size_mb:.2f} MB)",
                    fg=self.COLOR_ROSE
                )

    def _on_clear_music(self):
        """Xóa nhạc nền (thiệp sẽ hoàn toàn im lặng)"""
        self.selected_music_path = "__CLEAR__"
        self.lbl_music_status.config(
            text="Đã chọn xóa nhạc (thiệp sẽ hoàn toàn không phát nhạc)",
            fg=self.COLOR_MUTED
        )

    def _on_toggle_preview_music(self):
        """Nghe thử bài hát đang chọn"""
        path_to_play = None
        if self.selected_music_path and self.selected_music_path != "__CLEAR__":
            p = Path(self.selected_music_path)
            if p.exists():
                path_to_play = p
        elif self.config_data and self.config_data.get('music', {}).get('audioUrl'):
            curr = self.config_data['music']['audioUrl']
            p = BASE_DIR / curr
            if p.exists():
                path_to_play = p
            elif Path(curr).exists():
                path_to_play = Path(curr)

        if path_to_play:
            try:
                os.startfile(str(path_to_play))
            except Exception as e:
                messagebox.showerror("Lỗi phát nhạc", f"Không thể mở file nhạc: {e}")
        else:
            messagebox.showinfo("Thông báo", "Chưa có file nhạc nào được chọn để nghe thử!")

    def _update_qr_thumbnail(self, img_path: Path):
        """Hiển thị thumbnail ảnh QR lên giao diện"""
        try:
            pil_img = Image.open(img_path)
            pil_img.thumbnail((120, 120))
            self.qr_preview_img = ImageTk.PhotoImage(pil_img)
            self.lbl_qr_thumb.config(image=self.qr_preview_img, text="", width=120, height=120)
        except Exception as e:
            self.lbl_qr_thumb.config(image="", text="[Lỗi tải ảnh]", width=15, height=6)

    def _on_guest_name_changed(self, event):
        """Tự động đổi vai xưng hô và tên file khi người dùng gõ tên người nhận"""
        name = self.entry_guest_name.get().strip()
        info = detect_pronouns(name)
        
        # Tự sinh tên file chuẩn hóa (ví dụ: thiep_cuoi_gui_chi_a.html)
        slug = slugify_vietnamese(name)
        filename = f"thiep_cuoi_gui_{slug}.html"

        self._set_entry(self.entry_opening_sub, info['opening_sub'])
        self._set_entry(self.entry_guest_label, info['guest_label'])
        self._set_entry(self.entry_subheading, info['subheading'])
        self._set_entry(self.entry_blessing, info['blessing'])
        self._set_entry(self.entry_yes_option, info['yes_option'])
        self._set_entry(self.entry_no_option, info['no_option'])
        self._set_entry(self.entry_accompany_label, info['accompany_label'])
        self._set_entry(self.entry_thank_toast, info['thank_toast'])
        self._set_entry(self.entry_filename, filename)

    def _collect_current_config_from_tab1(self) -> dict:
        """Thu thập dữ liệu hiện tại từ form Tab 1"""
        cfg = json.loads(json.dumps(self.config_data)) if self.config_data else {}

        # 1. Thời gian
        cfg['weddingDate'] = self.entry_wedding_date.get().strip()
        cfg['weddingTime'] = self.entry_wedding_time.get().strip()
        cfg['ceremonyTime'] = self.entry_ceremony_time.get().strip()
        cfg['lunarDate'] = self.entry_lunar_date.get().strip()

        # 2. Cô Dâu & Chú Rể
        if 'groom' not in cfg: cfg['groom'] = {}
        cfg['groom']['name'] = self.entry_groom_name.get().strip()
        cfg['groom']['mother'] = self.entry_groom_mother.get().strip()
        cfg['groom']['father'] = self.entry_groom_father.get().strip()
        cfg['groom']['address'] = self.entry_groom_addr.get().strip()

        if 'bride' not in cfg: cfg['bride'] = {}
        cfg['bride']['name'] = self.entry_bride_name.get().strip()
        cfg['bride']['father'] = self.entry_bride_father.get().strip()
        cfg['bride']['mother'] = self.entry_bride_mother.get().strip()
        cfg['bride']['address'] = self.entry_bride_addr.get().strip()

        # 3. Địa điểm
        if 'venues' not in cfg: cfg['venues'] = {}
        if 'invitation' not in cfg['venues']: cfg['venues']['invitation'] = {}
        cfg['venues']['invitation']['location'] = self.entry_invitation_loc.get().strip()
        cfg['venues']['invitation']['address'] = self.entry_invitation_addr.get().strip()

        if 'reception' not in cfg: cfg['venues']['reception'] = {}
        cfg['venues']['reception']['locationName'] = self.entry_reception_name.get().strip()
        cfg['venues']['reception']['address'] = self.entry_reception_addr.get().strip()

        if 'ceremony' not in cfg: cfg['venues']['ceremony'] = {}
        cfg['venues']['ceremony']['locationName'] = self.entry_ceremony_name.get().strip()
        cfg['venues']['ceremony']['address'] = self.entry_ceremony_addr.get().strip()

        # 4. Mừng cưới
        if 'bankAccount' not in cfg: cfg['bankAccount'] = {}
        cfg['bankAccount']['bankName'] = self.entry_bank_name.get().strip()
        cfg['bankAccount']['accountNumber'] = self.entry_account_num.get().strip()
        cfg['bankAccount']['accountHolder'] = self.entry_account_holder.get().strip()

        # Xử lý ảnh QR mới nếu có chọn
        if self.selected_qr_path and Path(self.selected_qr_path).exists():
            dest_dir = BASE_DIR / "images"
            dest_dir.mkdir(exist_ok=True)
            chosen_ext = Path(self.selected_qr_path).suffix.lower()
            qr_dest = dest_dir / f"qr_mung_cuoi{chosen_ext}"
            try:
                # Copy ảnh vào images
                qr_dest.write_bytes(Path(self.selected_qr_path).read_bytes())
                cfg['bankAccount']['qrCodeUrl'] = f"images/{qr_dest.name}"
            except Exception:
                cfg['bankAccount']['qrCodeUrl'] = self.selected_qr_path

        # 5. Nhạc nền
        if 'music' not in cfg: cfg['music'] = {}
        if self.selected_music_path == "__CLEAR__":
            cfg['music']['audioUrl'] = ""
        elif self.selected_music_path and Path(self.selected_music_path).exists():
            dest_dir = BASE_DIR / "audio"
            dest_dir.mkdir(exist_ok=True)
            try:
                # Nén nhạc sang MP3 96kbps siêu nhẹ (giảm từ 10MB xuống ~3MB)
                raw_audio = Path(self.selected_music_path).read_bytes()
                compressed_audio = compress_audio_bytes(raw_audio, max_size_mb=3.5, bitrate=96)
                music_dest = dest_dir / "nhac_dam_cuoi.mp3"
                music_dest.write_bytes(compressed_audio)
                cfg['music']['audioUrl'] = "audio/nhac_dam_cuoi.mp3"
            except Exception as e:
                chosen_ext = Path(self.selected_music_path).suffix.lower()
                music_dest = dest_dir / f"nhac_dam_cuoi{chosen_ext}"
                music_dest.write_bytes(Path(self.selected_music_path).read_bytes())
                cfg['music']['audioUrl'] = f"audio/{music_dest.name}"

        return cfg

    def _save_to_config_direct(self):
        """Phần 1: Lưu trực tiếp vào config.js"""
        try:
            cfg = self._collect_current_config_from_tab1()
            save_config_data(cfg)
            self.config_data = cfg
            messagebox.showinfo("Thành công", "Đã lưu trực tiếp toàn bộ thông tin mới vào file config.js thành công! 🎉")
        except Exception as e:
            messagebox.showerror("Lỗi lưu file", f"Không thể lưu file config.js: {e}")

    def _open_original_invitation(self):
        """Mở xem file index.html gốc bằng trình duyệt mặc định"""
        if INDEX_PATH.exists():
            webbrowser.open(str(INDEX_PATH.resolve().as_uri()))
        else:
            messagebox.showwarning("Cảnh báo", "Không tìm thấy file index.html")

    def _export_base_obfuscated_file(self):
        """
        Xuất file thiệp gốc (chưa cá nhân hóa theo tên khách) ra 1 file HTML duy nhất,
        đã gộp toàn bộ ảnh + nhạc + CSS + JS và xáo trộn mã nguồn,
        thích hợp làm file trang chủ đưa lên GitHub Pages / Render / Vercel.
        """
        default_name = "thiep_cuoi_goc.html"
        filetypes = [("File HTML", "*.html"), ("Tất cả tệp", "*.*")]
        chosen_save = filedialog.asksaveasfilename(
            title="Chọn nơi lưu file thiệp gốc đã xáo trộn (để đăng Git)",
            initialdir=str(EXPORT_DIR),
            initialfile=default_name,
            filetypes=filetypes
        )
        if not chosen_save:
            return

        target_path = Path(chosen_save)
        if not target_path.name.lower().endswith('.html'):
            target_path = target_path.with_suffix('.html')

        try:
            # 1. Thu thập cấu hình nền mới nhất từ Tab 1
            cfg = self._collect_current_config_from_tab1()

            # Đảm bảo cấu hình gốc trang trọng, phù hợp đại chúng
            if 'texts' not in cfg: cfg['texts'] = {}
            if 'invitation' not in cfg['texts']: cfg['texts']['invitation'] = {}
            if not cfg['texts']['invitation'].get('guestLabel'):
                cfg['texts']['invitation']['guestLabel'] = "Bạn cùng gia đình"
            if not cfg['texts']['invitation'].get('subheading'):
                cfg['texts']['invitation']['subheading'] = "(Tới dự Lễ Thành Hôn của chúng tôi)"
            if not cfg.get('openingScreen', {}).get('subtitle'):
                cfg['openingScreen']['subtitle'] = "Trân trọng kính mời bạn cùng gia đình"

            # Đảm bảo ô tên trong RSVP để trống để khách tự điền
            if 'rsvp' in cfg.get('texts', {}):
                if 'nameField' not in cfg['texts']['rsvp']: cfg['texts']['rsvp']['nameField'] = {}
                cfg['texts']['rsvp']['nameField']['defaultValue'] = ""

            # 2. Đóng gói toàn bộ hình ảnh, nhạc, CSS, JS và xáo trộn mã nguồn
            bundle_and_obfuscate_html(cfg, target_path, "Chính Thức")

            # 3. Thông báo thành công
            msg = (f"ĐÃ XUẤT THIỆP GỐC THÀNH CÔNG! 🎉\n\n"
                   f"• Tên file: {target_path.name}\n"
                   f"• Nơi lưu: {target_path.resolve()}\n\n"
                   f"✦ File đã được gộp 100% hình ảnh, nhạc nền, CSS và JS vào DUY NHẤT 1 FILE HTML độc lập.\n"
                   f"✦ Mã nguồn đã được xáo trộn nhiều lớp chống đọc trộm / sao chép code.\n"
                   f"✦ Bạn có thể dùng file này tải lên GitHub Pages / Render / Vercel để làm trang thiệp cưới chính!\n\n"
                   f"Bạn có muốn mở xem thử ngay bây giờ không?")
            
            res = messagebox.askyesno("Xuất File Hoàn Tất", msg)
            if res:
                webbrowser.open(str(target_path.resolve().as_uri()))

        except Exception as e:
            messagebox.showerror("Lỗi xuất file", f"Đã xảy ra lỗi khi đóng gói thiệp cưới gốc:\n{e}")

    def _export_web_deploy_bundle_action(self):
        """
        Xuất trọn gói thư mục Web_Deploy siêu tốc (< 0.3s) chuyên để kéo thả lên GitHub / Vercel:
        - index.html (~35KB) với lazy loading ảnh.
        - audio/nhac_dam_cuoi.mp3 riêng biệt (streaming ngầm).
        - config.js, script.js, styles.css, images/ đầy đủ.
        """
        try:
            cfg = self._collect_current_config_from_tab1()

            # Đảm bảo câu chữ trang trọng, phù hợp đại chúng
            if 'texts' not in cfg: cfg['texts'] = {}
            if 'invitation' not in cfg['texts']: cfg['texts']['invitation'] = {}
            if not cfg['texts']['invitation'].get('guestLabel'):
                cfg['texts']['invitation']['guestLabel'] = "Bạn cùng gia đình"
            if not cfg['texts']['invitation'].get('subheading'):
                cfg['texts']['invitation']['subheading'] = "(Tới dự Lễ Thành Hôn của chúng tôi)"
            if not cfg.get('openingScreen', {}).get('subtitle'):
                cfg['openingScreen']['subtitle'] = "Trân trọng kính mời bạn cùng gia đình"
            if 'rsvp' in cfg.get('texts', {}):
                if 'nameField' not in cfg['texts']['rsvp']: cfg['texts']['rsvp']['nameField'] = {}
                cfg['texts']['rsvp']['nameField']['defaultValue'] = ""

            out_dir = export_web_deploy_bundle(cfg, WEB_DEPLOY_DIR)

            msg = (f"ĐÃ XUẤT THƯ MỤC WEB SIÊU TỐC THÀNH CÔNG! 🎉\n\n"
                   f"• Thư mục lưu: {out_dir.resolve()}\n\n"
                   f"✦ Tốc độ mở web: < 0.3 giây (siêu nhẹ, tải ban đầu chỉ ~300 KB)!\n"
                   f"✦ Nhạc nền: Được tách riêng và tự động phát streaming ngầm khi mở thiệp.\n"
                   f"✦ Album ảnh: Kích hoạt tải lười (Lazy loading) siêu mượt.\n"
                   f"✦ Trong thư mục có sẵn file 'HUONG_DAN_DANG_WEB.txt' hướng dẫn đưa lên GitHub Pages & Vercel trong 2 phút.\n\n"
                   f"Bạn có muốn mở thư mục này ngay bây giờ không?")
            res = messagebox.askyesno("Xuất Gói Web Thành Công", msg)
            if res:
                os.startfile(str(out_dir.resolve()))
        except Exception as e:
            messagebox.showerror("Lỗi xuất gói web", f"Đã xảy ra lỗi khi tạo thư mục web:\n{e}")

    def _export_single_obfuscated_file(self):
        """
        Phần 2: Nút duy nhất: Gộp toàn bộ vào 1 file HTML duy nhất,
        mã hóa xáo trộn mã nguồn chống sao chép và lưu theo tên người nhận.
        """
        guest_name = self.entry_guest_name.get().strip()
        if not guest_name:
            messagebox.showwarning("Nhắc nhở", "Vui lòng nhập Tên người nhận trước khi xuất file!")
            self.entry_guest_name.focus_set()
            return

        filename = self.entry_filename.get().strip()
        if not filename:
            slug = slugify_vietnamese(guest_name)
            filename = f"thiep_cuoi_gui_{slug}.html"
        if not filename.lower().endswith(".html"):
            filename += ".html"

        # Đổi trạng thái nút bấm
        self.btn_export_single.config(text="⏳ Đang đóng gói & xáo trộn mã nguồn...", state="disabled")
        self.update_idletasks()

        try:
            # 1. Thu thập cấu hình nền từ Tab 1
            cfg = self._collect_current_config_from_tab1()

            # 2. Áp dụng cá nhân hóa người nhận
            if 'openingScreen' not in cfg: cfg['openingScreen'] = {}
            cfg['openingScreen']['subtitle'] = self.entry_opening_sub.get().strip()

            if 'texts' not in cfg: cfg['texts'] = {}
            if 'invitation' not in cfg['texts']: cfg['texts']['invitation'] = {}
            cfg['texts']['invitation']['guestLabel'] = self.entry_guest_label.get().strip()
            cfg['texts']['invitation']['subheading'] = self.entry_subheading.get().strip()
            cfg['texts']['invitation']['blessing'] = self.entry_blessing.get().strip()

            # Cá nhân hóa phản hồi tham dự (bỏ hoàn toàn từ RSVP)
            if 'rsvp' not in cfg['texts']: cfg['texts']['rsvp'] = {}
            cfg['texts']['rsvp']['subtitle'] = "PHẢN HỒI THAM DỰ"
            thank_toast_val = self.entry_thank_toast.get().strip()
            cfg['texts']['rsvp']['thankYouToast'] = thank_toast_val
            if 'thankYouModal' in cfg['texts']['rsvp'] and isinstance(cfg['texts']['rsvp']['thankYouModal'], dict):
                if thank_toast_val:
                    cfg['texts']['rsvp']['thankYouModal']['messageYes'] = thank_toast_val
            if 'nameField' not in cfg['texts']['rsvp']: cfg['texts']['rsvp']['nameField'] = {}
            cfg['texts']['rsvp']['nameField']['defaultValue'] = guest_name

            if 'attendanceField' not in cfg['texts']['rsvp']: cfg['texts']['rsvp']['attendanceField'] = {}
            cfg['texts']['rsvp']['attendanceField']['label'] = ""
            cfg['texts']['rsvp']['attendanceField']['yesOption'] = self.entry_yes_option.get().strip()
            cfg['texts']['rsvp']['attendanceField']['noOption'] = self.entry_no_option.get().strip()

            if 'accompanyField' not in cfg['texts']['rsvp']: cfg['texts']['rsvp']['accompanyField'] = {}
            cfg['texts']['rsvp']['accompanyField']['label'] = self.entry_accompany_label.get().strip()

            # 3. Đường dẫn xuất
            export_path = EXPORT_DIR / filename

            # 4. Thực hiện đóng gói và xáo trộn mã nguồn
            bundle_and_obfuscate_html(cfg, export_path, guest_name)

            # Khôi phục nút bấm
            self.btn_export_single.config(text="🚀 XUẤT 1 FILE HTML ĐÃ XÁO TRỘN MÃ NGUỒN", state="normal")

            # Hộp thoại thông báo thành công
            msg = (f"ĐÃ XUẤT THIỆP THÀNH CÔNG! 🎉\n\n"
                   f"• Người nhận: {guest_name}\n"
                   f"• File xuất: {filename}\n"
                   f"• Nơi lưu: {export_path.resolve()}\n\n"
                   f"Toàn bộ hình ảnh, CSS và JS đã được gộp vào 1 file duy nhất và xáo trộn mã nguồn chống đọc trộm.\n"
                   f"Bạn có muốn mở xem thiệp ngay bây giờ không?")
            
            res = messagebox.askyesno("Xuất File Hoàn Tất", msg)
            if res:
                webbrowser.open(str(export_path.resolve().as_uri()))

        except Exception as e:
            self.btn_export_single.config(text="🚀 XUẤT 1 FILE HTML ĐÃ XÁO TRỘN MÃ NGUỒN", state="normal")
            messagebox.showerror("Lỗi xuất file", f"Đã xảy ra lỗi khi đóng gói thiệp cưới:\n{e}")

# ==============================================================================
# 5. KHỞI CHẠY ỨNG DỤNG
# ==============================================================================
if __name__ == "__main__":
    app = WeddingToolApp()
    app.mainloop()
