import { createContext, useContext, useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

type SettingsData = {
  company_name: string;
  theme_color: string;
  logo_url?: string;
};

type SettingsContextType = {
  settings: SettingsData | null;
  reload: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  reload: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<SettingsData | null>(null);

  const reload = async () => {
    const res = await fetch(`${API}/settings`);
    const data = await res.json();
    setSettings(data);
    // Cập nhật màu chủ đạo cho toàn app
    if (data.theme_color) {
      document.documentElement.style.setProperty("--theme-color", data.theme_color);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, reload }}>
      {children}
    </SettingsContext.Provider>
  );
};
