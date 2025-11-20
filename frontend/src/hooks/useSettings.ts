import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function useSettings() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/settings`)
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  return settings;
}
