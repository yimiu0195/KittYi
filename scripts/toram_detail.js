const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../utils/db');

const baseURL = 'https://en.toram.jp';

const blacklistSelectors = [    
    'div.smallTitleLine.news_title_border',
    '#top',
    '#news > div > a',
    '#news > div > details',  
];

function extractText(el, $) {
    let currentLine = '';

    el.contents().each((_, node) => {
        if (node.type === 'text') {
            const text = node.data.replace(/\s+/g, ' '); // normalize whitespace
            currentLine += text;
        } else if (node.type === 'tag') {
            if (node.name === 'br') {
                currentLine += '\n';
            } else {
                const wrapped = extractText($(node), $);

                // Inline elements (like font, span, etc.) don't need spacing around
                if (['b', 'strong', 'i', 'em', 'u', 'font', 'span'].includes(node.name)) {
                    currentLine += wrapped;
                } else {
                    // For block-level tags like div/p, maybe add spacing if needed
                    currentLine += wrapped;
                }
            }
        }
    });

    return currentLine.trim().replace(/ *\n */g, '\n');
}

function mergeDescriptionsUntilImage(data) {
    const merged = [];
    let buffer = [];

    for (const [type, content] of data) {
        if (type === 'Description') {
            buffer.push(content.trim());
        } else {
            if (buffer.length > 0) {
                merged.push(['Description', buffer.join('\n')]);
                buffer = [];
            }
            merged.push([type, content]);
        }
    }

    if (buffer.length > 0) {
        merged.push(['Description', buffer.join('\n')]);
    }

    return merged;
}

async function scrapeToramInfo(url) {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const result = [];
    const container = $('#news > div')[0];
    if (!container) return [];

    const nodes = container.childNodes;

    for (let node of nodes) {
        if (!node) continue;

        if (node.type === 'text') {
            const text = node.data?.trim();
            if (text && text !== '-') result.push(['Description', text]);
        }

        if (node.type === 'tag') {
            const el = $(node);
            const className = el.attr('class') || '';

            if (blacklistSelectors.some(sel => el.is(sel))) continue;
            if (className.includes('btn_back_area')) break;

            if (className.includes('deluxetitle')) {
                result.push(['Deluxetitle', el.text().trim()]);
                continue;
            }

            if (className.includes('subtitle')) {
                result.push(['Subtitle', el.text().trim()]);
                continue;
            }

            if (className.includes('description')) {
                const cleaned = extractText(el, $);
                if (cleaned) result.push(['Description', cleaned]);
                continue;
            }

            if (node.name === 'img') {
                const src = el.attr('src');
                if (src) result.push(['Img', src.startsWith('http') ? src : baseURL + src]);
                continue;
            }

            const img = el.find('img');
            if (img.length > 0) {
                const src = img.attr('src');
                if (src) result.push(['Img', src.startsWith('http') ? src : baseURL + src]);
                continue;
            }

            const text = el.text().trim();
            if (text) result.push(['Description', text]);
        }
    }

    return result;
}

async function updateDetail() {

    const [indexRows] = await pool.query(`
        SELECT i.group_id, i.title, i.date, i.url
        FROM ToramIndex i
        WHERE NOT EXISTS (
        SELECT 1
        FROM ToramDetail t
        WHERE t.content_type = 'Title'
            AND t.group_id = i.group_id
            AND t.content = i.title
            AND t.date = i.date
        )
    `);

    if (indexRows.length === 0) {
        return;
    }

    for (const post of indexRows) {
        console.log(`📥 [${post.group_id}] ${post.title}`);

        const detailData = [];
        let extractedDate = post.date || null;

        detailData.push([post.group_id, 'Title', post.title, true, extractedDate]);

        const raw = await scrapeToramInfo(post.url);
        const merged = mergeDescriptionsUntilImage(raw);

        for (const [type, content] of merged) {
            if (!extractedDate && type === 'Description') {
                const match = content.match(/Date:\s*(\d{4}-\d{2}-\d{2})/);
                if (match) {
                    extractedDate = match[1];
                }
            }
            detailData.push([post.group_id, type, content, true, extractedDate]);
        }

        await pool.query(
            `INSERT INTO ToramDetail (group_id, content_type, content, notified, date)
            VALUES ?`,
            [detailData]
        );
    }
    console.log(`✅ ${indexRows.length} posts updated in ToramDetail.`);
}

module.exports = updateDetail;

if (require.main === module) {
    updateDetail();
}