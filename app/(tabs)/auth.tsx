import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Logo } from '@/components/feature/Logo';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { validateEmail } from '@/utils/validation';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signIn, signUp, isLoading } = useAuth();
  const { showAlert } = useAlert();

  const [tab, setTab] = useState<'signin' | 'signup'>(
    params.tab === 'signup' ? 'signup' : 'signin'
  );

  // Sign In state
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');

  // Sign Up state
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');

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
    if (!suName || !suEmail || !suPhone || !suPassword || !suConfirm) {
      showAlert('Missing Fields', 'Please fill all required fields');
      return;
    }
    if (!validateEmail(suEmail)) {
      showAlert('Invalid Email', 'Please enter a valid email address (e.g. name@example.com)');
      return;
    }
    if (suPassword !== suConfirm) {
      showAlert('Password Mismatch', 'Passwords do not match');
      return;
    }
    if (suPassword.length < 8) {
      showAlert('Weak Password', 'Password must be at least 8 characters');
      return;
    }
    const ok = await signUp(suName, suEmail, suPhone, suPassword);
    if (ok) {
      router.back();
    } else {
      showAlert('Sign Up Failed', 'Please check your details and try again.');
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
              <FormInput
                label="Email Address"
                required
                icon="email"
                placeholder="Enter your email"
                value={suEmail}
                onChangeText={setSuEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
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

});
