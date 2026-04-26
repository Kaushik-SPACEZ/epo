import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/feature/Logo';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/template';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import api from '@/services/api';
import { validateEmail, isEmail } from '@/utils/validation';

type ResetStep = 'email' | 'otp' | 'new_password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [step, setStep] = useState<ResetStep>('email');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when screen comes into focus (when navigating back)
  useFocusEffect(
    useCallback(() => {
      // Reset all fields when screen gains focus
      setStep('email');
      setIdentifier('');
      setOtp('');
      setNewPassword('');
      setResetToken('');
    }, [])
  );

  const handleSendOTP = async () => {
    if (!identifier) {
      showAlert('Error', 'Please enter your email or phone number');
      return;
    }
    if (isEmail(identifier) && !validateEmail(identifier)) {
      showAlert('Invalid Email', 'Please enter a valid email address (e.g. name@example.com)');
      return;
    }
    setLoading(true);
    try {
      // Determine if identifier is email or phone
      const isEmailIdentifier = identifier.includes('@');
      const payload = isEmailIdentifier 
        ? { email: identifier, purpose: 'password_reset' } 
        : { phone: identifier, purpose: 'password_reset' };
      
      const response = await api.auth.forgotPassword(payload);
      
      if (response.success) {
        showAlert('Success', 'OTP sent successfully! Check your phone/email.');
        setStep('otp');
      } else {
        showAlert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('[Forgot Password] Send OTP error:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4 || otp.length > 6) {
      showAlert('Error', 'Please enter a valid 6 digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.auth.verifyOtp({
        identifier,
        otp,
        purpose: 'password_reset',
      });
      
      if (response.success) {
        // Store reset token if provided by backend
        if (response.data?.reset_token) {
          setResetToken(response.data.reset_token);
        }
        showAlert('Success', 'OTP verified successfully!');
        setStep('new_password');
      } else {
        showAlert('Error', response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('[Forgot Password] Verify OTP error:', error);
      showAlert('Error', error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters');
      return;
    }
    
    if (!resetToken) {
      showAlert('Error', 'Reset token is missing. Please verify OTP again.');
      return;
    }
    
    setLoading(true);
    try {
      // The reset token needs to be sent in the Authorization header
      const response = await api.auth.resetPassword({
        new_password: newPassword,
        confirm_password: newPassword,
      }, resetToken);
      
      if (response.success) {
        showAlert('Success', 'Password has been reset successfully!');
        router.navigate('/auth');
      } else {
        showAlert('Error', response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('[Forgot Password] Reset password error:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Logo align="center" />
        </View>

        <View style={styles.card}>
          {step === 'email' && (
            <>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email or phone number and we'll send you an OTP to reset your password.
              </Text>
              <FormInput
                label="Email or Phone Number"
                placeholder="Enter email or phone number"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
              <Button
                label="Send OTP"
                onPress={handleSendOTP}
                loading={loading}
                fullWidth
                style={styles.actionBtn}
              />
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={styles.title}>Enter OTP</Text>
              <Text style={styles.subtitle}>
                We've sent a verification code to {identifier}.
              </Text>
              <FormInput
                label="OTP"
                placeholder="Enter 6 digit code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button
                label="Verify OTP"
                onPress={handleVerifyOTP}
                loading={loading}
                fullWidth
                style={styles.actionBtn}
              />
            </>
          )}

          {step === 'new_password' && (
            <>
              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.subtitle}>
                Your new password must be different from previous used passwords.
              </Text>
              <FormInput
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Button
                label="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                style={styles.actionBtn}
              />
            </>
          )}

          <Button
            label="Back to Sign In"
            onPress={() => {
              setStep('email');
              setIdentifier('');
              setOtp('');
              setNewPassword('');
              setResetToken('');
              router.push('/auth');
            }}
            variant="ghost"
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPage,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.textMedium,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  actionBtn: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
});