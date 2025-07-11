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

// 安慰經文庫
const COMFORT_VERSES = [
    { ref: '太11:28', text: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。', category: '疲憊' },
    { ref: '腓4:19', text: '我的神必照他榮耀的豐富，在基督耶穌裡，使你們一切所需用的都充足。', category: '壓力' },
    { ref: '林後4:16', text: '所以，我們不喪膽。外體雖然毀壞，內心卻一天新似一天。', category: '疲憊' },
    { ref: '雅1:19', text: '你們各人要快快的聽，慢慢的說，慢慢的動怒。', category: '憤怒' },
    { ref: '弗4:26', text: '生氣卻不要犯罪；不可含怒到日落。', category: '憤怒' },
    { ref: '箴16:32', text: '不輕易發怒的，勝過勇士；治服己心的，強如取城。', category: '憤怒' },
    { ref: '詩23:4', text: '我雖然行過死蔭的幽谷，也不怕遭害，因為你與我同在；你的杖，你的竿，都安慰我。', category: '絕望' },
    { ref: '賽41:10', text: '你不要害怕，因為我與你同在；不要驚惶，因為我是你的神。我必堅固你，我必幫助你；我必用我公義的右手扶持你。', category: '絕望' },
    { ref: '羅8:28', text: '我們曉得萬事都互相效力，叫愛神的人得益處，就是按他旨意被召的人。', category: '絕望' },
    { ref: '彼前5:7', text: '你們要將一切的憂慮卸給神，因為他顧念你們。', category: '焦慮' },
    { ref: '腓4:6', text: '應當一無掛慮，只要凡事藉著禱告、祈求，和感謝，將你們所要的告訴神。', category: '焦慮' },
    { ref: '詩56:3', text: '我懼怕的時候要倚靠你。', category: '恐懼' },
    { ref: '來13:5', text: '因為主曾說：我總不撇下你，也不丟棄你。', category: '孤獨' },
    { ref: '詩27:10', text: '我父母離棄我，耶和華必收留我。', category: '孤獨' },
    { ref: '約14:18', text: '我不撇下你們為孤兒，我必到你們這裡來。', category: '孤獨' },
    { ref: '約一1:9', text: '我們若認自己的罪，神是信實的，是公義的，必要赦免我們的罪，洗淨我們一切的不義。', category: '罪惡感' },
    { ref: '羅8:1', text: '如今，那些在基督耶穌裡的就不定罪了。', category: '罪惡感' },
    { ref: '腓4:13', text: '我靠著那加給我力量的，凡事都能做。', category: '通用' },
    { ref: '詩46:1', text: '神是我們的避難所，是我們的力量，是我們在患難中隨時的幫助。', category: '通用' }
];

// 冷卻機制
const userCooldowns = new Map();
const COOLDOWN_TIME = 30 * 60 * 1000; // 30分鐘

function isOnCooldown(userId) {
    const lastResponse = userCooldowns.get(userId);
    if (!lastResponse) return false;
    
    const timePassed = Date.now() - lastResponse;
    return timePassed < COOLDOWN_TIME;
}

function setCooldown(userId) {
    userCooldowns.set(userId, Date.now());
}

// 情緒分析
async function analyzeEmotion(message) {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `你是情緒分析專家。分析訊息中的負面情緒。回應JSON格式：
{
  "isNegative": true/false,
  "primaryEmotion": "憤怒/絕望/疲憊/焦慮/悲傷/孤獨/厭惡/罪惡感/壓力/攻擊性",
  "intensity": 1-10,
  "keywords": ["關鍵字"]
}

檢測負面情緒：憤怒、生氣、絕望、想死、疲憊、累、焦慮、擔心、悲傷、難過、孤獨、寂寞、厭惡、討厭、罪惡感、後悔、壓力、攻擊性、仇恨等。`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            temperature: 0.3,
            max_tokens: 200
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return JSON.parse(response.data.choices[0].message.content);

    } catch (error) {
        console.error('GPT分析失敗:', error.message);
        
        // 備用關鍵字分析
        const keywords = {
            '憤怒': ['生氣', '憤怒', '氣死', '火大', '不爽', '靠北', '幹', '操'],
            '絕望': ['想死', '不想活', '想放棄', '絕望', '沒意義'],
            '疲憊': ['累', '疲憊', '撐不住', '精疲力盡', '沒力氣'],
            '焦慮': ['擔心', '害怕', '緊張', '恐懼', '不安'],
            '悲傷': ['難過', '傷心', '哭', '痛苦', '憂鬱'],
            '孤獨': ['孤單', '寂寞', '沒人理', '被忽略'],
            '厭惡': ['討厭', '噁心', '厭惡', '反感'],
            '壓力': ['壓力大', '喘不過氣', '負擔重']
        };
        
        for (const [emotion, words] of Object.entries(keywords)) {
            const matches = words.filter(word => message.includes(word));
            if (matches.length > 0) {
                return {
                    isNegative: true,
                    primaryEmotion: emotion,
                    intensity: Math.min(matches.length * 3, 10),
                    keywords: matches
                };
            }
        }
        
        return { isNegative: false, intensity: 0 };
    }
}

// 選擇經文
function selectVerse(emotion) {
    const mapping = {
        '憤怒': ['憤怒', '通用'],
        '絕望': ['絕望', '通用'],
        '疲憊': ['疲憊', '通用'],
        '焦慮': ['焦慮', '恐懼', '通用'],
        '悲傷': ['絕望', '通用'],
        '孤獨': ['孤獨', '通用'],
        '厭惡': ['憤怒', '通用'],
        '罪惡感': ['罪惡感', '通用'],
        '壓力': ['壓力', '疲憊', '通用'],
        '攻擊性': ['憤怒', '通用']
    };
    
    const categories = mapping[emotion] || ['通用'];
    const verses = COMFORT_VERSES.filter(v => categories.includes(v.category));
    return verses[Math.floor(Math.random() * verses.length)];
}

// 獲取聖經經文
async function getBibleVerse(reference) {
    try {
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
        console.error('獲取經文失敗:', error.message);
        return null;
    }
}

// 發送關懷訊息
async function sendCareMessage(message, analysis) {
    try {
        if (isOnCooldown(message.author.id)) {
            console.log(`${message.author.displayName} 在冷卻中`);
            return;
        }
        
        const selectedVerse = selectVerse(analysis.primaryEmotion);
        let verseData = await getBibleVerse(selectedVerse.ref);
        
        if (!verseData) {
            verseData = {
                reference: selectedVerse.ref,
                text: selectedVerse.text
            };
        }

        const comfortMessages = {
            '憤怒': '我理解你的憤怒，神的愛能平息內心的風暴。',
            '絕望': '即使在黑暗中，神有美好的計劃給你盼望。',
            '疲憊': '你辛苦了，來到神面前得安息。',
            '焦慮': '將憂慮交託給神，祂顧念你。',
            '悲傷': '神必擦去你的眼淚，賜給你安慰。',
            '孤獨': '你不孤單，神時刻與你同在。',
            '厭惡': '讓神的愛帶來內心的平靜。',
            '罪惡感': '神的恩典比過錯更大，祂已赦免你。',
            '壓力': '神是你的避難所和力量。',
            '攻擊性': '讓神的愛軟化你的心。'
        };

        const embed = new EmbedBuilder()
            .setTitle('🕊️ 神的話語')
            .setDescription(`**${verseData.reference}**\n"${verseData.text}"`)
            .addFields(
                { name: '💝 溫暖的話', value: comfortMessages[analysis.primaryEmotion] || '神愛你，與你同在。', inline: false }
            )
            .setColor('#87CEEB')
            .setTimestamp()
            .setFooter({ text: '神愛你 ❤️' });

        if (analysis.intensity >= 8) {
            try {
                await message.author.send({ embeds: [embed] });
                console.log(`私訊安慰給 ${message.author.displayName}`);
            } catch {
                await message.reply({ embeds: [embed] });
                console.log(`頻道回覆給 ${message.author.displayName}`);
            }
        } else {
            await message.reply({ embeds: [embed] });
            console.log(`回覆安慰給 ${message.author.displayName}`);
        }
        
        setCooldown(message.author.id);
        
    } catch (error) {
        console.error('發送關懷訊息錯誤:', error);
    }
}

// Discord事件
client.once('ready', () => {
    console.log(`情緒關懷機器人已登入: ${client.user.tag}`);
    console.log('正在監聽所有訊息，自動檢測負面情緒...');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (message.content.startsWith('!')) {
        const command = message.content.slice(1).toLowerCase();
        
        if (command === 'care' || command === 'help') {
            await message.reply(`🤗 **情緒關懷機器人**

自動監聽所有訊息，檢測負面情緒並提供聖經經文安慰。

**可檢測情緒：**
憤怒、絕望、疲憊、焦慮、悲傷、孤獨、厭惡、罪惡感、壓力、攻擊性

**測試：** \`!test 我好累想放棄\`

願神的愛與你同在 ❤️`);
        }
        
        if (command.startsWith('test ')) {
            const testMsg = command.substring(5);
            const analysis = await analyzeEmotion(testMsg);
            
            if (analysis.isNegative && analysis.intensity >= 3) {
                const fakeMessage = { ...message, content: testMsg, author: message.author, reply: message.reply.bind(message) };
                await sendCareMessage(fakeMessage, analysis);
            } else {
                await message.reply('😊 沒有檢測到明顯負面情緒。');
            }
        }
        
        return;
    }
    
    // 自動監測
    if (message.content.length > 2) {
        try {
            const analysis = await analyzeEmotion(message.content);
            
            if (analysis.isNegative && analysis.intensity >= 3) {
                await sendCareMessage(message, analysis);
            }
        } catch (error) {
            console.error('分析錯誤:', error);
        }
    }
});

client.on('error', (error) => {
    console.error('Discord錯誤:', error);
});

// 清理冷卻記錄
setInterval(() => {
    const now = Date.now();
    for (const [userId, timestamp] of userCooldowns.entries()) {
        if (now - timestamp > COOLDOWN_TIME) {
            userCooldowns.delete(userId);
        }
    }
}, 60 * 60 * 1000);

client.login(DISCORD_TOKEN);
