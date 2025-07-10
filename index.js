const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// 環境變數設定
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 創建Discord客戶端
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 聖經書卷對應表
const BIBLE_BOOKS = {
    '太': '太', '可': '可', '路': '路', '約': '約', '徒': '徒', '羅': '羅',
    '林前': '林前', '林後': '林後', '加': '加', '弗': '弗', '腓': '腓', '西': '西',
    '帖前': '帖前', '帖後': '帖後', '提前': '提前', '提後': '提後', '多': '多',
    '門': '門', '來': '來', '雅': '雅', '彼前': '彼前', '彼後': '彼後',
    '約一': '約一', '約二': '約二', '約三': '約三', '猶': '猶', '啟': '啟',
    '創': '創', '出': '出', '詩': '詩', '箴': '箴', '傳': '傳', '賽': '賽',
    '耶': '耶', '結': '結', '但': '但', '何': '何', '珥': '珥', '摩': '摩'
};

// 預設的安慰經文庫（備用）
const COMFORT_VERSES = [
    { ref: '太11:28', text: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。' },
    { ref: '詩23:4', text: '我雖然行過死蔭的幽谷，也不怕遭害，因為你與我同在；你的杖，你的竿，都安慰我。' },
    { ref: '賽41:10', text: '你不要害怕，因為我與你同在；不要驚惶，因為我是你的神。我必堅固你，我必幫助你；我必用我公義的右手扶持你。' },
    { ref: '腓4:13', text: '我靠著那加給我力量的，凡事都能做。' },
    { ref: '腓4:19', text: '我的神必照他榮耀的豐富，在基督耶穌裡，使你們一切所需用的都充足。' },
    { ref: '羅8:28', text: '我們曉得萬事都互相效力，叫愛神的人得益處，就是按他旨意被召的人。' },
    { ref: '林後4:16', text: '所以，我們不喪膽。外體雖然毀壞，內心卻一天新似一天。' },
    { ref: '彼前5:7', text: '你們要將一切的憂慮卸給神，因為他顧念你們。' }
];

// 使用GPT分析情緒
async function analyzeEmotion(message) {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `你是一個情緒分析專家。請分析使用者的訊息，判斷是否包含負面情緒。
                    
請回應JSON格式：
{
  "isNegative": true/false,
  "emotionType": "疲憊/絕望/焦慮/悲傷/憤怒/孤獨/壓力/其他",
  "intensity": 1-10,
  "keywords": ["關鍵字陣列"],
  "suggestion": "建議的聖經主題"
}

負面情緒包括但不限於：累、疲憊、想放棄、不想活、絕望、焦慮、悲傷、壓力、孤獨、害怕、擔心、失望等。
建議主題如：安慰、盼望、力量、平安、愛、信心、保護等。`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            temperature: 0.3,
            max_tokens: 300
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const result = JSON.parse(response.data.choices[0].message.content);
        console.log('情緒分析結果:', result);
        return result;

    } catch (error) {
        console.error('GPT情緒分析失敗:', error.response?.data || error.message);
        
        // 簡單的關鍵字分析作為備用
        const negativeKeywords = [
            '累', '疲憊', '想放棄', '不想活', '絕望', '焦慮', '悲傷', 
            '壓力', '孤獨', '害怕', '擔心', '失望', '痛苦', '難過',
            '憂鬱', '無助', '沮喪', '煩惱', '困難', '挫折'
        ];
        
        const hasNegative = negativeKeywords.some(keyword => message.includes(keyword));
        
        return {
            isNegative: hasNegative,
            emotionType: '一般負面',
            intensity: hasNegative ? 5 : 0,
            keywords: negativeKeywords.filter(keyword => message.includes(keyword)),
            suggestion: '安慰'
        };
    }
}
// 使用GPT選擇合適的經文
async function selectAppropriateVerse(emotionAnalysis) {
    try {
        const verseList = COMFORT_VERSES.map(v => `${v.ref}: ${v.text}`).join('\n');
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `你是一位牧師，擅長用聖經經文安慰人。根據情緒分析結果，從提供的經文中選擇最合適的一節。

請回應JSON格式：
{
  "selectedVerse": "經文引用",
  "verseText": "經文內容",
  "reason": "選擇原因",
  "comfortMessage": "溫暖的安慰話語"
}

情緒類型：${emotionAnalysis.emotionType}
強度：${emotionAnalysis.intensity}/10
關鍵字：${emotionAnalysis.keywords.join(', ')}
建議主題：${emotionAnalysis.suggestion}`
                },
                {
                    role: 'user',
                    content: `請從以下經文中選擇最合適的：\n${verseList}`
                }
            ],
            temperature: 0.7,
            max_tokens: 400
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return JSON.parse(response.data.choices[0].message.content);

    } catch (error) {
        console.error('GPT經文選擇失敗:', error.response?.data || error.message);
        
        // 隨機選擇一節經文作為備用
        const randomVerse = COMFORT_VERSES[Math.floor(Math.random() * COMFORT_VERSES.length)];
        return {
            selectedVerse: randomVerse.ref,
            verseText: randomVerse.text,
            reason: '願這節經文帶給你安慰',
            comfortMessage: '神愛你，祂必不撇下你，也不丟棄你。'
        };
    }
}

// 從聖經API獲取經文
async function getBibleVerse(reference) {
    try {
        // 解析經文引用 (例如: 太11:28)
        const match = reference.match(/^(.+?)(\d+):(\d+)$/);
        if (!match) return null;
        
        const [, bookName, chapter, verse] = match;
        const bookCode = BIBLE_BOOKS[bookName];
        if (!bookCode) return null;

        const response = await axios.get('https://bible.fhl.net/json/qb.php', {
            params: {
                chineses: bookCode,
                chap: parseInt(chapter),
                sec: parseInt(verse),
                version: 'unv',
                gb: 0
            }
        });

        if (response.data && response.data.record && response.data.record.length > 0) {
            const verse = response.data.record[0];
            return {
                reference: `${verse.chineses} ${verse.chap}:${verse.sec}`,
                text: verse.bible_text
            };
        }
        
        return null;
    } catch (error) {
        console.error('獲取聖經經文失敗:', error.message);
        return null;
    }
}
// 發送安慰訊息
async function sendComfortMessage(message, emotionAnalysis) {
    try {
        console.log(`檢測到負面情緒: ${emotionAnalysis.emotionType} (強度: ${emotionAnalysis.intensity})`);
        
        // 選擇合適的經文
        const verseSelection = await selectAppropriateVerse(emotionAnalysis);
        
        // 嘗試從聖經API獲取經文
        let verseData = await getBibleVerse(verseSelection.selectedVerse);
        
        // 如果API失敗，使用預設經文
        if (!verseData) {
            const fallbackVerse = COMFORT_VERSES.find(v => v.ref === verseSelection.selectedVerse);
            if (fallbackVerse) {
                verseData = {
                    reference: fallbackVerse.ref,
                    text: fallbackVerse.text
                };
            }
        }

        if (!verseData) {
            console.log('無法獲取經文，跳過回應');
            return;
        }

        // 創建安慰訊息
        const embed = new EmbedBuilder()
            .setTitle('🕊️ 神的話語')
            .setDescription(`**${verseData.reference}**\n"${verseData.text}"`)
            .addFields(
                { name: '💝 溫暖的話', value: verseSelection.comfortMessage, inline: false }
            )
            .setColor('#87CEEB')
            .setTimestamp()
            .setFooter({ text: '神愛你 ❤️' });

        await message.reply({ embeds: [embed] });
        
        console.log(`已發送安慰訊息給 ${message.author.displayName}`);
        
    } catch (error) {
        console.error('發送安慰訊息時發生錯誤:', error);
    }
}

// Discord機器人事件
client.once('ready', () => {
    console.log(`情緒關懷機器人已登入: ${client.user.tag}`);
    console.log('正在監聽需要關懷的訊息...');
});

// 訊息監聽
client.on('messageCreate', async (message) => {
    // 忽略機器人訊息和指令
    if (message.author.bot) return;
    if (message.content.startsWith('!')) {
        // 處理指令
        const command = message.content.slice(1).toLowerCase();
        
        if (command === 'care' || command === 'help') {
            await message.reply(`🤗 **情緒關懷機器人**

我會自動監聽大家的訊息，當發現有負面情緒時，會分享適合的聖經經文來安慰你。

**功能：**
• 自動情緒分析 (由GPT-3.5協助)
• 智能經文推薦
• 溫暖的關懷訊息

**指令：**
• \`!test 我好累好想放棄\` - 測試情緒分析
• \`!care\` - 顯示此說明

願神的愛與平安與你同在 ❤️`);
        }
        
        if (command.startsWith('test ')) {
            const testMessage = command.substring(5);
            const fakeMessage = {
                ...message,
                content: testMessage,
                reply: message.reply.bind(message)
            };
            
            const analysis = await analyzeEmotion(testMessage);
            if (analysis.isNegative) {
                await sendComfortMessage(fakeMessage, analysis);
            } else {
                await message.reply('😊 這個訊息沒有檢測到負面情緒呢！');
            }
        }
        
        return;
    }
    
    // 分析訊息情緒
    if (message.content.length > 3) { // 避免分析太短的訊息
        const emotionAnalysis = await analyzeEmotion(message.content);
        
        // 如果檢測到負面情緒且強度足夠
        if (emotionAnalysis.isNegative && emotionAnalysis.intensity >= 4) {
            await sendComfortMessage(message, emotionAnalysis);
        }
    }
});

// 錯誤處理
client.on('error', (error) => {
    console.error('Discord客戶端錯誤:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('未處理的Promise拒絕:', error);
});

process.on('uncaughtException', (error) => {
    console.error('未捕獲的異常:', error);
});

// 登入Discord
client.login(DISCORD_TOKEN);
