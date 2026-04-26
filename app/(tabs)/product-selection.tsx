import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator, BackHandler, FlatList,
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
  const [subPurposes, setSubPurposes] = useState<string[]>([]);
  const [loadingSubPurposes, setLoadingSubPurposes] = useState(false);

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

  // Fetch sub-purposes when product, size, and purpose are selected
  useEffect(() => {
    const fetchSubPurposes = async () => {
      if (!selectedProductId || !selectedSize || !selectedPurpose) {
        setSubPurposes([]);
        return;
      }

      // Check if product ID is numeric (from API)
      const productIdNum = parseInt(selectedProductId);
      const isNumericId = !isNaN(productIdNum) && productIdNum.toString() === selectedProductId;
      
      if (!isNumericId) {
        // Using hardcoded products - use hardcoded sub-purposes
        console.log('[ProductSelection] Using hardcoded sub-purposes');
        const hardcodedSubPurposes = SUB_PURPOSES[selectedPurpose] || [];
        // Replace "Custom" with "Others"
        const updatedSubPurposes = hardcodedSubPurposes.map(sp => sp === 'Custom' ? 'Others' : sp);
        setSubPurposes(updatedSubPurposes);
        return;
      }

      // Numeric ID - fetch sub-purposes from API
      setLoadingSubPurposes(true);
      try {
        console.log(`[ProductSelection] Fetching sub-purposes for product ${productIdNum}, size ${selectedSize}, purpose ${selectedPurpose}`);
        
        const purposeLabel = PURPOSES.find(p => p.id === selectedPurpose)?.label;
        const response = await api.products.getSubPurposes({
          product_id: productIdNum,
          size: selectedSize,
          purpose: purposeLabel,
        });

        if (response.success && response.data) {
          // Add "Others" as the last option
          const subPurposesWithOthers = [...response.data, 'Others'];
          setSubPurposes(subPurposesWithOthers);
          console.log(`[ProductSelection] ✅ Fetched ${response.data.length} sub-purposes:`, subPurposesWithOthers);
        } else {
          console.warn('[ProductSelection] API returned unsuccessful response:', response);
          setSubPurposes(['Others']); // Fallback to just "Others"
        }
      } catch (error: any) {
        console.error('[ProductSelection] ❌ Failed to fetch sub-purposes:', error.response?.data || error.message);
        setSubPurposes(['Others']); // Fallback to just "Others"
      } finally {
        setLoadingSubPurposes(false);
      }
    };

    fetchSubPurposes();
  }, [selectedProductId, selectedSize, selectedPurpose]);

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
  const total = subtotal; // No delivery fee added

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
    
    // Validate custom sub-purpose text if "Others" is selected
    if (selectedSubPurpose === 'Others' && !customSubPurpose.trim()) {
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
                subPurpose: selectedSubPurpose === 'Others' ? customSubPurpose.trim() : selectedSubPurpose,
              });
              router.push('/auth');
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
      subPurpose: selectedSubPurpose === 'Others' ? customSubPurpose.trim() : selectedSubPurpose,
    });
    router.navigate('/user-details');
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
          <FlatList
            horizontal
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.productCard, selectedProductId === item.id && styles.productCardActive]}
                onPress={() => { setSelectedProductId(item.id); setSelectedSize(null); }}
              >
                <Image source={item.image} style={styles.productImage} contentFit="contain" transition={200} />
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productCarousel}
            style={{ marginBottom: Spacing.lg }}
          />
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
            <View style={styles.sizeGrid}>
              {selectedProduct.sizes.map(s => (
                <Pressable
                  key={s}
                  onPress={() => setSelectedSize(s)}
                  style={[styles.sizeButton, selectedSize === s && styles.sizeButtonActive]}
                >
                  <Text style={[styles.sizeButtonText, selectedSize === s && styles.sizeButtonTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Purpose</Text>
          <View style={styles.segmentedControl}>
            {PURPOSES.map((p, index) => (
              <Pressable
                key={p.id}
                style={[
                  styles.segment,
                  index === 0 && styles.segmentFirst,
                  index === PURPOSES.length - 1 && styles.segmentLast,
                  selectedPurpose === p.id && styles.segmentActive
                ]}
                onPress={() => handlePurposeSelect(p.id)}
              >
                <Text style={[
                  styles.segmentText,
                  selectedPurpose === p.id && styles.segmentTextActive
                ]}>
                  {p.label}
                </Text>
              </Pressable>
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
                {loadingSubPurposes ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={{ marginTop: 8, fontSize: FontSize.sm, color: Colors.textMedium }}>Loading options...</Text>
                  </View>
                ) : subPurposes.length > 0 ? (
                  subPurposes.map(sub => (
                    <Pressable
                      key={sub}
                      style={[styles.dropdownItem, selectedSubPurpose === sub && styles.dropdownItemActive]}
                      onPress={() => { setSelectedSubPurpose(sub); setDropdownOpen(false); if (sub !== 'Others') setCustomSubPurpose(''); }}
                    >
                      <Text style={[styles.dropdownItemText, selectedSubPurpose === sub && styles.dropdownItemTextActive]}>{sub}</Text>
                      {selectedSubPurpose === sub ? <MaterialIcons name="check" size={16} color={Colors.primary} /> : null}
                    </Pressable>
                  ))
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: FontSize.sm, color: Colors.textMedium }}>No options available</Text>
                  </View>
                )}
              </View>
            ) : null}
            {selectedSubPurpose === 'Others' ? (
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
              <MaterialIcons name="remove" size={24} color={Colors.white} />
            </Pressable>
            <TextInput style={styles.stepInput} value={quantityInput} onChangeText={handleQuantityChange} onBlur={handleQuantityBlur} keyboardType="number-pad" selectTextOnFocus />
            <Pressable style={styles.stepBtn} onPress={() => { const n = quantity + 1; setQuantity(n); setQuantityInput(n.toString()); }}>
              <MaterialIcons name="add" size={24} color={Colors.white} />
            </Pressable>
          </View>
        </View>

        {selectedProduct ? (
          <View style={styles.priceCard}>
            <Text style={styles.label}>Price Summary</Text>
            <View style={[styles.priceRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>₹{total.toLocaleString()}</Text></View>
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                * Additional charges such as delivery fee, GST, and other applicable taxes will be communicated separately.
              </Text>
            </View>
          </View>
        ) : null}

        <Button label="Continue" onPress={handleContinue} fullWidth size="lg" disabled={!selectedProduct || !selectedSize || !selectedPurpose || !selectedSubPurpose} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  productCarousel: { paddingRight: Spacing.lg },
  productCard: { 
    width: 200, 
    height: 210, 
    backgroundColor: Colors.white, 
    borderRadius: Radius.lg, 
    borderWidth: 3, 
    borderColor: Colors.borderLight, 
    padding: Spacing.md, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productCardActive: { 
    borderColor: Colors.primary, 
    backgroundColor: Colors.primaryLight,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  productImage: { width: 140, height: 140, marginBottom: 12 },
  productName: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textDark, textAlign: 'center' },
  section: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textDark, marginBottom: 10 },
  pillRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8,
    justifyContent: 'space-between',
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeButton: {
    width: '31%',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  sizeButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textMedium,
  },
  sizeButtonTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.bgLight,
    borderRadius: Radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: 'transparent',
  },
  segmentFirst: {
    borderTopLeftRadius: Radius.pill,
    borderBottomLeftRadius: Radius.pill,
  },
  segmentLast: {
    borderTopRightRadius: Radius.pill,
    borderBottomRightRadius: Radius.pill,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textMedium,
  },
  segmentTextActive: {
    color: Colors.white,
  },
  dropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14 },
  dropdownText: { flex: 1, fontSize: FontSize.body, color: Colors.textDark },
  placeholderText: { color: Colors.textLight },
  dropdownMenu: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.md, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  dropdownItemActive: { backgroundColor: Colors.primaryLight },
  dropdownItemText: { fontSize: FontSize.body, color: Colors.textDark },
  dropdownItemTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  stepBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: Colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepInput: { 
    fontSize: FontSize.xl, 
    fontWeight: FontWeight.bold, 
    color: Colors.textDark, 
    minWidth: 100, 
    textAlign: 'center', 
    backgroundColor: Colors.white, 
    borderWidth: 1, 
    borderColor: Colors.borderLight, 
    borderRadius: Radius.md, 
    paddingVertical: 12, 
    paddingHorizontal: 16 
  },
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
  disclaimerBox: { 
    marginTop: Spacing.md, 
    paddingTop: Spacing.md, 
    borderTopWidth: 1, 
    borderTopColor: Colors.borderLight 
  },
  disclaimerText: { 
    fontSize: FontSize.xs, 
    color: '#DC2626', // Red color
    lineHeight: 18,
    fontStyle: 'italic'
  },
});
