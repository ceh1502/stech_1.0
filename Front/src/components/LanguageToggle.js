import i18n from 'i18next';

const LanguageToggle = () => {
  return (
    <div>
      <button onClick={() => i18n.changeLanguage('ko')}>🇰🇷 한국어</button>
      <button onClick={() => i18n.changeLanguage('en')}>🇺🇸 English</button>
    </div>
  );
};

export default LanguageToggle;
