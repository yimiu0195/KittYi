const axios = require("axios");
const cheerio = require("cheerio");
const pool = require("../utils/db");

const typeMap = {
    "その他": "SHOP",
    "イベント": "EVENT",
    "不具合": "BUG",
    "メンテナンス": "MAINTENANCE",
    "アップデート": "UPDATE"
};

async function updateIndex() {
  try {
    const response = await axios.get("https://en.toram.jp/information");
    const $ = cheerio.load(response.data);

    const a = $("#news > div.useBox > ul > li > a").first();
    if (!a || a.length === 0) {
        console.log("⚠️ no news found.");
        return;
    }

    const title = a.find(".news_link > p").text().trim() || "No title";
    const dateText = a.find(".newsCategoryInner > p > time").text().trim() || "Unknown";
    const typeJP = a.find(".newsCategoryInner > img").attr("alt")?.trim() || "Unknown";
    const url = "https://en.toram.jp" + a.attr("href");
    const match = url.match(/information_id=(\d+)/);
    const groupId = match ? parseInt(match[1]) : null;

    // console.log("groupId:", groupId);
    // console.log("title:", title);
    // console.log("url:", url);

    if (!groupId) {
        console.log("⚠️ No valid group ID found in URL");
        return;
    }

    const parsedDate = new Date(dateText);
    const date = isNaN(parsedDate) ? null : parsedDate.toISOString().split("T")[0];
    const [rows] = await pool.execute(
        "SELECT id FROM ToramIndex WHERE group_id = ? AND title = ? AND date = ?",
        [groupId, title, date]
    );

    if (rows.length > 0) {
      return;
    }

    const typeEN = typeMap[typeJP] || typeJP;

    await pool.execute(
        `INSERT INTO ToramIndex (group_id, title, url, date, type)
        VALUES (?, ?, ?, ?, ?)`,
        [groupId, title, url, date, typeEN]
    );

    console.log(`✅ Add: [${groupId}] ${title}`);
    } catch (err) {
        console.error("❌ Err:", err.message);
    }
}

module.exports = updateIndex;

if (require.main === module) {
    updateIndex();
}