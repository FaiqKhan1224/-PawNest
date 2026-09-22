import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const defaults = {
  storeName: 'PawNest',
  tagline: 'Better Care. Happier Pets.',
  contactEmail: '',
  contactPhone: '',
  whatsapp: '',
  address: '',
  shippingFee: 300,
  freeShippingThreshold: 0,
  heroImage: '',
  social: {},
  aiEnabled: true,
};

const SettingsContext = createContext({ settings: defaults, reload: () => {} });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaults);

  const load = () => api.get('/settings/public').then((d) => setSettings({ ...defaults, ...d.settings })).catch(() => {});
  useEffect(() => { load(); }, []);

  const value = useMemo(() => ({ settings, reload: load }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
