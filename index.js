// 預設的安慰經文庫（擴充版）
const COMFORT_VERSES = [
    // 疲憊/壓力
    { ref: '太11:28', text: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。', category: '疲憊' },
    { ref: '腓4:19', text: '我的神必照他榮耀的豐富，在基督耶穌裡，使你們一切所需用的都充足。', category: '壓力' },
    
    // 憤怒/生氣
    { ref: 'const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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

// 擴充的安慰經文庫（按情緒分類）
const COMFORT_VERSES = [
    // 疲憊/壓力
    { ref: '太11:28', text: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。', category: '疲憊' },
    { ref: '腓4:19', text: '我的神必照他榮耀的豐富，在基督耶穌裡，使你們一切所需用的都充足。', category: '壓力' },
    { ref: '林後4:16', text: '所以，我們不喪膽。外體雖然毀壞，內心卻一天新似一天。', category: '疲憊' },
    
    // 憤怒/生氣
    { ref: '雅1:19', text: '你們各人要快快的聽，慢慢的說，慢慢的動怒。', category: '憤怒' },
    { ref: '弗4:26', text: '生氣卻不要犯罪；不可含怒到日落。', category: '憤怒' },
    { ref: '箴16:32', text: '不輕易發怒的，勝過勇士；治服己心的，強如取城。', category: '憤怒' },
    
    // 絕望/沮喪
    { ref: '詩23:4', text: '我雖然行過死蔭的幽谷，也不怕遭害，因為你與我同在；你的杖，你的竿，都安慰我。', category: '絕望' },
    { ref: '賽41:10', text: '你不要害怕，因為我與你同在；不要驚惶，因為我是你的神。我必堅固你，我必幫助你；我必用我公義的右手扶持你。', category: '絕望' },
    { ref: '羅8:28', text: '我們曉得萬事都互相效力，叫愛神的人得益處，就是按他旨意被召的人。', category: '絕望' },
    
    // 焦慮/恐懼
    { ref: '彼前5:7', text: '你們要將一切的憂慮卸給神，因為他顧念你們。', category: '焦慮' },
    { ref: '腓4:6', text: '應當一無掛慮，只要凡事藉著禱告、祈求，和感謝，將你們所要的告訴神。', category: '焦慮' },
    { ref: '詩56:3', text: '我懼怕的時候要倚靠你。', category: '恐懼' },
    
    // 孤獨/被拒絕
    { ref: '來13:5', text: '因為主曾說：我總不撇下你，也不丟棄你。', category: '孤獨' },
    { ref: '詩27:10', text: '我父母離棄我，耶和華必收留我。', category: '孤獨' },
    { ref: '約14:18', text: '我不撇下你們為孤兒，我必到你們這裡來。', category: '孤獨' },
    
    // 罪惡感/羞恥
    { ref: '約一1:9', text: '我們若認自己的罪，神是信實的，是公義的，必要赦免我們的罪，洗淨我們一切的不義。', category: '罪惡感' },
    { ref: '羅8:1', text: '如今，那些在基督耶穌裡的就不定罪了。', category: '罪惡感' },
    { ref: '賽1:18', text: '你們的罪雖像硃紅，必變成雪白；雖紅如丹顏，必白如羊毛。', category: '羞恥' },
    
    // 通用安慰
    { ref: '腓4:13', text: '我靠著那加給我力量的，凡事都能做。', category: '通用' },
    { ref: '詩46:1', text: '神是我們的避難所，是我們的力量，是我們在患難中隨時的幫助。', category: '通用' }
];

// 增強的情緒分析系統
async function analyzeEmotion(message) {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `你是一個專業的情緒分析師。請仔細分析使用者的訊息，檢測各種負面情緒。

請回應JSON格式：
{
  "isNegative": true/false,
  "emotions": [
    {
      "type": "情緒類型",
      "intensity": 1-10,
      "keywords": ["關鍵字"]
    }
  ],
  "primaryEmotion": "主要情緒類型",
  "overallIntensity": 1-10,
  "suggestion": "建議的聖經主題"
}

需要檢測的負面情緒類型：
1. 憤怒：生氣、憤怒、氣死、火大、不爽、靠北、幹、操、罵髒話
2. 絕望：想死、不想活、想放棄、絕望、沒意義、活不下去
3. 疲憊：累、疲憊、撐不住、精疲力盡、沒力氣
4. 焦慮：擔心、害怕、緊張、恐懼、不安、煩躁
5. 悲傷：難過、傷心、哭、痛苦、憂鬱、沮喪
6. 孤獨：孤單、寂寞、沒人理、被忽略、邊緣人
7. 厭惡：討厭、噁心、厭惡、反感、看不順眼
8. 罪惡感：內疚、羞恥、後悔、自責、對不起
9. 壓力：壓力大、喘不過氣、負擔重、承受不住
10. 攻擊性：想打人、想報復、恨、仇恨、咒罵

也要檢測隱含的負面情緒，如諷刺、消極、抱怨等。`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            temperature: 0.2,
            max_tokens: 400
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
        
        // 更全面的關鍵字分析備用系統
        const emotionKeywords = {
            '憤怒': ['生氣', '憤怒', '氣死', '火大', '不爽', '靠北', '幹', '操', '媽的', '他媽的', '靠'],
            '絕望': ['想死', '不想活', '想放棄', '絕望', '沒意義', '活不下去', '自殺', '了結'],
            '疲憊': ['累', '疲憊', '撐不住', '精疲力盡', '沒力氣', '好累', '累死'],
            '焦慮': ['擔心', '害怕', '緊張', '恐懼', '不安', '煩躁', '焦慮'],
            '悲傷': ['難過', '傷心', '哭', '痛苦', '憂鬱', '沮喪', '心痛'],
            '孤獨': ['孤單', '寂寞', '沒人理', '被忽略', '邊緣人', '孤獨'],
            '厭惡': ['討厭', '噁心', '厭惡', '反感', '看不順眼', '嫌棄'],
            '罪惡感': ['內疚', '羞恥', '後悔', '自責', '對不起', '愧疚'],
            '壓力': ['壓力大', '喘不過氣', '負擔重', '承受不住', '壓力'],
            '攻擊性': ['想打人', '想報復', '恨', '仇恨', '咒罵', '殺']
        };
        
        const detectedEmotions = [];
        let maxIntensity = 0;
        let primaryEmotion = '';
        
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            const matchedKeywords = keywords.filter(keyword => message.includes(keyword));
            if (matchedKeywords.length > 0) {
                const intensity = Math.min(matchedKeywords.length * 3, 10);
                detectedEmotions.push({
                    type: emotion,
                    intensity: intensity,
                    keywords: matchedKeywords
                });
                
                if (intensity > maxIntensity) {
                    maxIntensity = intensity;
                    primaryEmotion = emotion;
                }
            }
        }
        
        return {
            isNegative: detectedEmotions.length > 0,
            emotions: detectedEmotions,
            primaryEmotion: primaryEmotion || '一般負面',
            overallIntensity: maxIntensity,
            suggestion: '安慰'
        };
    }
}
// 冷卻機制（避免過度回應）
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

// 發送關懷訊息
async function sendCareMessage(message, emotionAnalysis) {
    try {
        // 檢查冷卻時間
        if (isOnCooldown(message.author.id)) {
            console.log(`${message.author.displayName} 在冷卻時間內，跳過回應`);
            return;
        }
        
        console.log(`檢測到負面情緒: ${emotionAnalysis.primaryEmotion} (強度: ${emotionAnalysis.overallIntensity})`);
        
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

        // 根據情緒強度選擇顏色
        const emotionColors = {
            '憤怒': '#FF6B6B',
            '絕望': '#4ECDC4',
            '疲憊': '#45B7D1',
            '焦慮': '#96CEB4',
            '悲傷': '#FFEAA7',
            '孤獨': '#DDA0DD',
            '厭惡': '#FFB6C1',
            '罪惡感': '#98D8C8',
            '壓力': '#F7DC6F',
            '攻擊性': '#FF6B6B'
        };

        const color = emotionColors[emotionAnalysis.primaryEmotion] || '#87CEEB';

        // 創建關懷訊息
        const embed = new EmbedBuilder()
            .setTitle('🕊️ 神的話語與你同在')
            .setDescription(`**${verseData.reference}**\n"${verseData.text}"`)
            .addFields(
                { name: '💝 溫暖的話', value: verseSelection.comfortMessage, inline: false },
                { name: '🙏 禱告建議', value: verseSelection.prayerSuggestion, inline: false }
            )
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: '神愛你，祂與你同在 ❤️' });

        // 私訊或回覆（根據情緒強度決定）
        if (emotionAnalysis.overallIntensity >= 8) {
            // 高強度負面情緒，嘗試私訊
            try {
                await message.author.send({ embeds: [embed] });
                console.log(`已私訊安慰訊息給 ${message.author.displayName}`);
            } catch (error) {
                // 如果私訊失敗，回覆在頻道
                await message.reply({ embeds: [embed] });
                console.log(`已在頻道回覆安慰訊息給 ${message.author.displayName}`);
            }
        } else {
            // 中等強度，在頻道回覆
            await message.reply({ embeds: [embed] });
            console.log(`已回覆安慰訊息給 ${message.author.displayName}`);
        }
        
        // 設定冷卻時間
        setCooldown(message.author.id);
        
    } catch (error) {
        console.error('發送關懷訊息時發生錯誤:', error);
    }
}

// Discord機器人事件
client.once('ready', () => {
    console.log(`情緒關懷機器人已登入: ${client.user.tag}`);
    console.log('🤗 正在監聽所有訊息，自動檢測負面情緒...');
    console.log('💝 可檢測情緒：憤怒、絕望、疲憊、焦慮、悲傷、孤獨、厭惡、罪惡感、壓力、攻擊性');
});

// 自動監測所有訊息
client.on('messageCreate', async (message) => {
    // 忽略機器人訊息
    if (message.author.bot) return;
    
    // 處理指令
    if (message.content.startsWith('!')) {
        const command = message.content.slice(1).toLowerCase();
        
        if (command === 'care' || command === 'help') {
            await message.reply(`🤗 **全方位情緒關懷機器人**

我會自動監聽所有訊息，當檢測到負面情緒時，會分享適合的聖經經文來關懷你。

**可檢測的情緒：**
• 憤怒、生氣、不爽 😠
• 絕望、想放棄、沮喪 😞
• 疲憊、累、撐不住 😴
• 焦慮、擔心、害怕 😰
• 悲傷、難過、痛苦 😢
• 孤獨、寂寞、被忽略 😔
• 厭惡、反感、討厭 😤
• 罪惡感、羞恥、後悔 😓
• 壓力、負擔重 😵
• 攻擊性、想報復 😡

**特色功能：**
• 24/7 自動監測，無需指令
• 智能情緒分析 (GPT-3.5)
• 針對性經文推薦
• 個人化安慰話語
• 高強度情緒會私訊關懷
• 30分鐘冷卻機制

**測試指令：**
\`!test 我好累想放棄\` - 測試情緒分析

願神的愛與平安與你同在 ❤️🕊️`);
        }
        
        if (command.startsWith('test ')) {
            const testMessage = command.substring(5);
            const fakeMessage = {
                ...message,
                content: testMessage,
                author: message.author,
                reply: message.reply.bind(message)
            };
            
            const analysis = await analyzeEmotion(testMessage);
            if (analysis.isNegative && analysis.overallIntensity >= 3) {
                await sendCareMessage(fakeMessage, analysis);
            } else {
                await message.reply('😊 這個測試訊息沒有檢測到明顯的負面情緒。');
            }
        }
        
        if (command === 'status') {
            const stats = {
                cooldownUsers: userCooldowns.size,
                totalVerses: COMFORT_VERSES.length,
                emotionTypes: ['憤怒', '絕望', '疲憊', '焦慮', '悲傷', '孤獨', '厭惡', '罪惡感', '壓力', '攻擊性']
            };
            
            await message.reply(`📊 **機器人狀態**
• 冷卻中用戶：${stats.cooldownUsers} 人
• 經文庫數量：${stats.totalVerses} 節
• 可檢測情緒：${stats.emotionTypes.length} 種
• 運作狀態：✅ 正常監測中`);
        }
        
        return;
    }
    
    // 自動監測所有訊息（不需要指令觸發）
    if (message.content.length > 2) { // 避免分析太短的訊息
        try {
            const emotionAnalysis = await analyzeEmotion(message.content);
            
            // 如果檢測到負面情緒且強度足夠
            if (emotionAnalysis.isNegative && emotionAnalysis.overallIntensity >= 3) {
                await sendCareMessage(message, emotionAnalysis);
            }
        } catch (error) {
            console.error('分析訊息時發生錯誤:', error);
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

// 清理冷卻記錄（每小時執行一次）
setInterval(() => {
    const now = Date.now();
    const expiredUsers = [];
    
    for (const [userId, timestamp] of userCooldowns.entries()) {
        if (now - timestamp > COOLDOWN_TIME) {
            expiredUsers.push(userId);
        }
    }
    
    expiredUsers.forEach(userId => userCooldowns.delete(userId));
    
    if (expiredUsers.length > 0) {
        console.log(`清理了 ${expiredUsers.length} 個過期的冷卻記錄`);
    }
}, 60 * 60 * 1000); // 每小時執行一次

// 登入Discord
client.login(DISCORD_TOKEN);
