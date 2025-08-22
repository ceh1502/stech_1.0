// components/FootballFilter/FootballFilter.js
import React from 'react';
import './ClipFilter.css';
import { IoMdClose } from 'react-icons/io';
import { FaChevronDown } from 'react-icons/fa';

// --- 기존 상수 유지 ---
export const PLAY_TYPES = { RUN:'런', PASS:'패스', NOPASS:'패스 실패', KICKOFF:'킥오프', PUNT:'펀트', PAT:'PAT', TPT:'2PT', FG:'FG' };
export const SIGNIFICANT_PLAYS = {
  TOUCHDOWN:'터치다운', TWOPTCONVGOOD:'2PT 성공', TWOPTCONVNOGOOD:'2PT 실패',
  PATSUCCESS:'PAT 성공', PATFAIL:'PAT 실패', FIELDGOALGOOD:'FG 성공', FIELDGOALNOGOOD:'FG 실패',
  PENALTY:'페널티', SACK:'색', TFL:'TFL', FUMBLE:'펌블', INTERCEPTION:'인터셉트', TURNOVER:'턴오버', SAFETY:'세이프티'
};

function Dropdown({ label, summary, isOpen, onToggle, onClose, children, width = 220 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClickOutside); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="ff-dropdown" ref={ref}>
      <button type="button" className={`ff-dd-btn ${isOpen ? 'open' : ''}`} aria-haspopup="menu" aria-expanded={isOpen} onClick={onToggle}>
        <span className="ff-dd-label">{summary || label}</span>
        <FaChevronDown className="ff-dd-icon" />
      </button>
      {isOpen && <div className="ff-dd-menu" role="menu" style={{ width }}>{children}</div>}
    </div>
  );
}

const FootballFilter = ({
  filters,
  handleFilterChange,
  removeFilter,
  activeFilters,
  onReset,           // optional
  teamOptions = [],  // ← [{value: 'Hanyang Lions', label:'Hanyang Lions', logo?}, ...]
}) => {
  const [openMenu, setOpenMenu] = React.useState(null); // 'team' | 'quarter' | 'playType' | 'significant' | null
  const closeAll = () => setOpenMenu(null);

  // 버튼 요약
  const teamSummary = filters.team || '공격팀';
  const quarterSummary = filters.quarter ? `Q${filters.quarter}` : '쿼터';
  const playTypeSummary = filters.playType || '유형';
  const significantSummary = (() => {
    const arr = Array.isArray(filters.significantPlay) ? filters.significantPlay : [];
    if (arr.length === 0) return '중요플레이';
    if (arr.length === 1) return arr[0];
    return `${arr[0]} 외 ${arr.length - 1}`;
  })();

  const handleResetClick = () => {
    if (onReset) return onReset();
    if (Array.isArray(activeFilters)) activeFilters.forEach((f) => removeFilter?.(f.category, f.value));
    closeAll();
  };

  const clearSignificant = () => {
    const arr = Array.isArray(filters.significantPlay) ? filters.significantPlay : [];
    arr.forEach((v) => removeFilter?.('significantPlay', v));
  };

  return (
    <div className="filterContainer">
      <div className="ff-bar">
        {/* TEAM (공격팀) */}
        <Dropdown
          label="공격팀"
          summary={teamSummary}
          isOpen={openMenu === 'team'}
          onToggle={() => setOpenMenu(openMenu === 'team' ? null : 'team')}
          onClose={closeAll}
          width={240}
        >
          <button
            className={`ff-dd-item ${!filters.team ? 'selected' : ''}`}
            onClick={() => { handleFilterChange('team', null); closeAll(); }}
          >
            전체
          </button>
          {teamOptions.map((opt) => (
            <button
              key={opt.value}
              className={`ff-dd-item ${filters.team === opt.value ? 'selected' : ''}`}
              onClick={() => { handleFilterChange('team', opt.value); closeAll(); }}
            >
              {opt.logo && <img className="ff-dd-avatar" src={opt.logo} alt="" />}
              {opt.label || opt.value}
            </button>
          ))}
        </Dropdown>

        {/* QUARTER */}
        <Dropdown
          label="쿼터"
          summary={quarterSummary}
          isOpen={openMenu === 'quarter'}
          onToggle={() => setOpenMenu(openMenu === 'quarter' ? null : 'quarter')}
          onClose={closeAll}
          width={200}
        >
          <button className={`ff-dd-item ${!filters.quarter ? 'selected' : ''}`} onClick={() => { handleFilterChange('quarter', null); closeAll(); }}>
            전체
          </button>
          {[1, 2, 3, 4].map((q) => (
            <button key={q} className={`ff-dd-item ${filters.quarter === q ? 'selected' : ''}`} onClick={() => { handleFilterChange('quarter', q); closeAll(); }}>
              Q{q}
            </button>
          ))}
        </Dropdown>

        {/* PLAY TYPE */}
        <Dropdown
          label="유형"
          summary={playTypeSummary}
          isOpen={openMenu === 'playType'}
          onToggle={() => setOpenMenu(openMenu === 'playType' ? null : 'playType')}
          onClose={closeAll}
          width={200}
        >
          <button className={`ff-dd-item ${!filters.playType ? 'selected' : ''}`} onClick={() => { handleFilterChange('playType', null); closeAll(); }}>
            전체
          </button>
          <button className={`ff-dd-item ${filters.playType === PLAY_TYPES.RUN ? 'selected' : ''}`} onClick={() => { handleFilterChange('playType', PLAY_TYPES.RUN); closeAll(); }}>
            런
          </button>
          <button className={`ff-dd-item ${filters.playType === PLAY_TYPES.PASS ? 'selected' : ''}`} onClick={() => { handleFilterChange('playType', PLAY_TYPES.PASS); closeAll(); }}>
            패스
          </button>
        </Dropdown>

        {/* SIGNIFICANT (다중 선택) */}
        <Dropdown
          label="중요플레이"
          summary={significantSummary}
          isOpen={openMenu === 'significant'}
          onToggle={() => setOpenMenu(openMenu === 'significant' ? null : 'significant')}
          onClose={closeAll}
          width={260}
        >
          <div className="ff-dd-section">
            {Object.values(SIGNIFICANT_PLAYS).map((label) => {
              const selected = Array.isArray(filters.significantPlay) && filters.significantPlay.includes(label);
              return (
                <button key={label} className={`ff-dd-item ${selected ? 'selected' : ''}`} onClick={() => handleFilterChange('significantPlay', label)}>
                  {label}
                </button>
              );
            })}
          </div>
          <div className="ff-dd-actions">
            <button className="ff-dd-clear" onClick={clearSignificant}>모두 해제</button>
            <button className="ff-dd-close" onClick={closeAll}>닫기</button>
          </div>
        </Dropdown>

        {/* RESET */}
        <button type="button" className="ff-reset" onClick={handleResetClick}>초기화</button>
      </div>

      {/* 활성 필터 칩 */}
      {activeFilters?.length > 0 ? (
        <div className="activeFiltersSection">
          <div className="activeFiltersContainer">
            {activeFilters.map((filter, i) => (
              <div key={`${filter.category}-${filter.value}-${i}`} className="filterChip" onClick={() => removeFilter(filter.category, filter.value)}>
                <div className="filterChipText">{filter.label}</div>
                <IoMdClose className="filterChipClose" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="activeFiltersSection"><div className="nonActiveFiltersContainer" /></div>
      )}
    </div>
  );
};

export default FootballFilter;
