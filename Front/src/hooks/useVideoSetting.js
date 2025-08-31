// src/hooks/useVideoSettings.js

import { useState, useEffect } from 'react';

const SETTINGS_STORAGE_KEY = 'video_player_settings';

// Default settings
const DEFAULT_SETTINGS = {
  playbackRate: 1.0,
  skipTime: 1, // Default skip duration in seconds
  language: 'ko',
  screenRatio: '1920:1080',
  teamRank: 1,
  leaguePosition: 1,
  hotkeys: {
    forward: 'D',
    backward: 'A',
    nextVideo: 'N',
    prevVideo: 'M',
  },
};

export const useVideoSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const storedSettingsJSON = localStorage.getItem(SETTINGS_STORAGE_KEY);

      // 저장된 설정이 있을 경우, 기본 설정과 병합합니다.
      if (storedSettingsJSON) {
        const storedSettings = JSON.parse(storedSettingsJSON);
        
        // **이 부분이 핵심적인 변경 사항입니다.**
        // 기본 설정을 먼저 깔아주고, 그 위에 저장된 설정을 덮어씁니다.
        // hotkeys 같은 중첩된 객체도 안전하게 병합합니다.
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...storedSettings,
          hotkeys: {
            ...DEFAULT_SETTINGS.hotkeys,
            ...(storedSettings.hotkeys || {}),
          },
        };
        return mergedSettings;
      }
      
      // 저장된 설정이 없으면 기본 설정을 그대로 반환합니다.
      return DEFAULT_SETTINGS;

    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
      return DEFAULT_SETTINGS;
    }
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value,
    }));
  };

  const updateHotkey = (action, key) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      hotkeys: {
        ...prevSettings.hotkeys,
        [action]: key.toUpperCase(),
      },
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    updateHotkey,
    resetSettings,
  };
};