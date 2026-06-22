import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase/client';

interface AnalyticsData {
  userGrowth: { date: string; count: number }[];
  weddingGrowth: { date: string; count: number }[];
  roleDistribution: { role: string; count: number }[];
  budgetStats: {
    total: number;
    average: number;
    highest: number;
    lowest: number;
  };
  taskCompletion: {
    total: number;
    completed: number;
    percentage: number;
  };
  rsvpStats: {
    invited: number;
    attending: number;
    declined: number;
    pending: number;
  };
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    weddingGrowth: [],
    roleDistribution: [],
    budgetStats: { total: 0, average: 0, highest: 0, lowest: 0 },
    taskCompletion: { total: 0, completed: 0, percentage: 0 },
    rsvpStats: { invited: 0, attending: 0, declined: 0, pending: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      // User growth over time
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true });

      const userGrowth = processGrowthData(users || [], 'created_at');

      // Wedding growth over time
      const { data: weddings } = await supabase
        .from('weddings')
        .select('created_at')
        .order('created_at', { ascending: true });

      const weddingGrowth = processGrowthData(weddings || [], 'created_at');

      // Role distribution
      const { data: roles } = await supabase
        .from('profiles')
        .select('role');

      const roleDistribution = processRoleDistribution(roles || []);

      // Budget stats
      const { data: budgetData } = await supabase
        .from('weddings')
        .select('budget');

      const budgetStats = processBudgetStats(budgetData || []);

      // Task completion
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status');

      const taskCompletion = processTaskCompletion(tasks || []);

      // RSVP stats
      const { data: guests } = await supabase
        .from('guests')
        .select('rsvp_status');

      const rsvpStats = processRsvpStats(guests || []);

      setAnalytics({
        userGrowth,
        weddingGrowth,
        roleDistribution,
        budgetStats,
        taskCompletion,
        rsvpStats,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function processGrowthData(data: any[], dateField: string) {
    const monthlyData: { [key: string]: number } = {};
    
    data.forEach((item) => {
      const date = new Date(item[dateField]);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = (monthlyData[key] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function processRoleDistribution(users: any[]) {
    const distribution: { [key: string]: number } = {};
    
    users.forEach((user) => {
      distribution[user.role] = (distribution[user.role] || 0) + 1;
    });

    return Object.entries(distribution).map(([role, count]) => ({ role, count }));
  }

  function processBudgetStats(weddings: any[]) {
    const budgets = weddings
      .map((w) => w.budget)
      .filter((b) => b !== null && b !== undefined);

    if (budgets.length === 0) {
      return { total: 0, average: 0, highest: 0, lowest: 0 };
    }

    const total = budgets.reduce((sum, b) => sum + b, 0);
    return {
      total,
      average: total / budgets.length,
      highest: Math.max(...budgets),
      lowest: Math.min(...budgets),
    };
  }

  function processTaskCompletion(tasks: any[]) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }

  function processRsvpStats(guests: any[]) {
    return {
      invited: guests.length,
      attending: guests.filter((g) => g.rsvp_status === 'attending').length,
      declined: guests.filter((g) => g.rsvp_status === 'declined').length,
      pending: guests.filter((g) => g.rsvp_status === 'invited' || g.rsvp_status === 'opened').length,
    };
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Platform Analytics</Text>
        <Text style={styles.subtitle}>Key metrics and insights</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Growth</Text>
        {analytics.userGrowth.length === 0 ? (
          <Text style={styles.emptyText}>No data available</Text>
        ) : (
          analytics.userGrowth.slice(-6).map((item) => (
            <View key={item.date} style={styles.growthItem}>
              <Text style={styles.growthDate}>{item.date}</Text>
              <Text style={styles.growthCount}>+{item.count} users</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Role Distribution</Text>
        {analytics.roleDistribution.map((item) => (
          <View key={item.role} style={styles.roleItem}>
            <Text style={styles.roleName}>{item.role.toUpperCase()}</Text>
            <View style={styles.roleBarContainer}>
              <View 
                style={[
                  styles.roleBar, 
                  { 
                    width: `${(item.count / analytics.userGrowth.length) * 100}%`,
                    backgroundColor: getRoleColor(item.role),
                  },
                ]} 
              />
            </View>
            <Text style={styles.roleCount}>{item.count}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Statistics</Text>
        <StatRow label="Total Budget" value={`UGX ${analytics.budgetStats.total.toLocaleString()}`} />
        <StatRow label="Average Budget" value={`UGX ${Math.round(analytics.budgetStats.average).toLocaleString()}`} />
        <StatRow label="Highest Budget" value={`UGX ${analytics.budgetStats.highest.toLocaleString()}`} />
        <StatRow label="Lowest Budget" value={`UGX ${analytics.budgetStats.lowest.toLocaleString()}`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task Completion</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {analytics.taskCompletion.completed} / {analytics.taskCompletion.total} tasks completed
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${analytics.taskCompletion.percentage}%` }]} 
            />
          </View>
          <Text style={styles.progressPercentage}>{analytics.taskCompletion.percentage}%</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RSVP Statistics</Text>
        <StatRow label="Total Invited" value={analytics.rsvpStats.invited.toString()} />
        <StatRow label="Attending" value={analytics.rsvpStats.attending.toString()} color="#96CEB4" />
        <StatRow label="Declined" value={analytics.rsvpStats.declined.toString()} color="#FF6B6B" />
        <StatRow label="Pending" value={analytics.rsvpStats.pending.toString()} color="#FFEAA7" />
      </View>
    </ScrollView>
  );
}

function StatRow({ 
  label, 
  value, 
  color = '#333' 
}: { 
  label: string; 
  value: string; 
  color?: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'superadmin':
      return '#FF6B6B';
    case 'planner':
      return '#4ECDC4';
    case 'vendor':
      return '#45B7D1';
    case 'guest':
      return '#96CEB4';
    default:
      return '#FFEAA7';
  }
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
  growthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  growthDate: {
    fontSize: 14,
    color: '#666',
  },
  growthCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    width: 80,
  },
  roleBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  roleBar: {
    height: '100%',
    borderRadius: 4,
  },
  roleCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 40,
    textAlign: 'right',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    paddingVertical: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});
