import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator, BackHandler,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useOrder } from '@/hooks/useOrder';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { ScreenHeader } from '@/components/feature/ScreenHeader';
import { PillButton } from '@/components/ui/PillButton';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { PRODUCTS, PURPOSES, SUB_PURPOSES, DELIVERY_FEE } from '@/constants/products';
import api from '@/services/api';

export default function ProductSelectionScreen() {
  const router = useRouter();
  const { setCurrentProduct } = useOrder();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [products, setProducts] = useState(PRODUCTS); // Start with hardcoded as fallback
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [selectedSubPurpose, setSelectedSubPurpose] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customSubPurpose, setCustomSubPurpose] = useState('');
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Reset form when screen comes into focus (when navigating back)
  useFocusEffect(
    useCallback(() => {
      // Reset all selections when screen gains focus
      setSelectedProductId(null);
      setSelectedSize(null);
      setSelectedPurpose(null);
      setSelectedSubPurpose(null);
      setQuantity(1);
      setQuantityInput('1');
      setCustomSubPurpose('');
      setSelectedPrice(0);
      setDropdownOpen(false);
    }, [])
  );

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('[ProductSelection] Fetching products from API...');
        const response = await api.products.getAll();
        console.log('[ProductSelection] API response:', response);
        
        // API returns {success: true, data: Array(3)} - data is the products array directly
        if (response.success && response.data && Array.isArray(response.data)) {
          console.log('[ProductSelection] Products data:', response.data);
          
          // Map API products to app format
          const apiProducts = response.data.map((p: any) => {
            // Extract unique sizes from configurations and sort them
            let sizes: string[] = ['6mm', '8mm', '10mm']; // default
            
            if (p.configurations && p.configurations.length > 0) {
              const uniqueSizes = [...new Set(p.configurations.map((c: any) => c.size))] as string[];
              
              // Sort sizes intelligently (numeric part first, then unit)
              sizes = uniqueSizes.sort((a, b) => {
                const aNum = parseFloat(a);
                const bNum = parseFloat(b);
                return aNum - bNum;
              });
            }
            
            // Find matching image from hardcoded PRODUCTS
            const matchingProduct = PRODUCTS.find(prod => prod.id === p.product_type);
            console.log(`[ProductSelection] Product ${p.product_id}: type="${p.product_type}", found image:`, !!matchingProduct);
            
            return {
              id: p.product_id.toString(),
              name: p.product_name,
              image: matchingProduct?.image || PRODUCTS[0].image,
              price: p.base_price,
              unit: matchingProduct?.unit || 'kg',
              tag: p.tag || '',
              tagColor: p.tag_color || '#F59E0B',
              gcv: p.gcv || '',
              ash: p.ash_content || '',
              description: p.description || '',
              suitableFor: p.suitable_for || '',
              sizes: sizes,
            };
          });
          
          console.log('[ProductSelection] Mapped products:', apiProducts);
          
          if (apiProducts.length > 0) {
            setProducts(apiProducts);
            console.log('[ProductSelection] ✅ Using API products with IDs:', apiProducts.map(p => p.id));
          } else {
            console.log('[ProductSelection] ⚠️ No products from API, using hardcoded fallback');
          }
        } else {
          console.log('[ProductSelection] ⚠️ API response unsuccessful or no data, using hardcoded fallback');
        }
      } catch (error) {
        console.error('[ProductSelection] ❌ Failed to fetch products:', error);
        // Keep using hardcoded fallback
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Fetch dynamic price when product or size changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!selectedProductId || !selectedSize) {
        setSelectedPrice(0);
        return;
      }

      // Check if product ID is numeric (from API) or string (hardcoded fallback)
      const productIdNum = parseInt(selectedProductId);
      const isNumericId = !isNaN(productIdNum) && productIdNum.toString() === selectedProductId;
      
      if (!isNumericId) {
        // Using hardcoded products with string IDs - just use base price
        console.log('[ProductSelection] Using hardcoded product, skipping API call');
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
          setSelectedPrice(product.price);
          console.log(`[ProductSelection] Using base price: ₹${product.price}`);
        }
        return;
      }

      // Numeric ID - fetch dynamic price from API
      setLoadingPrice(true);
      try {
        console.log(`[ProductSelection] Fetching price for product ${productIdNum}, size ${selectedSize}`);
        
        const response = await api.products.getPriceBySize(
          productIdNum,
          selectedSize,
          selectedPurpose ? PURPOSES.find(p => p.id === selectedPurpose)?.label : undefined
        );

        if (response.success && response.data) {
          setSelectedPrice(response.data.price);
          console.log(`[ProductSelection]  Price for ${selectedSize}: ₹${response.data.price}`);
        } else {
          console.warn('[ProductSelection] API returned unsuccessful response:', response);
          // Fallback to base price
          const product = products.find(p => p.id === selectedProductId);
          if (product) {
            setSelectedPrice(product.price);
            console.log(`[ProductSelection] Using fallback base price: ₹${product.price}`);
          }
        }
      } catch (error: any) {
        console.error('[ProductSelection]  Failed to fetch price:', error.response?.data || error.message);
        // Fallback to base price
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
          setSelectedPrice(product.price);
          console.log(`[ProductSelection] Using fallback base price: ₹${product.price}`);
        }
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPrice();
  }, [selectedProductId, selectedSize, selectedPurpose, products]);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  // Use dynamic price if available, otherwise fall back to base price
  const currentPrice = selectedPrice > 0 ? selectedPrice : (selectedProduct?.price || 0);
  const subtotal = currentPrice * quantity;
  const total = subtotal + DELIVERY_FEE;

  const handleQuantityChange = (text: string) => {
    setQuantityInput(text);
    const num = parseInt(text);
    if (!isNaN(num) && num > 0) setQuantity(num);
  };

  const handleQuantityBlur = () => {  
    if (quantity < 1) { setQuantity(1); setQuantityInput('1'); }
    else setQuantityInput(quantity.toString());
  };

  const handlePurposeSelect = (id: string) => {
    setSelectedPurpose(id);
    setSelectedSubPurpose(null);
    setDropdownOpen(false);
  };

  const handleContinue = () => {
    if (!selectedProduct || !selectedSize || !selectedPurpose || !selectedSubPurpose) {
      showAlert('Incomplete Selection', 'Please select product, size, purpose, and sub-purpose.');
      return;
    }
    
    // Validate custom sub-purpose text if "Custom" is selected
    if (selectedSubPurpose === 'Custom' && !customSubPurpose.trim()) {
      showAlert('Custom Sub-Purpose Required', 'Please enter your custom sub-purpose.');
      return;
    }
    
    // Check if user is authenticated before proceeding
    if (!user) {
      showAlert(
        'Sign In Required',
        'Please sign in to continue with your order.',
        [
          {
            text: 'Sign In',
            onPress: () => {
              // Save current selection to order context before navigating
              setCurrentProduct({
                id: selectedProduct.id,
                name: selectedProduct.name,
                price: selectedProduct.price,
                size: selectedSize,
                quantity,
                purpose: PURPOSES.find(p => p.id === selectedPurpose)?.label || '',
                subPurpose: selectedSubPurpose === 'Custom' ? customSubPurpose.trim() : selectedSubPurpose,
              });
              router.push('/(tabs)/auth');
            },
            style: 'default'
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }
    
    // User is authenticated, proceed normally
    setCurrentProduct({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: currentPrice, // Use dynamic price instead of base price
      size: selectedSize,
      quantity,
      purpose: PURPOSES.find(p => p.id === selectedPurpose)?.label || '',
      subPurpose: selectedSubPurpose === 'Custom' ? customSubPurpose.trim() : selectedSubPurpose,
    });
    router.push('/user-details');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPage }}>
      <ScreenHeader title="Select Product" showLogo />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Choose Product</Text>
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ marginTop: 12, color: Colors.textMedium }}>Loading products...</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {products.map(product => (
              <Pressable
                key={product.id}
                style={[styles.productCard, selectedProductId === product.id && styles.productCardActive]}
                onPress={() => { setSelectedProductId(product.id); setSelectedSize(null); }}
              >
                <Image source={product.image} style={styles.productImage} contentFit="contain" transition={200} />
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {selectedProduct ? (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.label}>Size</Text>
              {selectedSize && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {loadingPrice ? (
                    <>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={{ fontSize: FontSize.sm, color: Colors.textMedium }}>Loading price...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: FontSize.sm, color: Colors.textMedium }}>Price:</Text>
                      <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary }}>
                        ₹{currentPrice.toFixed(2)}{selectedProduct.unit === 'kg' ? '/kg' : ''}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>
            <View style={styles.pillRow}>
              {selectedProduct.sizes.map(s => (
                <PillButton key={s} label={s} selected={selectedSize === s} onPress={() => setSelectedSize(s)} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Purpose</Text>
          <View style={styles.pillRow}>
            {PURPOSES.map(p => (
              <PillButton key={p.id} label={p.label} selected={selectedPurpose === p.id} onPress={() => handlePurposeSelect(p.id)} />
            ))}
          </View>
        </View>

        {selectedPurpose ? (
          <View style={styles.section}>
            <Text style={styles.label}>Sub-Purpose</Text>
            <Pressable style={styles.dropdown} onPress={() => setDropdownOpen(v => !v)}>
              <Text style={[styles.dropdownText, !selectedSubPurpose && styles.placeholderText]}>
                {selectedSubPurpose || 'Select sub-purpose'}
              </Text>
              <MaterialIcons name={dropdownOpen ? 'expand-less' : 'expand-more'} size={22} color={Colors.textMedium} />
            </Pressable>
            {dropdownOpen ? (
              <View style={styles.dropdownMenu}>
                {SUB_PURPOSES[selectedPurpose].map(sub => (
                  <Pressable
                    key={sub}
                    style={[styles.dropdownItem, selectedSubPurpose === sub && styles.dropdownItemActive]}
                    onPress={() => { setSelectedSubPurpose(sub); setDropdownOpen(false); setCustomSubPurpose(''); }}
                  >
                    <Text style={[styles.dropdownItemText, selectedSubPurpose === sub && styles.dropdownItemTextActive]}>{sub}</Text>
                    {selectedSubPurpose === sub ? <MaterialIcons name="check" size={16} color={Colors.primary} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
            {selectedSubPurpose === 'Custom' ? (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.label, { marginBottom: 8 }]}>Please specify</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="Enter your custom sub-purpose"
                  value={customSubPurpose}
                  onChangeText={setCustomSubPurpose}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Quantity</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => { const n = Math.max(1, quantity - 1); setQuantity(n); setQuantityInput(n.toString()); }}>
              <MaterialIcons name="remove" size={20} color={Colors.primary} />
            </Pressable>
            <TextInput style={styles.stepInput} value={quantityInput} onChangeText={handleQuantityChange} onBlur={handleQuantityBlur} keyboardType="number-pad" selectTextOnFocus />
            <Pressable style={styles.stepBtn} onPress={() => { const n = quantity + 1; setQuantity(n); setQuantityInput(n.toString()); }}>
              <MaterialIcons name="add" size={20} color={Colors.primary} />
            </Pressable>
          </View>
        </View>

        {selectedProduct ? (
          <View style={styles.priceCard}>
            <Text style={styles.label}>Price Summary</Text>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Subtotal</Text><Text style={styles.priceValue}>₹{subtotal.toLocaleString()}</Text></View>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Delivery Fee</Text><Text style={styles.priceValue}>₹{DELIVERY_FEE}</Text></View>
            <View style={[styles.priceRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>₹{total.toLocaleString()}</Text></View>
          </View>
        ) : null}

        <Button label="Continue" onPress={handleContinue} fullWidth size="lg" disabled={!selectedProduct || !selectedSize || !selectedPurpose || !selectedSubPurpose} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  productGrid: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
  productCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.borderLight, padding: 10, alignItems: 'center' },
  productCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  productImage: { width: 72, height: 72, marginBottom: 6 },
  productName: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textDark, textAlign: 'center' },
  section: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textDark, marginBottom: 10 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14 },
  dropdownText: { flex: 1, fontSize: FontSize.body, color: Colors.textDark },
  placeholderText: { color: Colors.textLight },
  dropdownMenu: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.md, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  dropdownItemActive: { backgroundColor: Colors.primaryLight },
  dropdownItemText: { fontSize: FontSize.body, color: Colors.textDark },
  dropdownItemTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  stepInput: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textDark, minWidth: 80, textAlign: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.md, paddingVertical: 8, paddingHorizontal: 12 },
  priceCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderGray, padding: Spacing.lg, marginTop: Spacing.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  totalRow: { borderBottomWidth: 0, paddingTop: 10 },
  priceLabel: { fontSize: FontSize.body, color: Colors.textMedium },
  priceValue: { fontSize: FontSize.body, color: Colors.textDark, fontWeight: FontWeight.medium },
  totalLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textDark },
  totalValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  customInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.body,
    color: Colors.textDark,
    minHeight: 80,
  },
});
