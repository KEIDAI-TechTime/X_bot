/**
 * 設定をNotionに同期するサービス
 */

export interface ScheduleSettings {
  postTimes: string[];
  activeDays: string[];
  topics: string[];
  enabled: boolean;
}

/**
 * 設定をNotionに保存
 */
export async function saveSettingsToNotion(settings: ScheduleSettings): Promise<boolean> {
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      console.error('Failed to save settings to Notion');
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
export async function loadSettingsFromNotion(): Promise<ScheduleSettings | null> {
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
