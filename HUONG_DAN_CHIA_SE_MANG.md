# 🌐 Hướng Dẫn Chia Sẻ Quiz Qua Mạng LAN/Internet

## 📋 Tổng Quan

Hệ thống đã được nâng cấp để hỗ trợ chia sẻ quiz giữa các máy tính khác nhau trên cùng mạng LAN hoặc qua Internet.

### ✨ Tính Năng Mới

- ✅ **Tự động phát hiện IP**: Server hiển thị tất cả địa chỉ IP có thể truy cập
- ✅ **Cấu hình linh hoạt**: Người dùng có thể nhập địa chỉ server thủ công
- ✅ **Tự động tìm server**: Tự động quét mạng LAN để tìm server
- ✅ **CORS đầy đủ**: Cho phép truy cập từ mọi nguồn
- ✅ **Lắng nghe trên 0.0.0.0**: Server có thể nhận kết nối từ mọi network interface

---

## 🚀 Cài Đặt & Khởi Động

### Bước 1: Cài Đặt Dependencies

```bash
npm install
```

### Bước 2: Khởi Động Server

**Trên máy chủ (máy chứa server):**

```bash
# Cách 1: Dùng npm
npm run server

# Cách 2: Dùng node
node server.js

# Cách 3: Double-click (Windows)
start-server.bat
```

### Bước 3: Xem Địa Chỉ IP

Sau khi khởi động, server sẽ hiển thị:

```
🚀 ========================================
   SERVER ĐANG CHẠY
========================================

📍 Truy cập LOCAL (trên máy này):
   http://localhost:3000
   http://127.0.0.1:3000

🌐 Truy cập từ MẠNG LAN (máy khác):
   http://192.168.1.100:3000
   http://192.168.1.101:3000

📚 API Endpoints:
   GET  /api/shared-quizzes
   POST /api/shared-quizzes
   GET  /api/server-info

💡 Hướng dẫn:
   - Mở index.html trong trình duyệt
   - Người dùng khác dùng địa chỉ IP mạng LAN
   - Đảm bảo tường lửa cho phép cổng 3000

========================================
```

**Lưu ý IP của máy chủ** (ví dụ: `192.168.1.100`)

---

## 👥 Sử Dụng Trên Các Máy Khác Nhau

### Trường Hợp 1: Trên Máy Chủ (Máy Chạy Server)

1. Mở `index.html` trong trình duyệt
2. Hệ thống tự động kết nối `http://localhost:3000`
3. Sử dụng bình thường

### Trường Hợp 2: Trên Máy Khác (Cùng Mạng LAN)

#### Phương Pháp A: Tự Động Tìm Server

1. Mở `index.html` trong trình duyệt
2. Vào tab **"Khám Phá Đề Thi"**
3. Nếu không kết nối được, click **"Thử lại"**
4. Click **"Hướng Dẫn Khởi Động Server"**
5. Click **"Cấu Hình Server"** (nếu có)
6. Click **"Tự Động Tìm"**
7. Hệ thống sẽ tự động quét và kết nối

#### Phương Pháp B: Nhập Địa Chỉ Thủ Công

1. Mở `index.html` trong trình duyệt
2. Mở **Console** (F12)
3. Gõ lệnh:

```javascript
exploreQuizManager.showServerURLDialog()
```

4. Nhập địa chỉ IP của máy chủ:
   - Ví dụ: `http://192.168.1.100:3000`
   - Hoặc: `192.168.1.100:3000` (tự động thêm http://)

5. Click **"Kiểm Tra & Lưu"**
6. Nếu thành công, địa chỉ sẽ được lưu tự động

#### Phương Pháp C: Sửa Code (Nâng Cao)

Mở file `explore-quiz.js`, tìm dòng:

```javascript
return 'http://localhost:3000/api';
```

Thay bằng:

```javascript
return 'http://192.168.1.100:3000/api'; // IP của máy chủ
```

---

## 🔧 Cấu Hình Tường Lửa

### Windows Firewall

1. Mở **Windows Defender Firewall**
2. Click **"Advanced settings"**
3. Click **"Inbound Rules"** → **"New Rule"**
4. Chọn **"Port"** → Next
5. Chọn **"TCP"**, nhập port **3000** → Next
6. Chọn **"Allow the connection"** → Next
7. Chọn tất cả profiles → Next
8. Đặt tên: **"Quiz App Server"** → Finish

### Hoặc Dùng Command (Chạy với quyền Admin):

```cmd
netsh advfirewall firewall add rule name="Quiz App Server" dir=in action=allow protocol=TCP localport=3000
```

### macOS Firewall

```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp node
```

### Linux (UFW)

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

---

## 🌍 Chia Sẻ Qua Internet (Nâng Cao)

### Phương Pháp 1: Port Forwarding (Router)

1. Đăng nhập vào router (thường là `192.168.1.1`)
2. Tìm mục **"Port Forwarding"** hoặc **"Virtual Server"**
3. Thêm rule mới:
   - **External Port**: 3000
   - **Internal Port**: 3000
   - **Internal IP**: IP của máy chủ (ví dụ: 192.168.1.100)
   - **Protocol**: TCP
4. Lưu và khởi động lại router
5. Lấy IP công cộng: https://whatismyipaddress.com/
6. Chia sẻ địa chỉ: `http://[IP-công-cộng]:3000`

**⚠️ Lưu ý bảo mật:**
- Chỉ mở port khi cần thiết
- Sử dụng VPN hoặc ngrok cho an toàn hơn

### Phương Pháp 2: Ngrok (Đơn Giản & An Toàn)

1. Tải ngrok: https://ngrok.com/download
2. Giải nén và chạy:

```bash
ngrok http 3000
```

3. Ngrok sẽ tạo URL công khai:
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

4. Chia sẻ URL: `https://abc123.ngrok.io`

5. Ng��ời dùng khác cấu hình:
   ```javascript
   exploreQuizManager.showServerURLDialog()
   // Nhập: https://abc123.ngrok.io
   ```

### Phương Pháp 3: Cloudflare Tunnel (Miễn Phí & Bảo Mật)

1. Cài đặt cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Chạy tunnel:

```bash
cloudflared tunnel --url http://localhost:3000
```

3. Sử dụng URL được tạo

---

## 🧪 Kiểm Tra Kết Nối

### Test 1: Kiểm Tra Server Đang Chạy

Mở trình duyệt, truy cập:

```
http://localhost:3000/api/server-info
```

Kết quả mong đợi:

```json
{
  "success": true,
  "host": "localhost",
  "port": 3000,
  "ipAddresses": ["192.168.1.100"],
  "localUrl": "http://localhost:3000",
  "networkUrls": ["http://192.168.1.100:3000"]
}
```

### Test 2: Kiểm Tra Từ Máy Khác

Từ máy khác trong mạng LAN, mở trình duyệt:

```
http://[IP-máy-chủ]:3000/api/server-info
```

Ví dụ:
```
http://192.168.1.100:3000/api/server-info
```

### Test 3: Kiểm Tra API Quiz

```
http://[IP-máy-chủ]:3000/api/shared-quizzes
```

Kết quả mong đợi:

```json
{
  "success": true,
  "quizzes": []
}
```

---

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi 1: "Không thể k���t nối server"

**Nguyên nhân:**
- Server chưa chạy
- Địa chỉ IP sai
- Tường lửa chặn

**Giải pháp:**
1. Kiểm tra server đang chạy trên máy chủ
2. Xác nhận địa chỉ IP đúng
3. Tắt tường lửa tạm thời để test
4. Kiểm tra cả 2 máy cùng mạng LAN

### Lỗi 2: "ERR_CONNECTION_REFUSED"

**Nguyên nhân:**
- Server không lắng nghe trên 0.0.0.0
- Port đã được sử dụng

**Giải pháp:**
1. Kiểm tra server.js có dòng:
   ```javascript
   app.listen(PORT, '0.0.0.0', ...)
   ```
2. Thử port khác:
   ```bash
   PORT=3001 node server.js
   ```

### Lỗi 3: "CORS Error"

**Nguyên nhân:**
- CORS chưa được cấu hình đúng

**Giải pháp:**
- Đã được fix trong code mới, kiểm tra server.js có:
  ```javascript
  app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
  }));
  ```

### Lỗi 4: "Timeout"

**Nguyên nhân:**
- Mạng chậm
- Server quá tải

**Giải pháp:**
- Tăng timeout trong explore-quiz.js:
  ```javascript
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây
  ```

### Lỗi 5: Không Tìm Thấy IP

**Nguyên nhân:**
- Máy không có kết nối mạng
- Chỉ có loopback interface

**Giải pháp:**
1. Kiểm tra kết nối mạng
2. Xem IP thủ công:
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig` hoặc `ip addr`
3. Nhập IP thủ công vào ứng dụng

---

## 📱 Sử Dụng Trên Mobile

### Cách 1: Truy Cập Qua Browser

1. Đảm bảo điện thoại cùng WiFi với máy chủ
2. Mở browser trên điện thoại
3. Nhập: `http://[IP-máy-chủ]:3000`
4. Mở `index.html` (hoặc host trang web)

### Cách 2: Host Trang Web

Thêm vào `server.js`:

```javascript
// Serve index.html as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
```

Sau đó truy cập trực tiếp:
```
http://[IP-máy-chủ]:3000
```

---

## 🔐 Bảo Mật

### Khuyến Nghị

1. **Không mở port ra Internet** nếu không cần thiết
2. **Sử dụng VPN** khi chia sẻ qua Internet
3. **Thêm authentication** cho API (nâng cao)
4. **Sử dụng HTTPS** với SSL certificate
5. **Giới hạn CORS** cho các domain cụ thể

### Thêm Authentication (Nâng Cao)

Thêm vào `server.js`:

```javascript
const API_KEY = 'your-secret-key-here';

// Middleware kiểm tra API key
app.use('/api', (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== API_KEY) {
        return res.status(401).json({ 
            success: false, 
            error: 'Unauthorized' 
        });
    }
    next();
});
```

Trong `explore-quiz.js`:

```javascript
const response = await fetch(`${this.API_BASE_URL}/shared-quizzes`, {
    headers: {
        'X-API-Key': 'your-secret-key-here'
    }
});
```

---

## 📊 Monitoring & Logs

### Xem Logs Server

Server tự động log các request:

```
GET /api/shared-quizzes - 200 OK
POST /api/shared-quizzes - 201 Created
GET /api/server-info - 200 OK
```

### Thêm Logging Chi Tiết

Thêm vào `server.js`:

```javascript
// Middleware logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});
```

---

## 🎯 Best Practices

### 1. Đặt Tên Server Rõ Ràng

Trong `server.js`:

```javascript
const SERVER_NAME = 'Quiz Server - Phòng Học A';
console.log(`📚 ${SERVER_NAME} đang chạy...`);
```

### 2. Backup Dữ Liệu

```bash
# Backup shared-quizzes.json định kỳ
cp shared-quizzes.json shared-quizzes.backup.json
```

### 3. Sử Dụng Environment Variables

Tạo file `.env`:

```
PORT=3000
HOST=0.0.0.0
API_KEY=your-secret-key
```

Trong `server.js`:

```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
```

### 4. Restart Tự Động

Sử dụng `nodemon`:

```bash
npm install -g nodemon
nodemon server.js
```

---

## 📞 Hỗ Trợ

### Câu Hỏi Thường Gặp

**Q: Có thể chia sẻ qua Internet không?**
A: Có, sử dụng port forwarding hoặc ngrok.

**Q: Có giới hạn số người dùng không?**
A: Không có giới hạn cứng, phụ thuộc vào hiệu năng máy chủ.

**Q: Dữ liệu có bị mất không?**
A: Dữ liệu lưu trong `shared-quizzes.json`, nên backup định kỳ.

**Q: Có thể dùng database không?**
A: Có, có thể tích hợp MongoDB, MySQL, PostgreSQL.

### Liên Hệ

- Email: support@example.com
- GitHub Issues: [Link]
- Discord: [Link]

---

## 🎉 Kết Luận

Hệ thống đã được nâng cấp hoàn chỉnh để hỗ trợ chia sẻ quiz qua mạng. Các tính năng chính:

✅ Tự động phát hiện server
✅ Cấu hình linh hoạt
✅ Hỗ trợ LAN và Internet
✅ Bảo mật cơ bản
✅ Dễ dàng sử dụng

**Chúc bạn sử dụng vui vẻ! 🚀**

---

© Trần Văn Anh - 2025
