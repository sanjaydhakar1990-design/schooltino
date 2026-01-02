import { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    changeLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      changeLanguage,
      toggleLanguage,
      isHindi: language === 'hi'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export default LanguageContext;
