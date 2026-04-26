import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import api from '@/services/api';

interface OrderDetailsModalProps {
  visible: boolean;
  orderId: number | null;
  onClose: () => void;
}

interface OrderDetails {
  order_id: number;
  order_number: string;
  total_amount: number;
  delivery_fee: number;
  order_status: string;
  payment_status: string;
  payment_method?: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  notes?: string;
  created_at: string;
  customer_name?: string;
  email?: string;
  phone?: string;
  items: OrderItem[];
}

interface OrderItem {
  item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string;
  purpose: string;
  sub_purpose?: string;
}

function SummaryRow({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowBold, green && styles.rowGreen]}>{value}</Text>
    </View>
  );
}

export function OrderDetailsModal({ visible, orderId, onClose }: OrderDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && orderId) {
      fetchOrderDetails();
    } else {
      // Reset state when modal closes
      setOrderDetails(null);
      setError(null);
    }
  }, [visible, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('[OrderDetailsModal] Fetching order:', orderId);
      const response = await api.orders.getById(orderId);
      console.log('[OrderDetailsModal] API response:', response);
      
      if (response.success && response.data) {
        // response.data might be the order directly or contain {order, items}
        const orderData = response.data as any;
        
        // Check if response.data has 'order' property or is the order itself
        if (orderData.order) {
          // Format: {order: {...}, items: [...]}
          setOrderDetails({
            ...orderData.order,
            items: orderData.items || []
          });
        } else if (orderData.order_id) {
          // Format: order data directly with items property
          setOrderDetails(orderData);
        } else {
          console.error('[OrderDetailsModal] Unexpected response format:', orderData);
          setError('Unexpected response format');
        }
      } else {
        setError('Failed to load order details');
      }
    } catch (err: any) {
      console.error('[OrderDetailsModal] Error fetching order:', err);
      setError(err.response?.data?.error || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      confirmed: Colors.primary,
      processing: '#3B82F6',
      shipped: '#8B5CF6',
      delivered: '#10B981',
      cancelled: '#EF4444',
    };
    return colors[status.toLowerCase()] || Colors.textMedium;
  };

  const handleDownloadPDF = async () => {
    if (!orderDetails) return;

    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order ${orderDetails.order_number}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 8px; font-size: 10px; line-height: 1.3; }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #10B981; padding-bottom: 8px; }
            .header h1 { color: #10B981; font-size: 18px; margin-bottom: 3px; }
            .header h2 { font-size: 14px; margin-bottom: 3px; }
            .section { margin-bottom: 10px; page-break-inside: avoid; }
            .section-title { background-color: #f3f4f6; padding: 4px 6px; font-weight: bold; font-size: 11px; margin-bottom: 4px; }
            .row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #e5e7eb; }
            .label { color: #6b7280; font-size: 10px; }
            .value { font-weight: 500; text-align: right; font-size: 10px; max-width: 60%; word-wrap: break-word; }
            .total { color: #10B981; font-weight: bold; font-size: 12px; }
            .status-badge { display: inline-block; padding: 3px 10px; border-radius: 15px; font-size: 10px; font-weight: bold; margin-top: 3px; }
            .disclaimer { background-color: #fef2f2; border-left: 3px solid #dc2626; padding: 6px; margin-top: 6px; font-size: 9px; color: #dc2626; font-style: italic; line-height: 1.3; }
            hr { margin: 8px 0; border: none; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Details</h1>
            <h2>${orderDetails.order_number}</h2>
            <span class="status-badge" style="background-color: ${getStatusColor(orderDetails.order_status)}20; color: ${getStatusColor(orderDetails.order_status)}; border: 1px solid ${getStatusColor(orderDetails.order_status)};">
              ${orderDetails.order_status.toUpperCase()}
            </span>
          </div>

          <div class="section">
            <div class="section-title">Product Details</div>
            ${orderDetails.items.map(item => `
              <div class="row"><span class="label">Product:</span><span class="value">${item.product_name}</span></div>
              <div class="row"><span class="label">Size:</span><span class="value">${item.size}</span></div>
              <div class="row"><span class="label">Quantity:</span><span class="value">${item.quantity}</span></div>
              <div class="row"><span class="label">Purpose:</span><span class="value">${item.purpose}</span></div>
              ${item.sub_purpose ? `<div class="row"><span class="label">Sub-Purpose:</span><span class="value">${item.sub_purpose}</span></div>` : ''}
              <div class="row"><span class="label">Unit Price:</span><span class="value">₹${item.unit_price.toLocaleString()}</span></div>
              <div class="row"><span class="label">Total:</span><span class="value total">₹${item.total_price.toLocaleString()}</span></div>
            `).join('<hr style="margin: 15px 0; border: none; border-top: 1px solid #e5e7eb;">')}
          </div>

          <div class="section">
            <div class="section-title">Delivery Details</div>
            <div class="row"><span class="label">Address:</span><span class="value">${orderDetails.delivery_address}</span></div>
            <div class="row"><span class="label">City:</span><span class="value">${orderDetails.delivery_city}</span></div>
            <div class="row"><span class="label">State:</span><span class="value">${orderDetails.delivery_state}</span></div>
            <div class="row"><span class="label">Pincode:</span><span class="value">${orderDetails.delivery_pincode}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Price Breakdown</div>
            <div class="row"><span class="label">Total Amount:</span><span class="value total">₹${orderDetails.total_amount.toLocaleString()}</span></div>
            <div class="disclaimer">
              * Additional charges such as delivery fee, GST, and other applicable taxes will be communicated separately.
            </div>
          </div>

          <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="row"><span class="label">Payment Method:</span><span class="value">${orderDetails.payment_method || 'COD'}</span></div>
            <div class="row"><span class="label">Payment Status:</span><span class="value">${orderDetails.payment_status.toUpperCase()}</span></div>
            <div class="row"><span class="label">Order Date:</span><span class="value">${new Date(orderDetails.created_at).toLocaleDateString('en-IN')}</span></div>
          </div>

          ${orderDetails.notes ? `
            <div class="section">
              <div class="section-title">Notes</div>
              <p>${orderDetails.notes}</p>
            </div>
          ` : ''}
        </body>
        </html>
      `;

      const result = await Print.printToFileAsync({ html });
      if (!result || !result.uri) {
        throw new Error('Failed to generate PDF');
      }
      const { uri } = result;
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Order ${orderDetails.order_number}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('[OrderDetailsModal] PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <View style={styles.headerButtons}>
              <Pressable onPress={handleDownloadPDF} style={styles.downloadButton}>
                <MaterialIcons name="download" size={24} color={Colors.primary} />
              </Pressable>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Colors.textDark} />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading order details...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={fetchOrderDetails} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : orderDetails ? (
              <>
                {/* Order Number Card */}
                <View style={styles.orderIdCard}>
                  <Text style={styles.orderIdLabel}>Order Number</Text>
                  <Text style={styles.orderIdValue}>{orderDetails.order_number}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderDetails.order_status) + '20', borderColor: getStatusColor(orderDetails.order_status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(orderDetails.order_status) }]}>
                      {orderDetails.order_status.charAt(0).toUpperCase() + orderDetails.order_status.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Product Details */}
                {orderDetails.items && orderDetails.items.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Product Details</Text>
                    {orderDetails.items.map((item, index) => (
                      <View key={item.item_id} style={index > 0 ? styles.itemSeparator : undefined}>
                        <SummaryRow label="Product" value={item.product_name} />
                        <SummaryRow label="Size" value={item.size} />
                        <SummaryRow label="Quantity" value={`${item.quantity}`} />
                        <SummaryRow label="Purpose" value={item.purpose} />
                        {item.sub_purpose && <SummaryRow label="Sub-Purpose" value={item.sub_purpose} />}
                        <SummaryRow label="Unit Price" value={`₹${item.unit_price.toLocaleString()}`} />
                        <SummaryRow label="Total" value={`₹${item.total_price.toLocaleString()}`} bold green />
                      </View>
                    ))}
                  </View>
                )}

                {/* Delivery Details */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Delivery Details</Text>
                  <SummaryRow label="Address" value={orderDetails.delivery_address} />
                  <SummaryRow label="City" value={orderDetails.delivery_city} />
                  <SummaryRow label="State" value={orderDetails.delivery_state} />
                  <SummaryRow label="Pincode" value={orderDetails.delivery_pincode} />
                </View>

                {/* Price Breakdown */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Price Breakdown</Text>
                  <SummaryRow label="Total" value={`₹${orderDetails.total_amount.toLocaleString()}`} bold green />
                  
                  <View style={styles.disclaimerBox}>
                    <Text style={styles.disclaimerText}>
                      * Additional charges such as delivery fee, GST, and other applicable taxes will be communicated separately.
                    </Text>
                  </View>
                </View>

                {/* Payment Details */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Payment Details</Text>
                  <SummaryRow label="Payment Method" value={orderDetails.payment_method || 'COD'} />
                  <SummaryRow 
                    label="Payment Status" 
                    value={orderDetails.payment_status.charAt(0).toUpperCase() + orderDetails.payment_status.slice(1)} 
                  />
                  <SummaryRow 
                    label="Order Date" 
                    value={new Date(orderDetails.created_at).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })} 
                  />
                </View>

                {orderDetails.notes && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Notes</Text>
                    <Text style={styles.notesText}>{orderDetails.notes}</Text>
                  </View>
                )}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  downloadButton: {
    padding: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.textMedium,
  },
  errorContainer: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  retryButtonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  orderIdCard: {
    backgroundColor: Colors.bgLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMedium,
    marginBottom: Spacing.xs,
  },
  orderIdValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textDark,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  rowLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMedium,
    flex: 1,
  },
  rowValue: {
    fontSize: FontSize.sm,
    color: Colors.textDark,
    fontWeight: FontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  rowBold: {
    fontWeight: FontWeight.bold,
    fontSize: FontSize.lg,
  },
  rowGreen: {
    color: Colors.primary,
  },
  itemSeparator: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  disclaimerBox: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  disclaimerText: {
    fontSize: FontSize.xs,
    color: '#DC2626',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: FontSize.body,
    color: Colors.textDark,
    lineHeight: 22,
  },
});