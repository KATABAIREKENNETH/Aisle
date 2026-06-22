import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase/client';

interface DashboardStats {
  totalUsers: number;
  totalWeddings: number;
  totalGuests: number;
  totalTasks: number;
  totalBudget: number;
  recentActivity: any[];
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalWeddings: 0,
    totalGuests: 0,
    totalTasks: 0,
    totalBudget: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    try {
      const [usersCount, weddingsCount, guestsCount, tasksCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('weddings').select('*', { count: 'exact', head: true }),
        supabase.from('guests').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
      ]);

      const { data: weddings } = await supabase.from('weddings').select('budget');
      const totalBudget = weddings?.reduce((sum, w) => sum + (w.budget || 0), 0) || 0;

      const { data: activity } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalUsers: usersCount.count || 0,
        totalWeddings: weddingsCount.count || 0,
        totalGuests: guestsCount.count || 0,
        totalTasks: tasksCount.count || 0,
        totalBudget,
        recentActivity: activity || [],
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Superadmin Dashboard</Text>
        <Text style={styles.subtitle}>Platform Overview</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Total Users" value={stats.totalUsers} color="#4ECDC4" />
        <StatCard title="Total Weddings" value={stats.totalWeddings} color="#FF6B6B" />
        <StatCard title="Total Guests" value={stats.totalGuests} color="#45B7D1" />
        <StatCard title="Total Tasks" value={stats.totalTasks} color="#96CEB4" />
        <StatCard 
          title="Total Budget" 
          value={`UGX ${stats.totalBudget.toLocaleString()}`} 
          color="#FFEAA7" 
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {stats.recentActivity.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity</Text>
        ) : (
          stats.recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <Text style={styles.activityAction}>{activity.action}</Text>
              <Text style={styles.activityTime}>
                {new Date(activity.created_at).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  activityItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityAction: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
});
