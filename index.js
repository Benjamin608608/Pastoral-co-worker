const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// 環境變數
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 檢查必要環境變數
if (!DISCORD_TOKEN) {
  console.error('❌ 缺少 DISCORD_TOKEN 環境變數');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 冷卻機制 - 延長冷卻時間避免過度回應
const userCooldowns = new Map();
const COOLDOWN_TIME = 5000; // 5秒冷卻時間

function isOnCooldown(userId) {
  const last = userCooldowns.get(userId);
  return last && (Date.now() - last < COOLDOWN_TIME);
}

function setCooldown(userId) {
  userCooldowns.set(userId, Date.now());
}

// 關鍵字情緒分析
function analyzeEmotionKeywords(message) {
  const emotionKeywords = {
    '憤怒': ['生氣', '氣死', '火大', '靠北', '幹', '媽的', '氣炸', '超火', '怒', '暴怒'],
    '絕望': ['想死', '放棄', '沒希望', '絕望', '完蛋', '沒救', '末路', '死心', '崩潰'],
    '疲憊': ['好累', '沒力', '撐不住', '疲憊', '累死', '精疲力盡', '無力', '力不從心'],
    '焦慮': ['擔心', '害怕', '焦慮', '不安', '恐慌', '緊張', '憂心', '惶恐', '驚慌'],
    '悲傷': ['難過', '傷心', '哭', '痛苦', '心痛', '憂鬱', '沮喪', '哀傷', '心碎'],
    '孤獨': ['孤單', '寂寞', '沒人理', '獨自', '無助', '孤獨', '被遺棄', '沒朋友'],
    '罪惡感': ['後悔', '自責', '愧疚', '內疚', '對不起', '錯了', '罪惡感', '懺悔'],
    '壓力': ['壓力', '喘不過氣', '負擔重', '壓力山大', '重擔', '負荷', '承受不了'],
    '攻擊性': ['想打人', '想報復', '仇恨', '討厭', '恨死', '復仇', '殺', '打死']
  };

  let detected = [];
  let maxIntensity = 0;
  let primaryEmotion = '';

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    const matched = keywords.filter(k => message.toLowerCase().includes(k));
    if (matched.length > 0) {
      const intensity = Math.min(matched.length * 3, 10);
      detected.push({ type: emotion, intensity, keywords: matched });
      if (intensity > maxIntensity) {
        maxIntensity = intensity;
        primaryEmotion = emotion;
      }
    }
  }

  return {
    isNegative: detected.length > 0,
    primaryEmotion: primaryEmotion || '無',
    intensity: maxIntensity,
    keywords: detected[0]?.keywords || []
  };
}

// GPT 情緒分析
async function analyzeEmotion(message) {
  if (!OPENAI_API_KEY) {
    console.log('⚠️ 無 OpenAI API 金鑰，使用關鍵字分析');
    return analyzeEmotionKeywords(message);
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', // 使用更便宜的模型
        messages: [
          {
            role: 'system',
            content: `你是情緒分析專家。請分析訊息中的負面情緒，**只回傳 JSON，不要有任何文字說明**。格式如下：

{
  "isNegative": true,
  "primaryEmotion": "憤怒",
  "intensity": 6,
  "keywords": ["生氣", "火大"]
}

情緒類型包括：憤怒、絕望、疲憊、焦慮、悲傷、孤獨、厭惡、罪惡感、壓力、攻擊性
強度範圍：1-10（3以上才需要關懷回應）`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.2,
        max_tokens: 150
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const content = response.data.choices[0].message.content.trim();
    // 移除可能的Markdown格式
    const cleanContent = content.replace(/```json\n?|```/g, '');
    const result = JSON.parse(cleanContent);
    
    console.log('✅ GPT 分析結果:', result);
    return result;

  } catch (error) {
    console.warn('❌ GPT 分析失敗，回退關鍵字分析');
    if (error.response?.data?.error) {
      console.error('OpenAI 錯誤詳情:', error.response.data.error);
    }
    return analyzeEmotionKeywords(message);
  }
}

// 經文選擇
function selectVerse(emotion) {
  const verses = {
    '憤怒': { 
      ref: '雅各書 1:19', 
      text: '你們各人要快快的聽，慢慢的說，慢慢的動怒。',
      comfort: '憤怒是人之常情，但讓我們學習以溫和的心來回應。'
    },
    '絕望': { 
      ref: '詩篇 23:4', 
      text: '我雖然行過死蔭的幽谷，也不怕遭害，因為你與我同在。',
      comfort: '即使在最黑暗的時刻，你並不孤單。神與你同在。'
    },
    '疲憊': { 
      ref: '馬太福音 11:28', 
      text: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。',
      comfort: '當你感到疲憊時，記得休息也是一種智慧。'
    },
    '焦慮': { 
      ref: '彼得前書 5:7', 
      text: '你們要將一切的憂慮卸給神，因為祂顧念你們。',
      comfort: '焦慮讓人痛苦，但你可以將這些重擔交託給神。'
    },
    '悲傷': { 
      ref: '馬太福音 5:4', 
      text: '哀慟的人有福了！因為他們必得安慰。',
      comfort: '悲傷是療癒的開始，讓眼淚洗滌心靈。'
    },
    '孤獨': { 
      ref: '希伯來書 13:5', 
      text: '我總不撇下你，也不丟棄你。',
      comfort: '即使感到孤單，神永遠與你同在。你是被愛的。'
    },
    '罪惡感': { 
      ref: '約翰一書 1:9', 
      text: '我們若認自己的罪，神是信實的，是公義的，必要赦免我們的罪。',
      comfort: '每個人都會犯錯，重要的是學習寬恕自己。'
    },
    '壓力': { 
      ref: '詩篇 55:22', 
      text: '你要把你的重擔卸給耶和華，祂必撫養你，祂永不叫義人動搖。',
      comfort: '壓力很重，但你不必獨自承擔。尋求幫助是勇敢的表現。'
    },
    '攻擊性': { 
      ref: '箴言 15:1', 
      text: '回答柔和，使怒消退；言語暴戾，觸動怒氣。',
      comfort: '憤怒的情緒需要時間平息，深呼吸，給自己一些空間。'
    },
    '無': { 
      ref: '詩篇 46:1', 
      text: '神是我們的避難所，是我們的力量，是我們在患難中隨時的幫助。',
      comfort: '無論何時，神都是我們的避難所和力量。'
    }
  };
  return verses[emotion] || verses['無'];
}

// 發送關懷訊息
async function sendCareMessage(message, analysis) {
  if (isOnCooldown(message.author.id)) {
    console.log(`⏰ 用戶 ${message.author.username} 仍在冷卻期內`);
    return;
  }

  const verse = selectVerse(analysis.primaryEmotion);

  const embed = new EmbedBuilder()
    .setTitle('🕊️ 神的話語與你同在')
    .setDescription(`**${verse.ref}**\n\n*"${verse.text}"*`)
    .addFields(
      { 
        name: '💝 溫柔的話語', 
        value: verse.comfort, 
        inline: false 
      },
      { 
        name: '🙏 禱告的邀請', 
        value: `親愛的朋友，如果你願意，可以向神傾訴你的心情，祂會垂聽。`, 
        inline: false 
      }
    )
    .setColor('#87CEEB')
    .setTimestamp()
    .setFooter({ text: '願神的平安與你同在 ❤️' });

  try {
    await message.reply({ embeds: [embed] });
    setCooldown(message.author.id);
    console.log(`✅ 已回應用戶 ${message.author.username} 的${analysis.primaryEmotion}情緒 (強度: ${analysis.intensity})`);
  } catch (error) {
    console.error('❌ 訊息回覆失敗:', error.message);
  }
}

// 錯誤處理
client.on('error', (error) => {
  console.error('Discord 客戶端錯誤:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的Promise拒絕:', reason);
});

// Bot 啟動
client.once('ready', () => {
  console.log(`🤖 ${client.user.tag} 已上線！正在監看訊息中...`);
  console.log(`📊 目前在 ${client.guilds.cache.size} 個伺服器中服務`);
});

// 處理所有訊息
client.on('messageCreate', async (message) => {
  // 忽略機器人訊息
  if (message.author.bot) return;
  
  // 忽略太短的訊息（避免誤判）
  if (message.content.length < 3) return;
  
  // 忽略指令訊息（以 ! 或 / 開頭）
  if (message.content.startsWith('!') || message.content.startsWith('/')) return;
  
  try {
    console.log(`📝 分析訊息: "${message.content}" (來自: ${message.author.username})`);
    
    // 分析情緒
    const analysis = await analyzeEmotion(message.content);
    
    // 如果偵測到負面情緒且強度足夠，則回應
    if (analysis.isNegative && analysis.intensity >= 3) {
      console.log(`🚨 偵測到負面情緒: ${analysis.primaryEmotion} (強度: ${analysis.intensity})`);
      await sendCareMessage(message, analysis);
    } else {
      console.log(`😊 情緒正常或強度不足 (${analysis.primaryEmotion}, 強度: ${analysis.intensity})`);
    }
    
  } catch (error) {
    console.error('❌ 處理訊息時發生錯誤:', error);
  }
});

// 登入
client.login(DISCORD_TOKEN).catch(error => {
  console.error('❌ 登入失敗:', error);
  process.exit(1);
});
