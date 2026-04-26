import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { ScreenHeader } from '@/components/feature/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { OrderDetailsModal } from '@/components/feature/OrderDetailsModal';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import api from '@/services/api';

// Order type from API
interface ApiOrder {
  id?: number;
  order_id?: number;
  order_number: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  customer_name?: string;
  customer_type?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: Colors.primary,
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

function OrderCard({ order, onPress }: { order: ApiOrder; onPress: () => void }) {
  return (
    <Pressable style={styles.orderCard} onPress={onPress}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>{order.order_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[order.order_status] || Colors.textMedium) + '20', borderColor: STATUS_COLORS[order.order_status] || Colors.textMedium }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[order.order_status] || Colors.textMedium }]}>
            {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Order ID</Text>
        <Text style={styles.orderValue}>#{order.order_id || order.id}</Text>
      </View>
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Total Amount</Text>
        <Text style={[styles.orderValue, styles.totalValue]}>₹{order.total_amount.toLocaleString()}</Text>
      </View>
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Payment</Text>
        <Text style={styles.orderValue}>{order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}</Text>
      </View>
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Date</Text>
        <Text style={styles.orderValue}>{new Date(order.created_at).toLocaleDateString('en-IN')}</Text>
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleOrderPress = (orderId: number) => {
    setSelectedOrderId(orderId);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOrderId(null);
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      console.log('[Orders] Fetching orders for user:', userId);
      
      // Add limit parameter to fetch more orders
      const response = await api.users.getOrders(userId, { limit: 100 });
      
      console.log('[Orders] API response:', response);
      console.log('[Orders] Number of orders fetched:', response.data?.length || 0);
      
      if (response.success && response.data) {
        setOrders(response.data as any);
        console.log('[Orders] Orders set in state:', response.data.length);
      } else {
        console.error('[Orders] Failed to load orders:', response);
        showAlert('Error', 'Failed to load orders');
      }
    } catch (error: any) {
      console.error('[Orders] Fetch error:', error);
      showAlert('Error', error.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch orders on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Refresh orders when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log('[Orders] Tab focused - refreshing orders');
        fetchOrders();
      }
    }, [user])
  );

  // Handle pull to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="My Orders" showLogo />
        <View style={styles.empty}>
          <MaterialIcons name="person-outline" size={72} color={Colors.borderLight} />
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>Sign in to view and track your orders</Text>
          <Button label="Sign In" onPress={() => router.push('/auth')} style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="My Orders" showLogo />
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Orders" showLogo />
      {orders.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="inventory-2" size={64} color={Colors.borderLight} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Your orders will appear here after you place them</Text>
          <Button 
            label="Start Ordering" 
            onPress={() => router.push('/product-selection')} 
            style={{ marginTop: 20 }} 
          />
        </View>
      ) : (
        <>
          <FlatList
            data={orders}
            keyExtractor={(item, index) => (item?.order_id || item?.id)?.toString() || `order-${index}`}
            renderItem={({ item }) => (
              <OrderCard 
                order={item} 
                onPress={() => handleOrderPress(item.order_id || item.id || 0)} 
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
          <View style={styles.fabContainer}>
            <Button 
              label="Place New Order" 
              onPress={() => router.push('/product-selection')}
              fullWidth
            />
          </View>
        </>
      )}
      
      <OrderDetailsModal
        visible={modalVisible}
        orderId={selectedOrderId}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPage,
  },

  list: {
    padding: Spacing.lg,
    paddingBottom: 100,
    gap: 12,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: Spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  orderLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMedium,
  },
  orderValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textDark,
  },
  totalValue: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.body,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.textDark,
    marginTop: Spacing.lg,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.textMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: 80,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
});
