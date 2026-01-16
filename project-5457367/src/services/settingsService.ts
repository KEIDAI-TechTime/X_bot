/**
 * 設定をNotionに同期するサービス
 */

import type {
  ContentCategory,
  ContentFormat,
  FirstLinePattern,
  ProvenPattern,
  WritingRules,
} from '../types/xStrategy';

// スケジュール設定
export interface ScheduleSettings {
  postTimes: string[];
  activeDays: string[];
  topics: string[];
  enabled: boolean;
}

// 投稿生成設定（フル）
export interface PostSettings extends ScheduleSettings {
  persona?: string;
  tone?: string;
  contentDirection?: string;
  maxLength?: number;
  useEmoji?: boolean;
  useHashtags?: boolean;
  hashtagRules?: string;
  mustInclude?: string;
  mustExclude?: string;
  structureTemplate?: string;
  referenceInfo?: string;
  examplePosts?: string;
  // X投稿戦略設定
  contentCategory?: ContentCategory;
  contentFormat?: ContentFormat;
  firstLinePattern?: FirstLinePattern;
  provenPatterns?: ProvenPattern[];
  writingRules?: WritingRules;
  // アルゴリズム対策
  avoidUrls?: boolean;
  preferImages?: boolean;
  targetDwellTime?: number;
}

/**
 * 設定をNotionに保存（フル設定対応）
 */
export async function saveSettingsToNotion(settings: PostSettings): Promise<boolean> {
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to save settings to Notion:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('Settings saved to Notion:', data);
    return data.success;
  } catch (error) {
    console.error('Error saving settings to Notion:', error);
    return false;
  }
}

/**
 * Notionから設定を取得
 */
export async function loadSettingsFromNotion(): Promise<PostSettings | null> {
  try {
    const response = await fetch('/api/settings');

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.settings;
  } catch (error) {
    console.error('Error loading settings from Notion:', error);
    return null;
  }
}
