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
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;
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