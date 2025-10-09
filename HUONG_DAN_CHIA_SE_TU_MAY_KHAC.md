# 🌐 Hướng Dẫn Xem Bài Chia Sẻ Từ Máy Khác (IP Khác)

## ❗ Vấn Đề
Người dùng từ máy khác (IP khác) không thể xem được bài làm được chia sẻ từ máy chủ.

## ✅ Giải Pháp: Sử Dụng Local Server (Trong Mạng LAN)

Chia sẻ trong mạng nội bộ, tốc độ cao, miễn phí hoàn toàn.

---

## 📋 A. TRÊN MÁY CHỦ (Host - Máy Chia Sẻ Bài)

### Bước 1: Khởi Động Server

**Cách 1: Dùng file .bat (Đơn giản nhất)**
```
Double-click vào file: start-server.bat
```

**Cách 2: Dùng Terminal**
```bash
npm run server
```

Hoặc:
```bash
node server.js
```

### Bước 2: Lấy Địa Chỉ IP

Server sẽ hiển thị IP trong console:
```
🚀 Server đang chạy tại:
   - Local:   http://localhost:3000
   - Network: http://192.168.1.100:3000  ← Copy địa chỉ này
```

**Hoặc tìm IP thủ công:**

**Windows:**
```bash
ipconfig
```
Tìm dòng "IPv4 Address" trong phần "Wireless LAN adapter Wi-Fi"
Ví dụ: `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig
```
Hoặc:
```bash
ip addr show
```

### Bước 3: Cấu Hình Firewall (QUAN TRỌNG!)

**Windows:**

**Cách 1: Dùng lệnh (Nhanh nhất)**
1. Mở CMD as Administrator
2. Chạy lệnh:
```bash
netsh advfirewall firewall add rule name="TracNghiemPro" dir=in action=allow protocol=TCP localport=3000
```

**Cách 2: Dùng GUI**
1. Mở **Windows Defender Firewall**
2. Click **"Advanced settings"**
3. Click **"Inbound Rules"** → **"New Rule"**
4. Chọn **"Port"** → Next
5. Chọn **"TCP"**, nhập port **3000** → Next
6. Chọn **"Allow the connection"** → Next
7. Chọn tất cả (Domain, Private, Public) → Next
8. Đặt tên: "TracNghiemPro Server" → Finish

**Mac:**
```bash
# Firewall thường đã cho phép kết nối local
# Nếu cần, vào System Preferences → Security & Privacy → Firewall
```

**Linux:**
```bash
sudo ufw allow 3000/tcp
```

### Bước 4: Chia Sẻ IP

Gửi địa chỉ IP cho người dùng khác:
```
http://192.168.1.100:3000
```

---

## 📋 B. TRÊN MÁY KHÁCH (Client - Máy Xem Bài)

### Bước 1: Lấy Địa Chỉ IP Từ Máy Chủ

Hỏi người quản lý máy chủ để lấy địa chỉ IP.
Ví dụ: `http://192.168.1.100:3000`

### Bước 2: Cấu Hình Server URL

**Cách 1: Tự Động Tìm (Khuyến nghị)**
1. Mở ứng dụng
2. Vào tab **"Khám Phá Đề Thi"**
3. Click nút **"Cấu Hình Server"** (biểu tượng ⚙️)
4. Click **"Tự Động Tìm"**
5. Đợi hệ thống tìm server trong mạng

**Cách 2: Nhập Thủ Công**
1. Mở ứng dụng
2. Vào tab **"Khám Phá Đề Thi"**
3. Click nút **"Cấu Hình Server"** (biểu tượng ⚙️)
4. Nhập địa chỉ: `http://192.168.1.100:3000` (thay IP của máy chủ)
5. Click **"Kiểm Tra & Lưu"**

### Bước 3: Kiểm Tra Kết Nối

- Nếu thành công: ✅ "Kết nối thành công!"
- Nếu thất bại: Xem phần "Khắc Phục Sự Cố" bên dưới

---

## 🔧 KHẮC PHỤC SỰ CỐ

### ❌ Lỗi: "Không thể kết nối server"

**1. Server chưa chạy**
- ✅ Khởi động server trên máy chủ: `npm run server`
- ✅ Kiểm tra console có hiển thị "Server đang chạy" không

**2. Firewall chặn kết nối**
- ✅ Tắt tạm thời firewall để test
- ✅ Thêm rule cho port 3000 (xem Bước 3 phía trên)
- ✅ Kiểm tra antivirus có chặn không

**3. IP không đúng**
- ✅ Kiểm tra lại IP của máy chủ: `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux)
- ✅ Đảm bảo cả 2 máy cùng mạng WiFi/LAN
- ✅ Thử ping IP: `ping 192.168.1.100`

**4. Port bị chiếm dụng**
- ✅ Thay đổi port trong `server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Đổi từ 3000 sang 3001
```
- ✅ Nhớ cập nhật port trong địa chỉ: `http://192.168.1.100:3001`

**5. Không cùng mạng**
- ✅ Đảm bảo cả 2 máy kết nối cùng WiFi/Router
- ✅ Kiểm tra subnet: IP phải cùng dải (ví dụ: 192.168.1.x)

**6. Router chặn**
- ✅ Một số router có tính năng "Client Isolation" - tắt nó đi
- ✅ Vào cài đặt router và tắt "AP Isolation" hoặc "Client Isolation"

---

## 📊 Ưu Điểm Local Server

| Tiêu Chí | Local Server |
|----------|--------------|
| **Dễ cài đặt** | ⭐⭐⭐⭐ |
| **Truy cập** | Trong mạng LAN |
| **Tốc độ** | ⭐⭐⭐⭐⭐ (Rất nhanh) |
| **Chi phí** | Miễn phí hoàn toàn |
| **Bảo mật** | ⭐⭐⭐⭐ (Dữ liệu trên máy bạn) |
| **Cần cấu hình mạng** | ✅ Có (đơn giản) |

**Ưu điểm:**
- 🏠 **Tốc độ cao**: Dữ liệu truyền trong mạng nội bộ
- 💾 **Dữ liệu của bạn**: Lưu trên máy, không lên cloud
- 💰 **Miễn phí**: Không giới hạn
- 🔒 **Riêng tư**: Không ai khác truy cập được

---

## 🎯 Checklist Hoàn Thành

### Local Server

**Trên Máy Chủ:**
- [ ] Khởi động server
- [ ] Lấy địa chỉ IP
- [ ] Cấu hình firewall
- [ ] Chia sẻ IP cho máy khác

**Trên Máy Khách:**
- [ ] Lấy IP từ máy chủ
- [ ] Cấu hình server URL
- [ ] Test kết nối
- [ ] Test chia sẻ và xem bài

---

## 💡 TIPS & TRICKS

### 1. Dùng Static IP cho máy chủ
Để không phải đổi config mỗi khi khởi động lại:
- Vào cài đặt router
- Cấu hình DHCP Reservation cho MAC address của máy chủ
- Gán IP cố định (ví dụ: 192.168.1.100)

### 2. Tạo QR Code
Tạo QR code chứa server URL để chia sẻ nhanh:
- Dùng trang: https://www.qr-code-generator.com/
- Nhập URL: `http://192.168.1.100:3000`
- In QR code ra giấy

### 3. Bookmark
Lưu URL với server IP để truy cập nhanh:
- Trên máy khách, bookmark: `http://192.168.1.100:3000`
- Đặt tên: "Trắc Nghiệm Pro - Server"

### 4. Tạo shortcut
**Windows:**
```
Tạo file .bat với nội dung:
start http://192.168.1.100:3000
```

**Mac:**
```
Tạo file .command với nội dung:
open http://192.168.1.100:3000
```

---

## 📞 HỖ TRỢ

### Kiểm tra kết nối

**Test 1: Ping**
```bash
ping 192.168.1.100
```
Nếu thành công → Mạng OK

**Test 2: Telnet**
```bash
telnet 192.168.1.100 3000
```
Nếu kết nối được → Server OK

**Test 3: Browser**
Mở trình duyệt và truy cập:
```
http://192.168.1.100:3000/api/server-info
```
Nếu thấy JSON → Server hoạt động

### Xem log

**Trên máy chủ:**
- Xem console của server
- Kiểm tra có request từ máy khách không

**Trên máy khách:**
- Mở Console (F12)
- Xem tab Network
- Kiểm tra request có đến server không

---

## 🎉 SAU KHI HOÀN THÀNH

Người dùng từ các máy trong mạng LAN có thể:
- ✅ Xem tất cả quiz đã chia sẻ
- ✅ Chia sẻ quiz của họ
- ✅ Làm bài từ quiz của người khác
- ✅ Tốc độ rất nhanh (mạng nội bộ)

Hoạt động trên:
- ✅ Máy tính (Windows, Mac, Linux)
- ✅ Điện thoại (Android, iOS)
- ✅ Tablet
- ✅ Bất kỳ trình duyệt nào

Không cần:
- ❌ Cài đặt thêm gì
- ❌ Tài khoản cloud
- ❌ Trả phí
- ❌ Internet (chỉ cần mạng LAN)

---

## 📚 TÀI LIỆU THAM KHẢO

- `KHAC_PHUC_CHIA_SE_TU_MAY_KHAC.txt` - Hướng dẫn nhanh
- `HUONG_DAN_CHIA_SE_MANG.md` - Hướng dẫn chia sẻ mạng
- `README_CHIA_SE.md` - Tổng quan tính năng chia sẻ

---

**Chúc bạn thành công! 🎉**

Nếu vẫn gặp vấn đề, hãy kiểm tra:
1. Console log (F12) để xem lỗi chi tiết
2. Server log để xem request có đến không
3. Network tab để xem request/response

**Các lỗi phổ biến:**
- `ERR_CONNECTION_REFUSED`: Server chưa chạy hoặc firewall chặn
- `ERR_NAME_NOT_RESOLVED`: IP/domain không đúng
- `CORS error`: Server chưa enable CORS (đã fix trong code)
