import { useTheme } from '@/shared/hooks/use-theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export function usePersonalInfoValidation() {
  const router = useRouter();
  const theme = useTheme();

  const { lastName, firstName, phone, updateProfile } = useAuthStore();
  const [lastNameError, setLastNameError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleNextStep = () => {
    setLastNameError('');
    setFirstNameError('');
    setPhoneError('');

    let isValid = true;

    if (!lastName.trim()) {
      setLastNameError('Please enter your last name.');
      isValid = false;
    }

    if (!firstName.trim()) {
      setFirstNameError('Please enter your first name.');
      isValid = false;
    }

    if (!phone.trim()) {
      setPhoneError('Please enter your phone number.');
      isValid = false;
    } else if (!/^9\d{9}$/.test(phone)) {
      setPhoneError('Please enter a valid 10-digit Philippine mobile number.');
      isValid = false;
    }
    if (!isValid) return;
    router.push('/(profile)/vehicle-info');
  };
  return { handleNextStep };
}
