import Anthropic from '@anthropic-ai/sdk';
import type { PostSettings } from './notion';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generatePost(settings: Partial<PostSettings>): Promise<string> {
  const prompt = buildPrompt(settings);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text.trim();
  }
  throw new Error('Unexpected response format from Claude');
}

function buildPrompt(settings: Partial<PostSettings>): string {
  const {
    persona = '',
    tone = '',
    topic = '',
    contentDirection = '',
    mustInclude = '',
    mustExclude = '',
    structureTemplate = '',
    maxLength = 280,
    useEmoji = true,
    useHashtags = true,
    hashtagRules = '',
    referenceInfo = '',
    examplePosts = '',
  } = settings;

  let prompt = `X(Twitter)投稿を1つ作成してください。

## ペルソナ
${persona || '一般的なユーザー'}

## トーン
${tone || 'カジュアル'}

## テーマ
${topic || '自由'}

## 内容の方向性
${contentDirection || ''}

## 含める要素
${mustInclude || '特になし'}

## 避ける要素
${mustExclude || '特になし'}

## 構成
${structureTemplate || '自由'}

## 制約
- 最大文字数: ${maxLength}文字
- 絵文字: ${useEmoji ? '使用可' : '使用不可'}
- ハッシュタグ: ${useHashtags ? '使用可' : '使用不可'}${useHashtags && hashtagRules ? `\n- ハッシュタグルール: ${hashtagRules}` : ''}

`;

  if (referenceInfo) {
    prompt += `## 参考情報\n${referenceInfo}\n\n`;
  }
  if (examplePosts) {
    prompt += `## 参考投稿例\n${examplePosts}\n\n`;
  }

  prompt += `## 注意事項
- 投稿文のみを出力してください
- 説明や補足は不要です
- 指定された文字数以内で収めてください`;

  return prompt;
}
