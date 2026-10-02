import { useState, useEffect } from 'react';
import api from '../api';
import {
  DELIVERY_FEE as DEFAULT_DELIVERY_FEE,
  WHATSAPP_NUMBER as DEFAULT_WHATSAPP,
  PHONE_NUMBER as DEFAULT_PHONE,
  INSTAGRAM_HANDLE as DEFAULT_INSTAGRAM
} from '../constants';

export interface AppSettings {
  whatsapp_number: string;
  phone_number: string;
  instagram_handle: string;
  delivery_fee: number;
  shop_name?: string;
  shop_description?: string;
}

let cache: AppSettings | null = null;
let cachePromise: Promise<AppSettings> | null = null;

export const loadSettings = async (): Promise<AppSettings> => {
  if (cache) return cache;
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    try {
      const { data } = await api.get('/settings');
      const s: AppSettings = {
        whatsapp_number: data.whatsapp_number || DEFAULT_WHATSAPP,
        phone_number: data.phone_number || DEFAULT_PHONE,
        instagram_handle: data.instagram_handle || DEFAULT_INSTAGRAM,
        delivery_fee: data.delivery_fee ? parseFloat(data.delivery_fee) || DEFAULT_DELIVERY_FEE : DEFAULT_DELIVERY_FEE,
        shop_name: data.shop_name,
        shop_description: data.shop_description
      };
      cache = s;
      return s;
    } catch (e) {
      cache = {
        whatsapp_number: DEFAULT_WHATSAPP,
        phone_number: DEFAULT_PHONE,
        instagram_handle: DEFAULT_INSTAGRAM,
        delivery_fee: DEFAULT_DELIVERY_FEE
      };
      return cache;
    } finally {
      cachePromise = null;
    }
  })();
  return cachePromise;
};

export const invalidateSettingsCache = () => {
  cache = null;
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => cache || {
    whatsapp_number: DEFAULT_WHATSAPP,
    phone_number: DEFAULT_PHONE,
    instagram_handle: DEFAULT_INSTAGRAM,
    delivery_fee: DEFAULT_DELIVERY_FEE
  });

  useEffect(() => {
    let cancelled = false;
    loadSettings().then(s => {
      if (!cancelled) setSettings(s);
    });
    return () => { cancelled = true; };
  }, []);

  return settings;
};
