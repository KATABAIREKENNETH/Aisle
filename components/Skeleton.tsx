import { View, StyleSheet } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: any;
}

export function Skeleton({ width, height = 20, style }: SkeletonProps) {
  return (
    <View 
      style={[
        styles.skeleton,
        { width, height },
        style
      ]} 
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={60} height={60} style={styles.avatar} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={20} style={styles.title} />
        <Skeleton width="40%" height={16} style={styles.subtitle} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? '60%' : '100%'} 
          height={16}
          style={styles.textLine}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    borderRadius: 30,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 4,
  },
  list: {
    padding: 16,
  },
  textContainer: {
    padding: 16,
  },
  textLine: {
    marginBottom: 8,
  },
});
