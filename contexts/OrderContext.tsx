import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api, { CreateOrderRequest, Order as ApiOrder } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OrderProduct {
  id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  purpose: string;
  subPurpose: string;
}

export interface CustomerDetails {
  type: 'customer' | 'dealer';
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  businessName?: string;
  contactPerson?: string;
  udyamNumber?: string;
  gstNumber?: string;
}

export interface PlacedOrder {
  id: string;
  product: OrderProduct;
  customer: CustomerDetails;
  total: number;
  deliveryFee: number;
  placedAt: Date;
  status: 'pending' | 'confirmed' | 'delivered';
}

interface OrderContextType {
  currentProduct: OrderProduct | null;
  currentCustomer: CustomerDetails | null;
  orders: PlacedOrder[];
  isPlacingOrder: boolean;
  setCurrentProduct: (p: OrderProduct | null) => void;
  setCurrentCustomer: (c: CustomerDetails | null) => void;
  placeOrder: () => Promise<PlacedOrder | null>;
  clearCurrent: () => void;
  fetchOrders: () => Promise<void>;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [currentProduct, setCurrentProduct] = useState<OrderProduct | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerDetails | null>(null);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Fetch orders when component mounts and user is logged in
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          await fetchOrders();
        }
      } catch (error) {
        console.error('[Order] Error loading orders on mount:', error);
      }
    };
    
    loadOrders();
  }, []);

  const placeOrder = async (): Promise<PlacedOrder | null> => {
    console.log('[Order] placeOrder called');
    console.log('[Order] currentProduct:', currentProduct);
    console.log('[Order] currentCustomer:', currentCustomer);
    
    if (!currentProduct || !currentCustomer) {
      console.error('[Order] Missing product or customer data');
      return null;
    }
    
    setIsPlacingOrder(true);
    try {
      // Convert product ID to number
      let numericProductId: number;
      
      if (typeof currentProduct.id === 'string') {
        // Try to parse as number first (for API products)
        const parsed = parseInt(currentProduct.id, 10);
        
        if (!isNaN(parsed)) {
          // It's a numeric string like "1", "2", "3"
          numericProductId = parsed;
        } else {
          // It's a string ID like "pellets", "briquettes", "burner" - map to numbers
          const productIdMap: { [key: string]: number } = {
            'pellets': 1,
            'briquettes': 2,
            'burner': 3,
            'chips': 3,
          };
          numericProductId = productIdMap[currentProduct.id] || 1;
        }
      } else {
        numericProductId = currentProduct.id;
      }
      
      console.log('[Order] Product ID:', currentProduct.id, '→ Numeric:', numericProductId);
      console.log('[Order] Product quantity:', currentProduct.quantity);
      
      // Prepare order data for API
      const orderData: CreateOrderRequest = {
        delivery_address: currentCustomer.address,
        delivery_city: currentCustomer.city,
        delivery_state: 'Tamil Nadu', // You might want to add state to CustomerDetails
        delivery_pincode: currentCustomer.pincode,
        payment_method: 'COD',
        notes: currentCustomer.businessName ? `Business: ${currentCustomer.businessName}` : undefined,
        items: [
          {
            product_id: numericProductId,
            quantity: currentProduct.quantity,
            size: currentProduct.size,
            purpose: currentProduct.purpose,
            sub_purpose: currentProduct.subPurpose,
          },
        ],
      };

      const response = await api.orders.create(orderData);
      
      if (response.success && response.data) {
        const apiOrder = response.data;
        
        // Convert API order to local order format
        const deliveryFee = apiOrder.delivery_fee || 150;
        const localOrder: PlacedOrder = {
          id: apiOrder.order_number,
          product: currentProduct,
          customer: currentCustomer,
          total: apiOrder.total_amount,
          deliveryFee: deliveryFee,
          placedAt: new Date(apiOrder.created_at),
          status: apiOrder.order_status as 'pending' | 'confirmed' | 'delivered',
        };
        
        setOrders(prev => [localOrder, ...prev]);
        setIsPlacingOrder(false);
        
        // Refresh orders from API to get updated list
        fetchOrders().catch(err => console.error('[Order] Failed to refresh orders:', err));
        
        return localOrder;
      }
      
      setIsPlacingOrder(false);
      return null;
    } catch (error: any) {
      console.error('[Order] Place order error:', error.response?.data || error.message);
      setIsPlacingOrder(false);
      
      // Re-throw the error so it can be caught in the UI with the proper message
      throw error;
    }
  };

  const fetchOrders = async () => {
    try {
      // Increase limit to 100 to fetch more orders
      const response = await api.orders.getAll({ page: 1, limit: 100 });
      
      if (response.success && response.data) {
        // Convert API orders to local format
        // Note: This is a simplified conversion. You might need to fetch order items separately
        const localOrders: PlacedOrder[] = response.data.data.map((apiOrder: any) => ({
          id: apiOrder.order_number,
          product: {
            id: '1', // You'll need to get this from order items
            name: 'Product', // You'll need to get this from order items
            price: apiOrder.total_amount - apiOrder.delivery_fee,
            size: '',
            quantity: 1,
            purpose: '',
            subPurpose: '',
          },
          customer: {
            type: 'customer' as const,
            name: apiOrder.customer_name || '',
            email: apiOrder.customer_email || '',
            phone: apiOrder.customer_phone || '',
            address: apiOrder.delivery_address,
            city: apiOrder.delivery_city,
            pincode: apiOrder.delivery_pincode,
          },
          total: apiOrder.total_amount,
          deliveryFee: apiOrder.delivery_fee,
          placedAt: new Date(apiOrder.created_at),
          status: apiOrder.order_status as 'pending' | 'confirmed' | 'delivered',
        }));
        
        setOrders(localOrders);
      }
    } catch (error: any) {
      console.error('[Order] Fetch orders error:', error.response?.data || error.message);
    }
  };

  const clearCurrent = () => {
    setCurrentProduct(null);
    setCurrentCustomer(null);
  };

  return (
    <OrderContext.Provider value={{
      currentProduct, 
      currentCustomer, 
      orders,
      isPlacingOrder,
      setCurrentProduct, 
      setCurrentCustomer, 
      placeOrder, 
      clearCurrent,
      fetchOrders,
    }}>
      {children}
    </OrderContext.Provider>
  );
}