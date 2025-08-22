// ClipFilter.jsx (최종 작동 버전)
import React from 'react';
import './ClipFilter.css';
import { IoMdClose, IoMdCheckmark } from 'react-icons/io';
import { FaChevronDown } from 'react-icons/fa';

export const PLAY_TYPES = { RUN: '런', PASS: '패스' };
export const SIGNIFICANT_PLAYS = {
  TOUCHDOWN: '터치다운',
  TWOPTCONVGOOD: '2PT 성공',
  TWOPTCONVNOGOOD: '2PT 실패',
  PATSUCCESS: 'PAT 성공',
  PATFAIL: 'PAT 실패',
  FIELDGOALGOOD: 'FG 성공',
  FIELDGOALNOGOOD: 'FG 실패',
  PENALTY: '페널티',
  SACK: '색',
  TFL: 'TFL',
  FUMBLE: '펌블',
  INTERCEPTION: '인터셉트',
  TURNOVER: '턴오버',
  SAFETY: '세이프티',
};

function Dropdown({ label, summary, isOpen, onToggle, onClose, children, width = 220 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="ff-dropdown" ref={ref}>
      <button
        type="button"
        className={`ff-dd-btn ${isOpen ? 'open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="ff-dd-label">{summary || label}</span>
        <FaChevronDown className="ff-dd-icon" />
      </button>
      {isOpen && (
        <div className="ff-dd-menu" role="menu" style={{ width, position: 'relative', zIndex: 9999 }}>
          {children}
        </div>
      )}
    </div>
  );
}

const ClipFilter = ({ 
  filters, 
  handleFilterChange, 
  removeFilter, 
  activeFilters, 
  onReset,
  teamOptions = []
}) => {
  const [openMenu, setOpenMenu] = React.useState(null);
  const closeAll = () => setOpenMenu(null);

  const quarterSummary = filters.quarter ? `Q${filters.quarter}` : '쿼터';
  const playTypeSummary = filters.playType || '유형';
  const teamSummary = filters.team || '팀';
  const significantSummary = (() => {
    const arr = Array.isArray(filters.significantPlay) ? filters.significantPlay : [];
    if (arr.length === 0) return '중요플레이';
    if (arr.length === 1) return arr[0];
    return `${arr[0]} 외 ${arr.length - 1}`;
  })();

  const clearSignificant = () => {
    (filters.significantPlay || []).forEach((v) => removeFilter?.('significantPlay', v));
  };

  return (
    <div className="filterContainer">
      <div className="ff-bar">
        {/* QUARTER (라디오) */}
        <Dropdown
          label="쿼터"
          summary={quarterSummary}
          isOpen={openMenu === 'quarter'}
          onToggle={() => setOpenMenu(openMenu === 'quarter' ? null : 'quarter')}
          onClose={closeAll}
          width={200}
        >
          {[
            { key: null, text: '전체' },
            { key: 1, text: 'Q1' },
            { key: 2, text: 'Q2' },
            { key: 3, text: 'Q3' },
            { key: 4, text: 'Q4' },
          ].map(({ key, text }) => {
            const selected = key === null ? 
              (filters.quarter === null || filters.quarter === undefined) : 
              filters.quarter === key;
            
            return (
              <button
                key={String(text)}
                type="button"
                className={`ff-dd-item ${selected ? 'selected' : ''}`}
                role="menuitemradio"
                aria-checked={selected}
                style={{ position: 'relative', zIndex: 10000, pointerEvents: 'auto' }}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleFilterChange('quarter', key); 
                  closeAll(); 
                }}
              >
                <span className="ff-dd-check"><IoMdCheckmark /></span>
                <span className="ff-dd-text">{text}</span>
              </button>
            );
          })}
        </Dropdown>

        {/* PLAY TYPE (라디오) */}
        <Dropdown
          label="유형"
          summary={playTypeSummary}
          isOpen={openMenu === 'playType'}
          onToggle={() => setOpenMenu(openMenu === 'playType' ? null : 'playType')}
          onClose={closeAll}
          width={200}
        >
          {[
            { key: null, text: '전체' },
            { key: PLAY_TYPES.RUN, text: '런' },
            { key: PLAY_TYPES.PASS, text: '패스' },
          ].map(({ key, text }) => {
            const selected = key === null ? 
              (filters.playType === null || filters.playType === undefined) : 
              filters.playType === key;
            
            return (
              <button
                key={text}
                type="button"
                className={`ff-dd-item ${selected ? 'selected' : ''}`}
                role="menuitemradio"
                aria-checked={selected}
                style={{ position: 'relative', zIndex: 10000, pointerEvents: 'auto' }}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleFilterChange('playType', key);
                  closeAll(); 
                }}
              >
                <span className="ff-dd-check"><IoMdCheckmark /></span>
                <span className="ff-dd-text">{text}</span>
              </button>
            );
          })}
        </Dropdown>

        {/* TEAM (라디오) */}
        {teamOptions.length > 0 && (
          <Dropdown
            label="팀"
            summary={teamSummary}
            isOpen={openMenu === 'team'}
            onToggle={() => setOpenMenu(openMenu === 'team' ? null : 'team')}
            onClose={closeAll}
            width={240}
          >
            <button
              type="button"
              className={`ff-dd-item ${!filters.team ? 'selected' : ''}`}
              role="menuitemradio"
              aria-checked={!filters.team}
              style={{ position: 'relative', zIndex: 10000, pointerEvents: 'auto' }}
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation();
                handleFilterChange('team', null); 
                closeAll(); 
              }}
            >
              <span className="ff-dd-check"><IoMdCheckmark /></span>
              <span className="ff-dd-text">전체</span>
            </button>
            {teamOptions.map((team) => {
              const selected = filters.team === team.value;
              return (
                <button
                  key={team.value}
                  type="button"
                  className={`ff-dd-item ${selected ? 'selected' : ''}`}
                  role="menuitemradio"
                  aria-checked={selected}
                  style={{ position: 'relative', zIndex: 10000, pointerEvents: 'auto' }}
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    handleFilterChange('team', team.value); 
                    closeAll(); 
                  }}
                >
                  <span className="ff-dd-check"><IoMdCheckmark /></span>
                  <div className="ff-dd-team">
                    {team.logo && (
                      <img 
                        src={team.logo} 
                        alt={team.label}
                        className={`ff-dd-team-logo ${team.logo.endsWith('.svg') ? 'svg' : 'png'}`}
                      />
                    )}
                    <span className="ff-dd-text">{team.label}</span>
                  </div>
                </button>
              );
            })}
          </Dropdown>
        )}

        {/* SIGNIFICANT (체크박스) */}
        <Dropdown
          label="중요플레이"
          summary={significantSummary}
          isOpen={openMenu === 'significant'}
          onToggle={() => setOpenMenu(openMenu === 'significant' ? null : 'significant')}
          onClose={closeAll}
          width={260}
        >
          <div className="ff-dd-section">
            {Object.values(SIGNIFICANT_PLAYS).map((text) => {
              const selected = (filters.significantPlay || []).includes(text);
              return (
                <button
                  key={text}
                  type="button"
                  className={`ff-dd-item ${selected ? 'selected' : ''}`}
                  role="menuitemcheckbox"
                  aria-checked={selected}
                  style={{ position: 'relative', zIndex: 10000, pointerEvents: 'auto' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFilterChange('significantPlay', text);
                  }}
                >
                  <span className="ff-dd-check"><IoMdCheckmark /></span>
                  <span className="ff-dd-text">{text}</span>
                </button>
              );
            })}
          </div>
          <div className="ff-dd-actions">
            <button 
              type="button"
              className="ff-dd-clear" 
              style={{ position: 'relative', zIndex: 10000, pointerEvents: 'auto' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearSignificant();
              }}
            >
              모두 해제
            </button>
            <button 
              type="button"
              className="ff-dd-close" 
              style={{ position: 'relative', zIndex: 10000, pointerEvents: 'auto' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeAll();
              }}
            >
              닫기
            </button>
          </div>
        </Dropdown>

        <button type="button" className="ff-reset" onClick={onReset}>초기화</button>
      </div>

      {activeFilters?.length > 0 ? (
        <div className="activeFiltersSection">
          <div className="activeFiltersContainer">
            {activeFilters.map((filter, i) => (
              <div
                key={`${filter.category}-${filter.value}-${i}`}
                className="filterChip"
                onClick={() => removeFilter(filter.category, filter.value)}
              >
                <div className="filterChipText">{filter.label}</div>
                <IoMdClose className="filterChipClose" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="activeFiltersSection">
          <div className="nonActiveFiltersContainer" />
        </div>
      )}
    </div>
  );
};

export default ClipFilter;