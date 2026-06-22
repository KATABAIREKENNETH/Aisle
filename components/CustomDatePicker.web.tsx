import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

interface CustomDatePickerProps {
  date: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  placeholder?: string;
  style?: any;
}

export default function CustomDatePicker({ date, onDateChange, placeholder = 'YYYY-MM-DD', style }: CustomDatePickerProps) {
  return (
    <View style={[styles.container, style]}>
      {/* @ts-ignore */}
      <input
        type="date"
        value={date}
        onChange={(e: any) => onDateChange(e.target.value)}
        style={{
          width: '100%',
          backgroundColor: theme.colors.surface.raised,
          border: 'none',
          outline: 'none',
          fontSize: 15,
          color: theme.text,
          padding: 14,
          borderRadius: 12,
          fontFamily: 'inherit',
          boxSizing: 'border-box'
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
