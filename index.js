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

// 按情緒分類的安慰經文庫
const EMOTION_VERSES = {
    '憤怒': [
        { ref: '雅1:19', text: '你們各人要快快的聽，慢慢的說，慢慢的動怒。' },
        { ref: '弗4:26', text: '生氣卻不要犯罪；不可含怒到日落。' },
        { ref: '箴16:32', text: '不輕易發怒的，勝過勇士；治服己心的，強如取城。' },
        { ref: '詩37:8', text: '當止住怒氣，離棄忿怒；不要心懷不平，以致作惡。' }
    ],
    '絕望': [
        { ref: '詩23:4', text: '我雖然行過死蔭的幽谷，也不怕遭害，因為你與我同在；你的杖，你的竿，都安慰我。' },
        { ref: '賽41:10', text: '你不要害怕，因為我與你同在；不要驚惶，因為我是你的神。我必堅固你，我必幫助你；我必用我公義的右手扶持你。' },
        { ref: '羅8:28', text: '我們曉得萬事都互相效力，叫愛神的人得益處，就是按他旨意被召的人。' },
        { ref: '耶29:11', text: '耶和華說：我知道我向你們所懷的意念是賜平安的意念，不是降災禍的意念，要叫你們末後有指望。' }
    ],
    '疲憊': [
        { ref: '太11:28', text: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。' },
        { ref: '林後4:16', text: '所以，我們不喪膽。外體雖然毀壞，內心卻一天新似一天。' },
        { ref: '賽40:31', text: '但那等候耶和華的必從新得力。他們必如鷹展翅上騰；他們奔跑卻不困倦，行走卻不疲乏。' },
        { ref: '詩55:22', text: '你要把你的重擔卸給耶和華，他必撫養你；他永不叫義人動搖。' }
    ],
    '焦慮': [
        { ref: '彼前5:7', text: '你們要將一切的憂慮卸給神，因為他顧念你們。' },
        { ref: '腓4:6', text: '應當一無掛慮，只要凡事藉著禱告、祈求，和感謝，將你們所要的告訴神。' },
        { ref: '詩56:3', text: '我懼怕的時候要倚靠你。' },
        { ref: '約14:27', text: '我留下平安給你們；我將我的平安賜給你們。我所賜的，不像世人所賜的。你們心裡不要憂愁，也不要膽怯。' }
    ],
    '悲傷': [
        { ref: '詩34:18', text: '耶和華靠近傷心的人，拯救靈性痛悔的人。' },
        { ref: '太5:4', text: '哀慟的人有福了！因為他們必得安慰。' },
        { ref: '啟21:4', text: '神要擦去他們一切的眼淚；不再有死亡，也不再有悲哀、哭號、疼痛，因為以前的事都過去了。' }
    ],
    '孤獨': [
        { ref: '來13:5', text: '因為主曾說：我總不撇下你，也不丟棄你。' },
        { ref: '詩27:10', text: '我父母離棄我，耶和華必收留我。' },
        { ref: '約14:18', text: '我不撇下你們為孤兒，我必到你們這裡來。' },
        { ref: '詩68:6', text: '神叫孤獨的有家，使被囚的出來享福；惟有悖逆的住在乾燥之地。' }
    ],
    '罪惡感': [
        { ref: '約一1:9', text: '我們若認自己的罪，神是信實的，是公義的，必要赦免我們的罪，洗淨我們一切的不義。' },
        { ref: '羅8:1', text: '如今，那些在基督耶穌裡的就不定罪了。' },
        { ref: '賽1:18', text: '你們的罪雖像硃紅，必變成雪白；雖紅如丹顏，必白如羊毛。' }
    ],
    '通用': [
        { ref: '腓4:13', text: '我靠著那加給我力量的，凡事都能做。' },
        { ref: '詩46:1', text: '神是我們的避難所，是我們的力量，是我們在患難中隨時的幫助。' },
        { ref: '林後12:9', text: '他對我說：我的恩典夠你用的，因為我的能力是在人的軟弱上顯得完全。所以，我更喜歡誇自己的軟弱，好叫基督的能力覆庇我。' }
    ]
};

// 冷卻機制
const userCooldowns = new Map();
const COOLDOWN_TIME = 10 * 1000; // 10秒

function isOnCooldown(userId) {
    const lastResponse = userCooldowns.get(userId);
    if (!lastResponse) return false;
    
    const timePassed = Date.now() - lastResponse;
    return timePassed < COOLDOWN_TIME;
}

function setCooldown(userId) {
    userCooldowns.set(userId, Date.now());
}

// 關鍵字情緒分析系統
function analyzeEmotionKeywords(message) {
    console.log('使用關鍵字情緒分析系統...');
    
    const emotionKeywords = {
        '憤怒': ['生氣', '憤怒', '氣死', '火大', '不爽', '靠北', '幹', '操', '媽的', '他媽的', '靠', '氣瘋', '抓狂'],
        '絕望': ['想死', '不想活', '想放棄', '絕望', '沒意義', '活不下去', '自殺', '了結', '沒希望', '完蛋'],
        '疲憊': ['累', '疲憊', '撐不住', '精疲力盡', '沒力氣', '好累', '累死', '累爆', '疲倦', '沒精神'],
        '焦慮': ['擔心', '害怕', '緊張', '恐懼', '不安', '煩躁', '焦慮', '恐慌', '忐忑', '惶恐'],
        '悲傷': ['難過', '傷心', '哭', '痛苦', '憂鬱', '沮喪', '心痛', '心碎', '悲傷', '痛哭'],
        '孤獨': ['孤單', '寂寞', '沒人理', '被忽略', '邊緣人', '孤獨', '無助', '落寞', '孤立'],
        '厭惡': ['討厭', '噁心', '厭惡', '反感', '看不順眼', '嫌棄', '噁爛', '厭煩'],
        '罪惡感': ['內疚', '羞恥', '後悔', '自責', '愧疚', '對不起', '罪惡', '慚愧'],
        '壓力': ['壓力大', '喘不過氣', '負擔重', '承受不住', '壓力', '壓迫', '負荷'],
        '攻擊性': ['想打人', '想報復', '恨', '仇恨', '殺', '復仇', '報復', '恨死']
    };
    
    let detectedEmotions = [];
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
    
    const result = {
        isNegative: detectedEmotions.length > 0,
        primaryEmotion: primaryEmotion || '無',
        intensity: maxIntensity,
        keywords: detectedEmotions.length > 0 ? detectedEmotions[0].keywords : []
    };
    
    console.log('關鍵字分析結果:', result);
    return result;
}

// GPT情緒分析（帶備用系統）
async function analyzeEmotion(message) {
    // 如果沒有API金鑰，直接使用關鍵字分析
    if (!OPENAI_API_KEY) {
        console.log('沒有OpenAI API金鑰，使用關鍵字分析');
        return analyzeEmotionKeywords(message);
    }
    
    try {
        console.log('嘗試使用GPT情緒分析...');
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini', // 使用更便宜且可靠的模型
            messages: [
                {
                    role: 'system',
                    content: `你是情緒分析專家。分析訊息中的負面情緒，必須回應JSON格式：

{
  "isNegative": true,
  "primaryEmotion": "憤怒",
  "intensity": 5,
  "keywords": ["生氣", "火大"]
}

情緒類型：憤怒、絕望、疲憊、焦慮、悲傷、孤獨、厭惡、罪惡感、壓力、攻擊性`
                },
                {
                    role: 'user',
                    content: `分析這段話：${message}`
                }
            ],
            temperature: 0.2,
            max_tokens: 150,
            response_format: { type: "json_object" }
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const result = JSON.parse(response.data.choices[0].message.content);
        console.log('GPT分析成功:', result);
        return result;

    } catch (error) {
        console.log('GPT分析失敗，切換到關鍵字分析');
        if (error.response?.data?.error) {
            console.log('API錯誤詳情:', error.response.data.error);
        }
        return analyzeEmotionKeywords(message);
    }
}

// 選擇經文
function selectVerse(emotion, keywords = []) {
    console.log(`為情緒 "${emotion}" 選擇經文...`);
    
    // 首先嘗試匹配主要情緒
    let verses = EMOTION_VERSES[emotion];
    
    // 如果沒有找到對應情緒，使用通用經文
    if (!verses || verses.length === 0) {
        verses = EMOTION_VERSES['通用'];
    }
    
    // 隨機選擇一節經文
    const selectedVerse = verses[Math.floor(Math.random() * verses.length)];
    console.log(`選擇了經文: ${selectedVerse.ref}`);
    
    return selectedVerse;
}

// 生成個人化安慰話語
function generateComfortMessage(emotion, keywords, originalMessage) {
    const comfortTemplates = {
        '憤怒': [
            '我理解你現在的憤怒，這些感受是真實的。神知道你的心情，祂的愛能夠平息內心的風暴。',
            '憤怒是人之常情，但神可以幫助你將這股情緒轉化為正面的力量。',
            '當我們感到憤怒時，神邀請我們將這些感受交託給祂，尋求祂的平安。'
        ],
        '絕望': [
            '即使在最黑暗的時刻，你也不是孤單的。神愛你，祂有美好的計劃要給你盼望和未來。',
            '絕望的感覺很沉重，但請記住，神的愛比任何困難都要大。',
            '在你感到絕望時，神的光會照亮你前行的道路，帶給你新的希望。'
        ],
        '疲憊': [
            '你辛苦了，神看見你的努力。來到祂面前歇息，讓祂成為你的力量。',
            '疲憊時，神邀請我們來到祂面前得安息，祂會重新恢復我們的力量。',
            '你不需要獨自承擔一切，神願意成為你的幫助和依靠。'
        ],
        '焦慮': [
            '不要害怕，神掌管一切。你可以將憂慮交託給祂，因為祂顧念你。',
            '焦慮讓人不安，但神的平安可以超越一切理解，守護你的心。',
            '當憂慮湧上心頭時，記住神比我們的問題更大，祂必看顧你。'
        ],
        '悲傷': [
            '哭泣可能一宿存留，但歡呼必來到早晨。神必擦去你的眼淚，賜給你安慰。',
            '悲傷是治癒過程的一部分，神會在你的眼淚中與你同在。',
            '神收集你每一滴眼淚，祂的愛會在傷痛中成為你的安慰。'
        ],
        '孤獨': [
            '你並不孤單，神時刻與你同在。祂愛你，永遠不會離棄你。',
            '在孤獨的時刻，神的同在比任何人的陪伴都要真實和溫暖。',
            '雖然感到孤獨，但神承諾永遠與你同行，你在祂心中是寶貴的。'
        ],
        '厭惡': [
            '這些負面感受很真實，但不要讓它們佔據你的心。神的愛能夠帶來內心的平靜。',
            '當我們被負面情緒包圍時，神的愛可以成為清潔的泉源。'
        ],
        '罪惡感': [
            '神的恩典比你的過錯更大。祂已經赦免了你，你可以重新開始。',
            '罪惡感不是你的身份，神看你為祂寶貴的兒女，已被洗淨。',
            '神的赦免是完全的，你不需要被過去的錯誤綑綁。'
        ],
        '壓力': [
            '你承受的重擔，神都知道。來到祂面前，讓祂成為你的避難所。',
            '壓力讓人喘不過氣，但神邀請你將重擔卸給祂，祂必撫養你。'
        ],
        '攻擊性': [
            '憤怒是人之常情，但讓神的愛來軟化你的心，帶來真正的平安。',
            '當攻擊性的想法湧現時，神的愛可以轉化我們的心，帶來和平。'
        ]
    };
    
    const templates = comfortTemplates[emotion] || [
        '神愛你，祂必不撇下你，也不丟棄你。',
        '無論你現在感受如何，神的愛都與你同在。'
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
}

// 從聖經API獲取經文
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
            },
            timeout: 5000
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
        
        console.log(`檢測到負面情緒: ${analysis.primaryEmotion} (強度: ${analysis.intensity})`);
        
        // 選擇經文
        const selectedVerse = selectVerse(analysis.primaryEmotion, analysis.keywords);
        
        // 嘗試從API獲取完整經文
        let verseData = await getBibleVerse(selectedVerse.ref);
        
        // 如果API失敗，使用預設經文
        if (!verseData) {
            verseData = {
                reference: selectedVerse.ref,
                text: selectedVerse.text
            };
        }

        // 生成個人化安慰話語
        const comfortMessage = generateComfortMessage(analysis.primaryEmotion, analysis.keywords, message.content);

        console.log(`選擇經文: ${verseData.reference}`);

        // 創建嵌入式訊息
        const embed = new EmbedBuilder()
            .setTitle('🕊️ 神的話語與你同在')
            .setDescription(`**${verseData.reference}**\n"${verseData.text}"`)
            .addFields(
                { name: '💝 溫暖的話', value: comfortMessage, inline: false },
                { name: '🙏 禱告建議', value: '你可以向神禱告，將你的感受告訴祂，祂必聽你的禱告。', inline: false }
            )
            .setColor('#87CEEB')
            .setTimestamp()
            .setFooter({ text: '神愛你，祂與你同在 ❤️' });

        // 根據情緒強度決定回應方式
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
    
    // 檢查環境變數
    if (!DISCORD_TOKEN) {
        console.error('❌ 缺少 DISCORD_TOKEN 環境變數');
    }
    if (!OPENAI_API_KEY) {
        console.log('⚠️  沒有 OPENAI_API_KEY，將使用關鍵字分析系統');
    } else {
        console.log('✅ OpenAI API 金鑰已設定，將嘗試使用GPT分析');
    }
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

**特色功能：**
• AI智能分析 + 關鍵字備用系統
• 個人化安慰話語
• 針對性聖經經文
• 10秒冷卻防騷擾

**測試：** \`!test 我好累想放棄\`

願神的愛與你同在 ❤️`);
        }
        
        if (command.startsWith('test ')) {
            const testMsg = command.substring(5);
            const analysis = await analyzeEmotion(testMsg);
            
            if (analysis.isNegative && analysis.intensity >= 3) {
                const fakeMessage = { 
                    ...message, 
                    content: testMsg, 
                    author: message.author, 
                    reply: message.reply.bind(message) 
                };
                await sendCareMessage(fakeMessage, analysis);
            } else {
                await message.reply('😊 沒有檢測到明顯負面情緒。\n試試：`!test 我好生氣`');
            }
        }
        
        return;
    }
    
    // 自動監測所有訊息
    if (message.content.length > 2) {
        try {
            const analysis = await analyzeEmotion(message.content);
            
            if (analysis.isNegative && analysis.intensity >= 3) {
                await sendCareMessage(message, analysis);
            }
        } catch (error) {
            console.error('分析訊息時發生錯誤:', error);
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
