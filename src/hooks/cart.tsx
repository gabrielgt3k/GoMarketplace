import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { State } from 'react-native-gesture-handler';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      if (productIndex >= 0) {
        products[productIndex].quantity += 1;
        setProducts([...products]);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      if (productIndex >= 0) {
        if (products[productIndex].quantity > 0) {
          products[productIndex].quantity -= 1;
          if (products[productIndex].quantity === 0) {
            setProducts(state => state.filter(product => product.id !== id));
            await AsyncStorage.setItem(
              '@GoMarketplace:products',
              JSON.stringify(products),
            );
          } else {
            setProducts([...products]);
            await AsyncStorage.setItem(
              '@GoMarketplace:products',
              JSON.stringify(products),
            );
          }
        }
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const sameProduct = products.find(
        productInCart => productInCart.id === product.id,
      );

      if (sameProduct) {
        increment(sameProduct.id);
        return;
      }
      const productToBeAdd = product;
      productToBeAdd.quantity = 1;
      setProducts(state => {
        return [...state, productToBeAdd];
      });
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
