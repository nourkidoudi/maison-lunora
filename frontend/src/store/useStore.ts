import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductVariant {
  size: string;
  color: string;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  sale_price: string | null;
  category: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  variants?: ProductVariant[];
  created_at?: string;
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

interface StoreState {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number, size: string, color: string) => void;
  updateQuantity: (productId: number, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      isCartOpen: false,
      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      
      addToCart: (item) => set((state) => {
        const existing = state.cart.find(
          (c) => c.product.id === item.product.id && c.size === item.size && c.color === item.color
        );
        if (existing) {
          return {
            cart: state.cart.map((c) =>
              c === existing ? { ...c, quantity: c.quantity + item.quantity } : c
            ),
            isCartOpen: true
          };
        }
        return { cart: [...state.cart, item], isCartOpen: true };
      }),
      
      removeFromCart: (productId, size, color) => set((state) => ({
        cart: state.cart.filter(
          (c) => !(c.product.id === productId && c.size === size && c.color === color)
        )
      })),
      
      updateQuantity: (productId, size, color, quantity) => set((state) => ({
        cart: state.cart.map((c) => 
          (c.product.id === productId && c.size === size && c.color === color)
            ? { ...c, quantity } : c
        )
      })),
      
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'maison-lunora-cart',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
