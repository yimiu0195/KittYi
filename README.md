# KittYi

A discord bot is built for You


## Features

- Slash commands
- Prefix commands
- Toram commands
- Schedule commands
- Embed commands
- Steam Sale Notification commands


## Requirements

- Node.js v20+
- MySQL
- Discord bot token


## Setup

```bash
# Install dependencies
npm install

# .env
TOKEN=Bot_Token
CLIENT_ID=Bot_Client_ID
PREFIX=yi
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
OWNER_ID=Your_Discord_ID
ALLOWED_USER_IDS=Other_Discord_ID

# Create tables
node .\scripts\init_db.js

# Start the bot
node index.js
```


## Contact
Created by [Hua] (https://github.com/yimiu0195)