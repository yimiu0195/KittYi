# KittYi

Discord Bot


## Clone code

```bash
git clone https://github.com/yimiu0195/KittYi.git
```


## Cập nhật Code

```bash
git pull origin main
```


## Các tính năng chính của bot

- Slash commands
- Prefix commands
- Toram commands
- Schedule commands
- Embed commands
- Steam Sale Notification commands


## Yêu cầu

- Node.js v20+
- MySQL
- Discord bot token


## Thiết lập

```bash
# Cài đặt thư viện
npm install

# .env (Tạo file .env nằm cùng cấp với index.js, nội dung .env như sau)
TOKEN=Bot_Token
CLIENT_ID=Bot_Client_ID
PREFIX=yi
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
OWNER_ID=Discord_ID_của_bản_thân
ALLOWED_USER_IDS=Discord_ID_của_những_người_dùng_khác

# Tạo bảng trong database
node .\scripts\init_db.js

# Chạy bot
node index.js
```


## Liên hệ
Được tạo bởi [Hua&Ya] (https://github.com/yimiu0195)