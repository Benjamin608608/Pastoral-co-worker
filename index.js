const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// 環境變數
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 冷卻機制
const userCooldowns = new Map();
const COOLDOWN_TIME = 10000;
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
    '憤怒': ['生氣', '氣死', '火大', '靠北'],
    '絕望': ['想死', '放棄', '沒希望'],
    '疲憊': ['好累', '沒力', '撐不住'],
    '焦慮': ['擔心', '害怕', '焦慮'],
    '悲傷': ['難過', '傷心', '哭'],
    '孤獨': ['孤單', '寂寞', '沒人理'],
    '罪惡感': ['後悔', '自責', '愧疚'],
    '壓力': ['壓力', '喘不過氣', '負擔重'],
    '攻擊性': ['想打人', '想報復', '仇恨']
  };

  let detected = [];
  let maxIntensity = 0;
  let primaryEmotion = '';

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    const matched = keywords.filter(k => message.includes(k));
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

// GPT 情緒分析（已修正）
async function analyzeEmotion(message) {
  if (!OPENAI_API_KEY) {
    console.log('⚠️ 無 OpenAI API 金鑰，改用關鍵字分析');
    return analyzeEmotionKeywords(message);
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `你是情緒分析專家。請回傳以下訊息的負面情緒，**只回傳 JSON，不要有任何文字說明**。格式如下：

{
  "isNegative": true,
  "primaryEmotion": "憤怒",
  "intensity": 6,
  "keywords": ["生氣", "火大"]
}

情緒類型包括：憤怒、絕望、疲憊、焦慮、悲傷、孤獨、厭惡、罪惡感、壓力、攻擊性`
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
    const result = JSON.parse(content);
    console.log('✅ GPT 分析結果:', result);
    return result;

  } catch (error) {
    console.warn('❌ GPT 分析失敗，回退關鍵字分析');
    if (error.response?.data?.error) {
      console.error('OpenAI 錯誤詳情:', error.response.data.error);
    } else {
      console.error(error.message);
    }
    return analyzeEmotionKeywords(message);
  }
}

// 假資料：經文選擇
function selectVerse(emotion) {
  const verses = {
    '憤怒': { ref: '雅1:19', text: '你們各人要快快的聽，慢慢的說，慢慢的動怒。' },
    '絕望': { ref: '詩23:4', text: '我雖然行過死蔭的幽谷，也不怕遭害。' },
    '疲憊': { ref: '太11:28', text: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。' },
    '焦慮': { ref: '彼前5:7', text: '你們要將一切的憂慮卸給神，因為祂顧念你們。' },
    '悲傷': { ref: '太5:4', text: '哀慟的人有福了！因為他們必得安慰。' },
    '孤獨': { ref: '來13:5', text: '我總不撇下你，也不丟棄你。' },
    '罪惡感': { ref: '約一1:9', text: '我們若認自己的罪，祂必要赦免。' },
    '壓力': { ref: '詩55:22', text: '把你的重擔卸給耶和華，祂必撫養你。' },
    '攻擊性': { ref: '箴15:1', text: '回答柔和，使怒消退。' },
    '無': { ref: '詩46:1', text: '神是我們的避難所，是我們的力量。' }
  };
  return verses[emotion] || verses['無'];
}

// 發送訊息
async function sendCareMessage(message, analysis) {
  if (isOnCooldown(message.author.id)) return;

  const verse = selectVerse(analysis.primaryEmotion);

  const embed = new EmbedBuilder()
    .setTitle('🕊️ 神的話語與你同在')
    .setDescription(`**${verse.ref}**\n"${verse.text}"`)
    .addFields(
      { name: '💝 安慰的話', value: `感謝你分享心情。神了解你正在經歷的情緒。`, inline: false },
      { name: '🙏 禱告建議', value: `你可以向神傾訴，祂會垂聽。`, inline: false }
    )
    .setColor('#87CEEB')
    .setTimestamp()
    .setFooter({ text: '神愛你 ❤️' });

  try {
    await message.reply({ embeds: [embed] });
    setCooldown(message.author.id);
  } catch (error) {
    console.error('訊息回覆失敗:', error.message);
  }
}

// Bot 啟動
client.once('ready', () => {
  console.log(`🤖 已登入 ${client.user.tag}`);
});

// 處理訊息
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!test ')) {
    const text = message.content.slice(6);
    const analysis = await analyzeEmotion(text);
    if (analysis.isNegative && analysis.intensity >= 3) {
      await sendCareMessage(message, analysis);
    } else {
      await message.reply('😊 沒有偵測到明顯負面情緒。');
    }
    return;
  }

  // 自動偵測日常訊息
  if (message.content.length >= 5) {
    const analysis = await analyzeEmotion(message.content);
    if (analysis.isNegative && analysis.intensity >= 3) {
      await sendCareMessage(message, analysis);
    }
  }
});

client.login(DISCORD_TOKEN);
