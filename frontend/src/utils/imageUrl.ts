const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1067&fit=crop';

/**
 * Resolves an image URL whether it is a full external URL (e.g. Unsplash),
 * a local backend upload (e.g. /uploads/image.jpg or uploads/image.jpg),
 * or empty.
 */
export const getImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_PRODUCT_IMAGE;
  }
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
    return cleanUrl;
  }
  return `${BACKEND_URL}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
};
