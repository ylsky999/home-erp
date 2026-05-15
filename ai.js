const API_KEY = 'sk-976400f732fd4ac2b31dccdc6d56c0da';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { mode, imageBase64, text } = body;

    let requestBody;

    if (mode === 'image') {
      requestBody = {
        model: 'qwen-vl-max',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
              {
                type: 'text',
                text: buildImagePrompt(),
              },
            ],
          },
        ],
        max_tokens: 1200,
      };
    } else {
      requestBody = {
        model: 'qwen-max',
        messages: [{ role: 'user', content: buildTextPrompt(text) }],
        max_tokens: 800,
      };
    }

    const response = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};

function buildImagePrompt() {
  return `你是家庭物品管理助手。请仔细分析这张图片，提取所有能看到的商品信息。

请以 JSON 格式返回以下字段（只返回JSON，不要有其他文字和markdown标记）：
{
  "name": "商品名称（必填，尽量完整）",
  "brand": "品牌名称或null",
  "category": "分类（从以下选择：食品饮料/生鲜蔬果/日用耗材/清洁用品/药品保健/电子产品/衣物纺织/文具办公/厨具餐具/其他）",
  "price": 价格数字或null,
  "quantity": "数量描述如2瓶、1kg，或null",
  "storage_location": "建议存储位置（冰箱冷藏/冰箱冷冻/厨房橱柜/阳台储物/卧室衣柜/卫生间/其他）",
  "storage_method": "保存方式描述",
  "has_expiry": true或false（食品/药品/生鲜为true，电子产品/衣物等为false）,
  "expiry_date": "YYYY-MM-DD格式的保质期，如果能看到或推算出，否则null",
  "suggested_expiry_days": 建议食用天数数字（开封后建议在X天内食用，仅针对食品，否则null）,
  "expiry_note": "保质期说明，如：包装标注2025年12月、开封后建议7天内食用等",
  "notes": "其他备注"
}

注意：
- 生鲜蔬果没有明确保质期的，has_expiry=true，给建议保存天数（如苹果建议14天，菠菜建议3天）
- 电子产品不需要保质期，has_expiry=false
- 尽量从图片中读取真实信息`;
}

function buildTextPrompt(text) {
  return `你是家庭物品管理助手。根据用户的文字描述，提取商品信息。

用户描述：${text}

请以 JSON 格式返回以下字段（只返回JSON，不要有任何其他文字和markdown标记）：
{
  "name": "商品名称",
  "brand": "品牌或null",
  "category": "分类（食品饮料/生鲜蔬果/日用耗材/清洁用品/药品保健/电子产品/衣物纺织/文具办公/厨具餐具/其他）",
  "price": 价格数字或null,
  "quantity": "数量描述",
  "storage_location": "存储位置建议",
  "storage_method": "保存方式",
  "has_expiry": true或false,
  "expiry_date": "YYYY-MM-DD或null",
  "suggested_expiry_days": 建议天数或null,
  "expiry_note": "说明",
  "notes": "其他"
}`;
}
