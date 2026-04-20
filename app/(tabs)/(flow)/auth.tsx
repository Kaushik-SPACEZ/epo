import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Logo } from '@/components/feature/Logo';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { validateEmail } from '@/utils/validation';
import { api } from '@/services/api';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signIn, signUp, isLoading, user } = useAuth();
  const { showAlert } = useAlert();

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (!user) {
          router.dismiss();
        }
      };
    }, [user, router])
  );

  const [tab, setTab] = useState<'signin' | 'signup'>(
    params.tab === 'signup' ? 'signup' : 'signin'
  );

  // Update tab when params change
  useEffect(() => {
    if (params.tab === 'signup') {
      setTab('signup');
    } else if (params.tab === 'signin') {
      setTab('signin');
    }
  }, [params.tab]);

  // Sign In state
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');

  // Sign Up state
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');

  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Send OTP to email for sign-up verification
  const handleSendOtp = async () => {
    if (!suEmail) {
      showAlert('Email Required', 'Please enter your email address first');
      return;
    }
    if (!validateEmail(suEmail)) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await api.auth.sendOtp({ email: suEmail });
      if (response.success) {
        setOtpSent(true);
        setShowOtpModal(true);
        showAlert('OTP Sent', `A 6-digit verification code has been sent to ${suEmail}. It will expire in 10 minutes.`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || 'Failed to send OTP. Please try again.';
      showAlert('Error', errorMessage);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      showAlert('Invalid OTP', 'Please enter a valid OTP code');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await api.auth.verifyOtp({ identifier: suEmail, otp });
      if (response.success) {
        setIsEmailVerified(true);
        setShowOtpModal(false);
        setOtp('');
        showAlert('Success', 'Email verified successfully!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Invalid OTP. Please try again.';
      showAlert('Verification Failed', errorMessage);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSignIn = async () => {
    if (!siEmail || !siPassword) {
      showAlert('Missing Fields', 'Please enter email and password');
      return;
    }
    if (!validateEmail(siEmail)) {
      showAlert('Invalid Email', 'Please enter a valid email address (e.g. name@example.com)');
      return;
    }
    const ok = await signIn(siEmail, siPassword);
    if (ok) {
      router.back();
    } else {
      showAlert('Sign In Failed', 'Invalid credentials. Please try again.');
    }
  };

  const handleSignUp = async () => {
    // Check for empty fields
    if (!suName || !suEmail || !suPhone || !suPassword || !suConfirm) {
      showAlert('Missing Fields', 'Please fill all required fields');
      return;
    }

    // Check email verification
    if (!isEmailVerified) {
      showAlert('Email Not Verified', 'Please verify your email address before signing up');
      return;
    }
    
    // Validate name
    if (suName.trim().length < 2) {
      showAlert('Invalid Name', 'Name must be at least 2 characters long');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(suName)) {
      showAlert('Invalid Name', 'Name should only contain letters and spaces');
      return;
    }
    
    // Validate email
    if (!validateEmail(suEmail)) {
      showAlert('Invalid Email', 'Please enter a valid email address (e.g. name@example.com)');
      return;
    }
    
    // Validate phone
    const phoneDigits = suPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      showAlert('Invalid Phone', 'Phone number must be exactly 10 digits');
      return;
    }
    if (!/^[6-9]/.test(phoneDigits)) {
      showAlert('Invalid Phone', 'Phone number must start with 6, 7, 8, or 9');
      return;
    }
    
    // Validate password
    if (suPassword.length < 8) {
      showAlert('Weak Password', 'Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(suPassword)) {
      showAlert('Weak Password', 'Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(suPassword)) {
      showAlert('Weak Password', 'Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(suPassword)) {
      showAlert('Weak Password', 'Password must contain at least one number');
      return;
    }
    
    // Check password match
    if (suPassword !== suConfirm) {
      showAlert('Password Mismatch', 'Passwords do not match');
      return;
    }
    
    try {
      const ok = await signUp(suName, suEmail, suPhone, suPassword);
      if (ok) {
        router.back();
      } else {
        showAlert('Sign Up Failed', 'Please check your details and try again.');
      }
    } catch (error: any) {
      // Display specific backend error message
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Please check your details and try again.';
      
      // Check for specific duplicate errors
      if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
        showAlert('Email Already Registered', 'This email is already registered. Please use a different email or sign in.');
      } else if (errorMessage.toLowerCase().includes('phone') && errorMessage.toLowerCase().includes('already')) {
        showAlert('Phone Already Registered', 'This phone number is already registered. Please use a different number or sign in.');
      } else {
        showAlert('Sign Up Failed', errorMessage);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerLogoContainer}>
            <Logo />
          </View>
          <Text style={styles.headerTitle}>
            {tab === 'signin' ? 'Welcome' : 'Create Account'}
          </Text>
          <View style={styles.headerLogoContainer} />
        </View>



        {/* Form */}
        <View style={styles.form}>
          {tab === 'signin' ? (
            <>
              <FormInput
                label="Email Address"
                required
                icon="email"
                placeholder="Enter your email"
                value={siEmail}
                onChangeText={setSiEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormInput
                label="Password"
                required
                icon="lock"
                placeholder="Enter your password"
                value={siPassword}
                onChangeText={setSiPassword}
                isPassword
              />
              <Pressable style={styles.forgotLink} onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
              <Button
                label="Sign In"
                onPress={handleSignIn}
                fullWidth
                loading={isLoading}
                style={styles.submitBtn}
              />
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Don't have an account? </Text>
                <Pressable onPress={() => setTab('signup')}>
                  <Text style={styles.switchLink}>Sign Up</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <FormInput
                label="Full Name"
                required
                icon="person"
                placeholder="Enter your full name"
                value={suName}
                onChangeText={setSuName}
              />
              <View>
                <FormInput
                  label="Email Address"
                  required
                  icon="email"
                  placeholder="Enter your email"
                  value={suEmail}
                  onChangeText={(text) => {
                    setSuEmail(text);
                    setIsEmailVerified(false);
                    setOtpSent(false);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Pressable
                  style={[
                    styles.verifyButton,
                    isEmailVerified && styles.verifyButtonSuccess
                  ]}
                  onPress={handleSendOtp}
                  disabled={isSendingOtp || isEmailVerified}
                >
                  {isSendingOtp ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : isEmailVerified ? (
                    <Text style={styles.verifyButtonText}>Verified</Text>
                  ) : (
                    <Text style={styles.verifyButtonText}>Send OTP</Text>
                  )}
                </Pressable>
              </View>
              <FormInput
                label="Phone Number"
                required
                icon="phone"
                placeholder="Enter your phone number"
                value={suPhone}
                onChangeText={setSuPhone}
                keyboardType="phone-pad"
              />
              <FormInput
                label="Password"
                required
                icon="lock"
                placeholder="Create a password"
                value={suPassword}
                onChangeText={setSuPassword}
                isPassword
              />
              <FormInput
                label="Confirm Password"
                required
                icon="lock"
                placeholder="Confirm your password"
                value={suConfirm}
                onChangeText={setSuConfirm}
                isPassword
              />
              <Button
                label="Sign Up"
                onPress={handleSignUp}
                fullWidth
                loading={isLoading}
                style={styles.submitBtn}
              />
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Already have an account? </Text>
                <Pressable onPress={() => setTab('signin')}>
                  <Text style={styles.switchLink}>Sign In</Text>
                </Pressable>
              </View>
            </>
          )}


        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowOtpModal(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Email</Text>
              <Pressable onPress={() => setShowOtpModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textDark} />
              </Pressable>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter the 4-6 digit code sent to {suEmail}
            </Text>

            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <Button
              label="Verify OTP"
              onPress={handleVerifyOtp}
              fullWidth
              loading={isVerifyingOtp}
              style={styles.verifyOtpButton}
            />

            <Pressable onPress={handleSendOtp} disabled={isSendingOtp}>
              <Text style={styles.resendText}>
                {isSendingOtp ? 'Sending...' : 'Resend OTP'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPage,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
    minHeight: 56,
  },
  headerLogoContainer: {
    width: 34,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textDark,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  switchText: {
    fontSize: FontSize.sm,
    color: Colors.textMedium,
  },
  switchLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  form: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    padding: Spacing.lg,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    marginTop: -4,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  submitBtn: {
    marginTop: 4,
  },
  verifyButton: {
    position: 'absolute',
    right: 8,
    top: 34,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  verifyButtonSuccess: {
    backgroundColor: '#10b981',
  },
  verifyButtonText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
  },
  modalDescription: {
    fontSize: FontSize.sm,
    color: Colors.textMedium,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '400',
    marginBottom: Spacing.lg,
    color: Colors.textMedium,
  },
  verifyOtpButton: {
    marginBottom: Spacing.md,
  },
  resendText: {
    textAlign: 'center',
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    paddingVertical: Spacing.sm,
  },
});
