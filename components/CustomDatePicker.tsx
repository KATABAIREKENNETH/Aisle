import React, { useState } from 'react';
import { View, Text, Platform, StyleSheet, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../config/theme';

interface CustomDatePickerProps {
  date: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  placeholder?: string;
  style?: any;
}

export default function CustomDatePicker({ date, onDateChange, placeholder = 'YYYY-MM-DD', style }: CustomDatePickerProps) {
  const [show, setShow] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }

    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(dateObj.getTime() - userTimezoneOffset);
      const formattedDate = adjustedDate.toISOString().split('T')[0];
      onDateChange(formattedDate);
      
      if (Platform.OS === 'ios') {
        setShow(false);
      }
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable onPress={() => setShow(true)} style={styles.inputContainer}>
        <Text style={[styles.text, !date && styles.placeholderText]}>
          {date || placeholder}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={date ? new Date(date) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: theme.colors.surface.raised,
    borderRadius: 12,
    padding: 14,
  },
  text: {
    fontSize: 15,
    color: theme.text,
  },
  placeholderText: {
    color: theme.textDisabled,
  },
});
