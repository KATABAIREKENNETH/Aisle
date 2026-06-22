// Script to check performance metrics from the database
// Run with: node scripts/check-performance.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPerformanceMetrics() {
  console.log('Fetching performance metrics...\n');

  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching performance metrics:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No performance metrics found in the database.');
    console.log('\nTo start tracking performance, add the usePerformanceTracking hook to your pages.');
    return;
  }

  console.log(`Found ${data.length} performance metrics:\n`);

  // Group by screen name
  const byScreen = {};
  data.forEach(metric => {
    const screen = metric.screen_name || 'unknown';
    if (!byScreen[screen]) {
      byScreen[screen] = [];
    }
    byScreen[screen].push(metric);
  });

  // Display metrics grouped by screen
  Object.keys(byScreen).forEach(screen => {
    console.log(`📱 ${screen}`);
    console.log('─'.repeat(50));
    
    const screenMetrics = byScreen[screen];
    const loadTimes = screenMetrics
      .filter(m => m.load_time_ms)
      .map(m => m.load_time_ms);
    
    if (loadTimes.length > 0) {
      const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      const minLoadTime = Math.min(...loadTimes);
      const maxLoadTime = Math.max(...loadTimes);
      
      console.log(`Load Times (ms):`);
      console.log(`  Average: ${avgLoadTime.toFixed(2)}ms`);
      console.log(`  Min: ${minLoadTime.toFixed(2)}ms`);
      console.log(`  Max: ${maxLoadTime.toFixed(2)}ms`);
      console.log(`  Samples: ${loadTimes.length}`);
    }

    // Show recent individual metrics
    console.log(`\nRecent metrics:`);
    screenMetrics.slice(0, 5).forEach(metric => {
      const time = new Date(metric.timestamp).toLocaleString();
      console.log(`  - ${metric.metric_name} (${metric.metric_type}): ${metric.value} ${metric.unit || ''}`);
      if (metric.load_time_ms) console.log(`    Load time: ${metric.load_time_ms}ms`);
      console.log(`    Time: ${time}`);
    });
    
    console.log('');
  });

  // Overall statistics
  const allLoadTimes = data
    .filter(m => m.load_time_ms)
    .map(m => m.load_time_ms);
  
  if (allLoadTimes.length > 0) {
    console.log('📊 Overall Statistics');
    console.log('─'.repeat(50));
    const avgLoadTime = allLoadTimes.reduce((a, b) => a + b, 0) / allLoadTimes.length;
    const minLoadTime = Math.min(...allLoadTimes);
    const maxLoadTime = Math.max(...allLoadTimes);
    
    console.log(`Average page load time: ${avgLoadTime.toFixed(2)}ms`);
    console.log(`Fastest page load: ${minLoadTime.toFixed(2)}ms`);
    console.log(`Slowest page load: ${maxLoadTime.toFixed(2)}ms`);
    console.log(`Total measurements: ${allLoadTimes.length}`);
  }
}

checkPerformanceMetrics().catch(console.error);
