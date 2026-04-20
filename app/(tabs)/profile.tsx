import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ScreenHeader } from '@/components/feature/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import api from '@/services/api';

const MENU_ITEMS = [
  { icon: 'inventory-2' as const, label: 'My Orders', route: '/orders' },
  { icon: 'help-outline' as const, label: 'Help & Support', route: '/queries' },
  { icon: 'info-outline' as const, label: 'About Eco Sudar', url: 'https://www.ecosudar.com/about-us' },
  { icon: 'privacy-tip' as const, label: 'Privacy Policy', route: '/privacy-policy' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch order statistics from API
  const fetchStats = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      const response = await api.users.getOrders(userId, { limit: 100 });
      
      if (response.success && response.data) {
        const orders = response.data as any[];
        setStats({
          total: orders.length,
          pending: orders.filter((o: any) => o.order_status === 'pending').length,
          delivered: orders.filter((o: any) => o.order_status === 'delivered').length,
        });
      }
    } catch (error) {
      console.error('[Profile] Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh stats when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [user])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Profile" showLogo />

      {user ? (
        <>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.statNum}>{stats.total}</Text>
              )}
              <Text style={styles.statLbl}>Total Orders</Text>
            </View>
            <View style={[styles.statBox, styles.statBorder]}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.statNum}>{stats.pending}</Text>
              )}
              <Text style={styles.statLbl}>Pending</Text>
            </View>
            <View style={styles.statBox}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.statNum}>{stats.delivered}</Text>
              )}
              <Text style={styles.statLbl}>Delivered</Text>
            </View>
          </View>

          <View style={styles.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <Pressable
                key={item.label}
                style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuBorder]}
                onPress={() => {
                  if ('url' in item && item.url) Linking.openURL(item.url);
                  else if (item.route) router.push(item.route as any);
                }}
              >
                <MaterialIcons name={item.icon} size={22} color={Colors.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={22} color={Colors.textMedium} />
              </Pressable>
            ))}
          </View>

          <View style={styles.signOutSection}>
            <Button label="Sign Out" onPress={signOut} variant="secondary" fullWidth />
          </View>
        </>
      ) : (
        <View style={styles.guestSection}>
          <MaterialIcons name="person-outline" size={72} color={Colors.borderLight} />
          <Text style={styles.guestTitle}>Welcome to Eco Sudar</Text>
          <Text style={styles.guestText}>Sign in to view your profile and track orders</Text>
          <Button
            label="Sign In"
            onPress={() => router.push('/auth')}
            fullWidth
            style={styles.guestBtn}
          />
          <Button
            label="Create Account"
            onPress={() => router.push({ pathname: '/auth', params: { tab: 'signup' } })}
            variant="secondary"
            fullWidth
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPage,
  },

  avatarSection: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    padding: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FontSize.body,
    color: Colors.textMedium,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.borderGray,
  },
  statNum: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statLbl: {
    fontSize: FontSize.xs,
    color: Colors.textMedium,
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    margin: Spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: 12,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.textDark,
  },
  signOutSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  guestSection: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.xxxl,
    paddingTop: 60,
  },
  guestTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
    marginTop: Spacing.lg,
    marginBottom: 8,
    textAlign: 'center',
  },
  guestText: {
    fontSize: FontSize.body,
    color: Colors.textMedium,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  guestBtn: {
    marginBottom: 12,
  },
});