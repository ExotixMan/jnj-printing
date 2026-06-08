"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "fil";
type ThemeMode = "light" | "dark";

type AppPreferencesContextValue = {
  language: Language;
  theme: ThemeMode;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  toggleTheme: () => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

const STORAGE_KEYS = {
  language: "jnj-language",
  theme: "jnj-theme",
} as const;

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const storedLanguage = window.localStorage.getItem(STORAGE_KEYS.language);

  return storedLanguage === "fil" || storedLanguage === "en"
    ? storedLanguage
    : "en";
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const storedTheme = window.localStorage.getItem(STORAGE_KEYS.theme);

  return storedTheme === "dark" || storedTheme === "light"
    ? storedTheme
    : "light";
}

export function AppPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.language, language);
    document.documentElement.lang = language === "fil" ? "tl" : "en";
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo<AppPreferencesContextValue>(() => {
    return {
      language,
      theme,
      setLanguage: (nextLanguage) => setLanguageState(nextLanguage),
      toggleLanguage: () =>
        setLanguageState((current) => (current === "en" ? "fil" : "en")),
      toggleTheme: () =>
        setThemeState((current) => (current === "light" ? "dark" : "light")),
    };
  }, [language, theme]);

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }

  return context;
}