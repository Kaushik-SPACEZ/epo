import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, Modal, Animated, BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useOrder } from '@/hooks/useOrder';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { ScreenHeader } from '@/components/feature/ScreenHeader';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
type UserType = 'customer' | 'dealer';
type FormMode = 'view' | 'edit' | 'new';

interface CData {
  name: string; email: string; phone: string;
  address: string; city: string; pincode: string;
}
interface DData {
  bizName: string; contact: string; email: string; phone: string;
  udyam: string; address: string; city: string; pincode: string; gst: string;
}
interface DetailSet {
  id: string;
  userType: UserType;
  c: CData;
  d: DData;
}

const EMPTY_C: CData = { name: '', email: '', phone: '', address: '', city: '', pincode: '' };
const EMPTY_D: DData = { bizName: '', contact: '', email: '', phone: '', udyam: '', address: '', city: '', pincode: '', gst: '' };

// ─── Validation ───────────────────────────────────────────────────────────────
function validateEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim()); }
function validatePhone(p: string) { return /^\d{10}$/.test(p.trim()); }
function validatePincode(p: string) { return /^\d{6}$/.test(p.trim()); }

// ─── Set display label ────────────────────────────────────────────────────────
function getSetLabel(set: DetailSet): { name: string; sub: string } {
  if (set.userType === 'customer') {
    return {
      name: set.c.name || 'Unnamed Profile',
      sub: set.c.phone ? set.c.phone : '—',
    };
  }
  return {
    name: set.d.bizName || 'Unnamed Business',
    sub: set.d.phone ? set.d.phone : '—',
  };
}

// ─── InfoRow (read-only) ──────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  const missing = !value;
  return (
    <View style={IR.row}>
      <Text style={IR.label}>{label}</Text>
      <Text style={[IR.value, missing && IR.missing]}>
        {missing ? '—' : value}
      </Text>
    </View>
  );
}
const IR = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  label: { fontSize: FontSize.sm, color: Colors.textMedium, flex: 1 },
  value: { fontSize: FontSize.sm, color: Colors.textDark, fontWeight: FontWeight.medium, flex: 1.5, textAlign: 'right' },
  missing: { color: Colors.textLight },
});

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ visible, message }: { visible: boolean; message: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 250, useNativeDriver: true }).start();
  }, [visible]);
  return (
    <Animated.View style={[TT.wrap, { opacity }]} pointerEvents="none">
      <MaterialIcons name="check-circle" size={18} color="#fff" />
      <Text style={TT.text}>{message}</Text>
    </Animated.View>
  );
}
const TT = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 110, alignSelf: 'center', backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: Radius.pill, elevation: 12, zIndex: 9999 },
  text: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});

// ─── Saved Profiles Bottom Sheet ──────────────────────────────────────────────
interface SheetProps {
  visible: boolean;
  sets: DetailSet[];
  activeIdx: number;
  onClose: () => void;
  onSelectSet: (idx: number) => void;
  onEditSet: (idx: number) => void;
  onAddNew: () => void;
}

function ProfilesSheet({ visible, sets, activeIdx, onClose, onSelectSet, onEditSet, onAddNew }: SheetProps) {
  const slideY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 13 }).start();
    } else {
      Animated.timing(slideY, { toValue: 500, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={SH.backdrop} onPress={onClose} />
      <Animated.View style={[SH.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={SH.handle} />
        <Text style={SH.title}>Saved Profiles</Text>
        <Text style={SH.subtitle}>Tap a profile to use it, or edit with the pencil icon</Text>

        {/* List of saved profiles */}
        <ScrollView style={SH.list} showsVerticalScrollIndicator={false} bounces={false}>
          {sets.map((set, idx) => {
            const { name, sub } = getSetLabel(set);
            const isActive = idx === activeIdx;
            return (
              <View key={set.id} style={[SH.setRow, isActive && SH.setRowActive]}>
                {/* Tap to select */}
                <Pressable style={SH.setMain} onPress={() => onSelectSet(idx)}>
                  <View style={[SH.avatar, isActive && SH.avatarActive]}>
                    <MaterialIcons
                      name={set.userType === 'customer' ? 'person' : 'business'}
                      size={20}
                      color={isActive ? '#fff' : Colors.primary}
                    />
                  </View>
                  <View style={SH.setInfo}>
                    <Text style={[SH.setName, isActive && SH.setNameActive]} numberOfLines={1}>{name}</Text>
                    <View style={SH.subRow}>
                      {sub !== '—' && <MaterialIcons name="phone" size={12} color={Colors.textMedium} />}
                      <Text style={SH.setSub} numberOfLines={1}>{sub}</Text>
                    </View>
                  </View>
                  {isActive && <MaterialIcons name="check-circle" size={22} color={Colors.primary} />}
                </Pressable>

                {/* Edit icon — separate pressable so it doesn't trigger select */}
                <Pressable style={SH.editBtn} onPress={() => onEditSet(idx)} hitSlop={10}>
                  <MaterialIcons name="edit" size={18} color={Colors.textMedium} />
                </Pressable>
              </View>
            );
          })}

          {/* Add New Details */}
          <Pressable style={SH.addRow} onPress={onAddNew}>
            <View style={SH.addIcon}>
              <MaterialIcons name="add" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={SH.addTitle}>Enter New Details</Text>
              <Text style={SH.addSub}>Add a new profile from scratch</Text>
            </View>
          </Pressable>
        </ScrollView>

        <Pressable style={SH.dismissBtn} onPress={onClose}>
          <Text style={SH.dismissText}>Dismiss</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const SH = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 36, paddingHorizontal: Spacing.lg, paddingTop: 14,
  },
  handle: { width: 44, height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textDark, marginBottom: 4 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMedium, marginBottom: Spacing.md },
  list: { maxHeight: 380 },

  // Profile row
  setRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.borderLight,
    backgroundColor: Colors.bgPage, marginBottom: 10, overflow: 'hidden',
  },
  setRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  setMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarActive: { backgroundColor: Colors.primary },
  setInfo: { flex: 1 },
  setName: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textDark },
  setNameActive: { color: Colors.primary },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  setSub: { fontSize: FontSize.xs, color: Colors.textMedium },

  // Edit button (right side of each row)
  editBtn: {
    paddingHorizontal: 14, paddingVertical: 20,
    borderLeftWidth: 1, borderLeftColor: Colors.borderGray,
    backgroundColor: 'transparent',
  },

  // Add new row
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.primaryBorder,
    borderStyle: 'dashed', backgroundColor: Colors.primaryLight, marginBottom: 10,
  },
  addIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  addTitle: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.primary },
  addSub: { fontSize: FontSize.xs, color: Colors.textMedium, marginTop: 2 },

  dismissBtn: { paddingVertical: 14, alignItems: 'center' },
  dismissText: { fontSize: FontSize.body, color: Colors.textMedium, fontWeight: FontWeight.medium },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UserDetailsScreen() {
  const router = useRouter();
  const { setCurrentCustomer } = useOrder();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  // Build the initial profile from user account data
  const initC: CData = { name: user?.name || '', email: user?.email || '', phone: user?.phone || '', address: '', city: '', pincode: '' };
  const initD: DData = { bizName: '', contact: user?.name || '', email: user?.email || '', phone: user?.phone || '', udyam: '', address: '', city: '', pincode: '', gst: '' };
  const initialSet: DetailSet = { id: '0', userType: 'customer', c: initC, d: initD };

  // ── State ─────────────────────────────────────────────────────────────────
  const [sets, setSets] = useState<DetailSet[]>([initialSet]);   // all saved profiles
  const [activeIdx, setActiveIdx] = useState(0);                  // currently selected profile
  const [mode, setMode] = useState<FormMode>('view');
  const [editingIdx, setEditingIdx] = useState<number | null>(null); // null = adding new
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Working form fields (used only in edit/new mode)
  const [userType, setUserType] = useState<UserType>('customer');
  const [c, setC] = useState<CData>(initC);
  const [d, setD] = useState<DData>(initD);

  const isEditing = mode === 'edit' || mode === 'new';
  const activeSet = sets[activeIdx];

  // ── Show toast helper ─────────────────────────────────────────────────────
  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  // ── Sheet: select a saved profile ─────────────────────────────────────────
  const handleSelectSet = (idx: number) => {
    setActiveIdx(idx);
    setMode('view');
    setSheetOpen(false);
  };

  // ── Sheet: edit a specific saved profile ──────────────────────────────────
  const handleEditSet = (idx: number) => {
    const set = sets[idx];
    setEditingIdx(idx);
    setUserType(set.userType);
    setC({ ...set.c });
    setD({ ...set.d });
    setMode('edit');
    setErrors({});
    setSheetOpen(false);
  };

  // ── Sheet: add brand-new profile ─────────────────────────────────────────
  const handleAddNew = () => {
    setEditingIdx(null);
    setUserType(sets[activeIdx].userType);
    setC({ ...EMPTY_C });
    setD({ ...EMPTY_D });
    setMode('new');
    setErrors({});
    setSheetOpen(false);
  };

  // ── Save (edit or new) ────────────────────────────────────────────────────
  const handleSave = () => {
    const errs: Record<string, string> = {};

    if (userType === 'customer') {
      if (c.name.length < 3)       errs.cName    = 'Name must be at least 3 characters';
      if (!validateEmail(c.email)) errs.cEmail   = 'Enter a valid email address';
      if (!validatePhone(c.phone)) errs.cPhone   = 'Enter a valid 10-digit phone number';
      if (c.address.length < 10)   errs.cAddress = 'Address must be at least 10 characters';
      if (c.city.length < 3)       errs.cCity    = 'Enter a valid city name';
      if (!validatePincode(c.pincode)) errs.cPincode = 'Enter a valid 6-digit pincode';
    } else {
      if (d.bizName.length < 3)    errs.dBizName = 'Business name must be at least 3 characters';
      if (d.contact.length < 3)    errs.dContact = 'Contact person required';
      if (!validateEmail(d.email)) errs.dEmail   = 'Enter a valid email address';
      if (!validatePhone(d.phone)) errs.dPhone   = 'Enter a valid 10-digit phone number';
      if (d.udyam.length !== 12)   errs.dUdyam   = 'UDYAM number must be 12 characters';
      if (d.address.length < 10)   errs.dAddress = 'Address must be at least 10 characters';
      if (d.city.length < 3)       errs.dCity    = 'Enter a valid city name';
      if (!validatePincode(d.pincode)) errs.dPincode = 'Enter a valid 6-digit pincode';
      if (d.gst && d.gst.length !== 15) errs.dGst = 'GST number must be 15 characters';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      showAlert('Validation Error', 'Please correct the highlighted fields.');
      return;
    }

    const newSet: DetailSet = {
      id: editingIdx !== null ? sets[editingIdx].id : Date.now().toString(),
      userType,
      c: { ...c },
      d: { ...d },
    };

    let newSets: DetailSet[];
    let newActive: number;

    if (editingIdx !== null) {
      // Update existing profile in-place
      newSets = sets.map((s, i) => i === editingIdx ? newSet : s);
      newActive = editingIdx;
      showToast('Profile updated successfully');
    } else {
      // Append new profile
      newSets = [...sets, newSet];
      newActive = newSets.length - 1;
      showToast('New profile saved successfully');
    }

    setSets(newSets);
    setActiveIdx(newActive);
    setMode('view');
    setEditingIdx(null);
  };

  // ── Cancel editing ────────────────────────────────────────────────────────
  const handleCancel = () => {
    setMode('view');
    setEditingIdx(null);
    setErrors({});
  };

  // ── Continue to summary ───────────────────────────────────────────────────
  const handleContinue = () => {
    const set = sets[activeIdx];
    const t = set.userType;

    const incomplete = t === 'customer'
      ? (!set.c.name || !set.c.email || !set.c.phone || !set.c.address || !set.c.city || !set.c.pincode)
      : (!set.d.bizName || !set.d.contact || !set.d.email || !set.d.phone || !set.d.udyam || !set.d.address || !set.d.city || !set.d.pincode);

    if (incomplete) {
      showAlert('Incomplete Details', 'Please complete your profile details to continue.');
      handleEditSet(activeIdx);
      return;
    }

    if (t === 'customer') {
      setCurrentCustomer({ type: 'customer', name: set.c.name, email: set.c.email, phone: set.c.phone, address: set.c.address, city: set.c.city, pincode: set.c.pincode });
    } else {
      setCurrentCustomer({
        type: 'dealer', name: set.d.contact, email: set.d.email, phone: set.d.phone,
        address: set.d.address, city: set.d.city, pincode: set.d.pincode,
        businessName: set.d.bizName, contactPerson: set.d.contact,
        udyamNumber: set.d.udyam, gstNumber: set.d.gst || undefined,
      });
    }
    router.push('/order-summary');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const displayType = isEditing ? userType : activeSet.userType;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1, backgroundColor: Colors.bgPage }}>
        <ScreenHeader title="Your Details" showLogo />

        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── User type cards ────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>I am a</Text>
          <View style={styles.typeRow}>
            {(['customer', 'dealer'] as UserType[]).map(t => {
              const active = displayType === t;
              return (
                <Pressable
                  key={t}
                  style={[styles.typeCard, active && styles.typeCardActive]}
                  onPress={() => {
                    if (isEditing) {
                      setUserType(t);
                    } else {
                      // In view mode: switch the active set's userType directly
                      setSets(prev => prev.map((s, i) => i === activeIdx ? { ...s, userType: t } : s));
                    }
                  }}
                >
                  <MaterialIcons name={t === 'customer' ? 'person' : 'business'} size={32} color={active ? Colors.primary : Colors.textMedium} />
                  <Text style={[styles.typeTitle, active && styles.typeTitleActive]}>
                    {t === 'customer' ? 'Customer' : 'Dealer'}
                  </Text>
                  <Text style={styles.typeSub}>{t === 'customer' ? 'For personal use' : 'For business'}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Edit mode banner ───────────────────────────────────────────── */}
          {isEditing && (
            <View style={styles.editBanner}>
              <MaterialIcons name={mode === 'new' ? 'add-circle' : 'edit'} size={16} color={Colors.primary} />
              <Text style={styles.editBannerText}>
                {mode === 'new'
                  ? 'Creating new profile — fill all required fields'
                  : `Editing profile ${(editingIdx ?? 0) + 1} of ${sets.length}`}
              </Text>
            </View>
          )}

          {/* ── Form card ──────────────────────────────────────────────────── */}
          <View style={[styles.formCard, isEditing && styles.formCardEditing]}>

            {/* Card header */}
            <View style={styles.formHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formTitle}>
                  {displayType === 'customer' ? 'Customer Details' : 'Dealer Details'}
                </Text>
                  {isEditing && (
                  <Text style={styles.editingTag}>
                    {mode === 'new' ? 'New profile' : 'Editing'}
                  </Text>
                )}
              </View>

              {!isEditing && (
                <Pressable style={styles.changeBtn} onPress={() => setSheetOpen(true)}>
                  <MaterialIcons name="edit" size={14} color={Colors.primary} />
                  <Text style={styles.changeBtnText}>Change</Text>
                </Pressable>
              )}
            </View>

            {/* ── VIEW MODE — read-only rows ─────────────────────────────── */}
            {!isEditing && activeSet.userType === 'customer' && (
              <>
                <InfoRow label="Full Name"        value={activeSet.c.name} />
                <InfoRow label="Email Address"    value={activeSet.c.email} />
                <InfoRow label="Phone Number"     value={activeSet.c.phone} />
                <InfoRow label="Delivery Address" value={activeSet.c.address} />
                <InfoRow label="City"             value={activeSet.c.city} />
                <InfoRow label="Pincode"          value={activeSet.c.pincode} />
              </>
            )}
            {!isEditing && activeSet.userType === 'dealer' && (
              <>
                <InfoRow label="Business Name"  value={activeSet.d.bizName} />
                <InfoRow label="Contact Person" value={activeSet.d.contact} />
                <InfoRow label="Email"          value={activeSet.d.email} />
                <InfoRow label="Phone"          value={activeSet.d.phone} />
                <InfoRow label="UDYAM Number"   value={activeSet.d.udyam} />
                <InfoRow label="Address"        value={activeSet.d.address} />
                <InfoRow label="City"           value={activeSet.d.city} />
                <InfoRow label="Pincode"        value={activeSet.d.pincode} />
                {activeSet.d.gst ? <InfoRow label="GST Number" value={activeSet.d.gst} /> : null}
              </>
            )}

            {/* Quick-edit button for active profile */}
            {!isEditing && (
              <Pressable style={styles.quickEditBtn} onPress={() => handleEditSet(activeIdx)}>
                <MaterialIcons name="edit" size={15} color={Colors.primary} />
                <Text style={styles.quickEditText}>Edit this profile</Text>
              </Pressable>
            )}

            {/* ── EDIT / NEW MODE — editable inputs ─────────────────────── */}
            {isEditing && userType === 'customer' && (
              <>
                <FormInput label="Full Name" required icon="person" placeholder="Enter your full name" value={c.name} onChangeText={v => setC(p => ({ ...p, name: v }))} error={errors.cName} />
                <FormInput label="Email Address" required icon="email" placeholder="Enter your email" value={c.email} onChangeText={v => setC(p => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" error={errors.cEmail} />
                <FormInput label="Phone Number" required icon="phone" placeholder="10-digit phone number" value={c.phone} onChangeText={v => setC(p => ({ ...p, phone: v }))} keyboardType="phone-pad" error={errors.cPhone} />
                <FormInput label="Delivery Address" required icon="location-on" placeholder="Enter your delivery address" value={c.address} onChangeText={v => setC(p => ({ ...p, address: v }))} error={errors.cAddress} multiline numberOfLines={2} />
                <FormInput label="City" required icon="location-city" placeholder="Enter your city" value={c.city} onChangeText={v => setC(p => ({ ...p, city: v }))} error={errors.cCity} />
                <FormInput label="Pincode" required icon="local-post-office" placeholder="6-digit pincode" value={c.pincode} onChangeText={v => setC(p => ({ ...p, pincode: v }))} keyboardType="number-pad" error={errors.cPincode} />
              </>
            )}
            {isEditing && userType === 'dealer' && (
              <>
                <FormInput label="Business Name" required icon="business" placeholder="Enter business name" value={d.bizName} onChangeText={v => setD(p => ({ ...p, bizName: v }))} error={errors.dBizName} />
                <FormInput label="Contact Person" required icon="person" placeholder="Contact person name" value={d.contact} onChangeText={v => setD(p => ({ ...p, contact: v }))} error={errors.dContact} />
                <FormInput label="Business Email" required icon="email" placeholder="Business email" value={d.email} onChangeText={v => setD(p => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" error={errors.dEmail} />
                <FormInput label="Business Phone" required icon="phone" placeholder="10-digit phone" value={d.phone} onChangeText={v => setD(p => ({ ...p, phone: v }))} keyboardType="phone-pad" error={errors.dPhone} />
                <FormInput label="UDYAM Number" required icon="tag" placeholder="12-character UDYAM" value={d.udyam} onChangeText={v => setD(p => ({ ...p, udyam: v }))} autoCapitalize="characters" maxLength={12} error={errors.dUdyam} helperText="12-character UDYAM registration number" />
                <FormInput label="Business Address" required icon="location-on" placeholder="Enter business address" value={d.address} onChangeText={v => setD(p => ({ ...p, address: v }))} error={errors.dAddress} multiline numberOfLines={2} />
                <FormInput label="City" required icon="location-city" placeholder="Enter city" value={d.city} onChangeText={v => setD(p => ({ ...p, city: v }))} error={errors.dCity} />
                <FormInput label="Pincode" required icon="local-post-office" placeholder="6-digit pincode" value={d.pincode} onChangeText={v => setD(p => ({ ...p, pincode: v }))} keyboardType="number-pad" error={errors.dPincode} />
                <FormInput label="GST Number" icon="description" placeholder="GST number (optional)" value={d.gst} onChangeText={v => setD(p => ({ ...p, gst: v }))} autoCapitalize="characters" maxLength={15} error={errors.dGst} />
              </>
            )}

            {/* Save / Cancel buttons */}
            {isEditing && (
              <View style={styles.editActions}>
                <Button label="Cancel" onPress={handleCancel} variant="secondary" style={styles.actionBtn} />
                <Button label="Save Profile" onPress={handleSave} style={styles.actionBtn} />
              </View>
            )}
          </View>

          {/* Continue button — only in view mode */}
          {!isEditing && (
            <Button
              label="Continue to Summary"
              onPress={handleContinue}
              fullWidth size="lg"
              style={{ marginTop: Spacing.lg }}
            />
          )}
        </ScrollView>

        {/* Profiles bottom sheet */}
        <ProfilesSheet
          visible={sheetOpen}
          sets={sets}
          activeIdx={activeIdx}
          onClose={() => setSheetOpen(false)}
          onSelectSet={handleSelectSet}
          onEditSet={handleEditSet}
          onAddNew={handleAddNew}
        />

        {/* Toast notification */}
        <Toast visible={toast.visible} message={toast.message} />
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sectionLabel: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textDark, marginBottom: 12 },

  typeRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg },
  typeCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.borderLight, padding: Spacing.lg, alignItems: 'center', gap: 6 },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeTitle: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textMedium },
  typeTitleActive: { color: Colors.textDark },
  typeSub: { fontSize: FontSize.xs, color: Colors.textMedium },

  editBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primaryBorder },
  editBannerText: { fontSize: FontSize.sm, color: Colors.primary, flex: 1 },

  formCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderGray, padding: Spacing.lg },
  formCardEditing: { borderColor: Colors.primary, borderWidth: 1.5 },

  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  formTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.textDark },
  editingTag: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 3 },

  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryLight, borderRadius: Radius.sm, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.primaryBorder },
  changeBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  quickEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: Spacing.lg, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryLight },
  quickEditText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  editActions: { flexDirection: 'row', gap: 12, marginTop: Spacing.xl },
  actionBtn: { flex: 1 },
});
