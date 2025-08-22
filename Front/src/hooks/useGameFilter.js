import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';

export const useGameFilter = () => {
  const [date, setDate] = useState(null);            // dayjs | null
  const [type, setType] = useState(null);            // 'Scrimmage' | 'Friendly match' | 'Season' | null
  const [opponent, setOpponent] = useState(null);    // { name, logo } | null

  const clearAll = useCallback(() => { setDate(null); setType(null); setOpponent(null); }, []);

  const active = useMemo(() => {
    const a = [];
    if (date) a.push({ category: 'date', value: date, label: date.format('YYYY-MM-DD') });
    if (type) a.push({ category: 'type', value: type, label: type });
    if (opponent) a.push({ category: 'opponent', value: opponent.name, label: opponent.name });
    return a;
  }, [date, type, opponent]);

  const remove = useCallback((category) => {
    if (category === 'date') setDate(null);
    else if (category === 'type') setType(null);
    else if (category === 'opponent') setOpponent(null);
  }, []);

  // games: [{date:'YYYY-MM-DD' or 'YYYY-MM-DD(...)', type?, homeTeam, awayTeam, ...}]
  const filterData = useCallback((games) => {
    return games.filter((g) => {
      if (date) {
        const gDate = (g.date || '').slice(0, 10);
        if (gDate !== date.format('YYYY-MM-DD')) return false;
      }
      if (type && g.type && g.type !== type) return false; // type이 없으면 패스
      if (opponent && !(g.homeTeam === opponent.name || g.awayTeam === opponent.name)) return false;
      return true;
    });
  }, [date, type, opponent]);

  return {
    // state
    date, type, opponent,
    // setters
    setDate, setType, setOpponent,
    // utils
    activeFilters: active, removeFilter: remove, clearAllFilters: clearAll, filterData,
  };
};
