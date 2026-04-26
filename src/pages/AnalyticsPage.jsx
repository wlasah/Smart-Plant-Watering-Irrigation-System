import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import StatsCard from '../components/StatsCard';
import UserEngagement from '../components/UserEngagement';
import PlantHealthTrends from '../components/PlantHealthTrends';
import WateringAnalytics from '../components/WateringAnalytics';
import CommunicationCenter from '../components/CommunicationCenter';
import BatchOperations from '../components/BatchOperations';
import ReportingDashboard from '../components/ReportingDashboard';
import { adminAPI, plantsAPI, historyAPI } from '../services/api';
import '../styles/AnalyticsPage.css';

const AnalyticsPage = () => {
  const [plants, setPlants] = useState([]);
  const [wateringHistory, setWateringHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  // Load plants, watering history, users, and activity log from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log('[ANALYTICS] Starting data fetch...');
        console.log('[ANALYTICS] Auth token:', localStorage.getItem('auth_token')?.substring(0, 10) + '...');
        
        // Load current user first
        const user = JSON.parse(localStorage.getItem('currentUser'));
        console.log('[ANALYTICS] Current user:', user);
        setCurrentUser(user);
        
        const isAdmin = user && (user.is_staff || user.role === 'admin');
        console.log('[ANALYTICS] Is admin:', isAdmin);
        
        // Fetch plants from API - use different endpoint if admin
        console.log('[ANALYTICS] Fetching plants from API...');
        let plantsData;
        if (isAdmin) {
          console.log('[ANALYTICS] Using admin endpoint to fetch all plants...');
          plantsData = await adminAPI.getAllPlants();
        } else {
          console.log('[ANALYTICS] Using user endpoint to fetch own plants...');
          plantsData = await plantsAPI.getAll();
        }
        
        // Ensure plantsData is an array (handle pagination)
        const plantsList = Array.isArray(plantsData) ? plantsData : (plantsData?.results || plantsData?.data || []);
        if (!Array.isArray(plantsList)) {
          console.warn('[ANALYTICS] Plants data is not an array:', plantsData);
          setPlants([]);
          return;
        }
        
        console.log('[ANALYTICS] Plants fetched:', plantsList.length, plantsList);
        
        const mappedPlants = plantsList.map(plant => ({
          id: plant.id,
          name: plant.name,
          type: plant.type,
          location: plant.location,
          moistureLevel: plant.moisture,
          lastWatered: plant.last_watered,
          description: plant.description,
        }));
        setPlants(mappedPlants);

        // Fetch watering history from API - use different endpoint if admin
        console.log('[ANALYTICS] Fetching watering history...');
        let historyData;
        if (isAdmin) {
          console.log('[ANALYTICS] Using admin endpoint to fetch all watering history...');
          historyData = await historyAPI.getAllHistoryAdmin();
        } else {
          console.log('[ANALYTICS] Using user endpoint to fetch own watering history...');
          historyData = await historyAPI.getHistory();
        }
        
        // Ensure historyData is an array (handle pagination)
        let historyList = Array.isArray(historyData) ? historyData : (historyData?.results || historyData?.data || []);
        if (!Array.isArray(historyList)) {
          console.warn('[ANALYTICS] History data is not an array:', historyData);
          setWateringHistory([]);
          historyList = [];
        }
        
        console.log('[ANALYTICS] Watering history fetched:', historyList.length, historyList);
        
        const mappedHistory = historyList.map(entry => ({
          id: entry.id,
          plant_id: entry.plant_id,
          watering_date: entry.watered_at,
          notes: entry.notes,
        }));
        setWateringHistory(mappedHistory);

        // Fetch users from API
        console.log('[ANALYTICS] Fetching users...');
        const usersData = await adminAPI.getAllUsers();
        
        // Handle paginated responses
        const usersList = Array.isArray(usersData) ? usersData : (usersData?.results || usersData?.data || []);
        console.log('[ANALYTICS] Users fetched:', usersList.length, usersList);
        setUsers(usersList);

        // Activity log - no API endpoint yet
        setActivityLog([]);
      } catch (err) {
        console.error('[ANALYTICS] Error loading data from API:', err);
        console.error('[ANALYTICS] Full error:', JSON.stringify(err, null, 2));
        // Set empty defaults - no localStorage fallback
        setPlants([]);
        setWateringHistory([]);
        setUsers([]);
        setActivityLog([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate overall statistics - DYNAMIC based on moisture level
  const totalPlants = plants.length;
  const healthyPlants = plants.filter(p => p.moistureLevel >= 50).length;
  const needsAttention = plants.filter(p => p.moistureLevel < 50).length;
  const avgMoisture = plants.length > 0 
    ? Math.round(plants.reduce((sum, p) => sum + p.moistureLevel, 0) / plants.length)
    : 0;
  const maxMoisture = plants.length > 0 
    ? Math.max(...plants.map(p => p.moistureLevel))
    : 0;
  const minMoisture = plants.length > 0 
    ? Math.min(...plants.map(p => p.moistureLevel))
    : 0;

  // Calculate water usage trend from real data
  const getTrendData = () => {
    const now = new Date();
    let daysBack = 7; // default: week
    let dataPoints = 7;
    
    if (timeRange === 'month') {
      daysBack = 30;
      dataPoints = 30;
    } else if (timeRange === 'year') {
      daysBack = 365;
      dataPoints = 52;
    }

    const trendArray = new Array(dataPoints).fill(0);
    
    wateringHistory.forEach(event => {
      const eventDate = new Date(event.watering_date);
      const daysAgo = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
      
      if (daysAgo < daysBack) {
        const index = Math.floor(daysAgo / (daysBack / dataPoints));
        if (index >= 0 && index < dataPoints) {
          trendArray[dataPoints - 1 - index]++;
        }
      }
    });
    
    return trendArray.map(count => Math.max(count * 10, 0)); // Scale for visual display
  };

  // Calculate plant health distribution
  const healthDistribution = {
    excellent: plants.filter(p => p.moistureLevel >= 70 && p.moistureLevel <= 90).length,
    goodCondition: plants.filter(p => p.moistureLevel >= 50 && p.moistureLevel < 70).length,
    needsWatering: plants.filter(p => p.moistureLevel >= 30 && p.moistureLevel < 50).length,
    critical: plants.filter(p => p.moistureLevel < 30).length
  };

  const plantsByLocation = {};
  plants.forEach(plant => {
    plantsByLocation[plant.location] = (plantsByLocation[plant.location] || 0) + 1;
  });

  // Calculate total watering events
  const totalWateringEvents = wateringHistory.length;

  return (
    <div className="admin-page-wrapper">
      <AdminSidebar currentUser={currentUser} onLogout={() => {}} />
      <div className="analytics-page">
        <header className="analytics-header">
          <h1>📊 Analytics & Reports</h1>
          <p>Track plant health trends, user engagement, and system performance</p>
        </header>

      {/* Tab Navigation */}
      <div className="analytics-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'engagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('engagement')}
        >
          User Engagement
        </button>
        <button 
          className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          Plant Health
        </button>
        <button 
          className={`tab-btn ${activeTab === 'watering' ? 'active' : ''}`}
          onClick={() => setActiveTab('watering')}
        >
          Watering Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'communication' ? 'active' : ''}`}
          onClick={() => setActiveTab('communication')}
        >
          Communications
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <section className="analytics-section">
            <h2>Overall System Health</h2>
            <div className="analytics-metrics-grid">
          <StatsCard 
            title="Total Plants" 
            value={totalPlants}
            icon="🌱"
          />
          <StatsCard 
            title="Healthy" 
            value={healthyPlants}
            color="healthy"
            icon="✅"
          />
          <StatsCard 
            title="Attention Needed" 
            value={needsAttention}
            color="attention"
            icon="⚠️"
          />
          <StatsCard 
            title="Avg Moisture" 
            value={`${avgMoisture}%`}
            color="moisture"
            icon="💧"
          />
          <StatsCard 
            title="Max Moisture" 
            value={`${maxMoisture}%`}
            color="moisture"
            icon="📈"
          />
          <StatsCard 
            title="Min Moisture" 
            value={`${minMoisture}%`}
            color="moisture"
            icon="📉"
          />
          <StatsCard 
            title="Total Waterings" 
            value={totalWateringEvents}
            color="healthy"
            icon="💦"
          />
          <StatsCard 
            title="Active Users" 
            value={users.length}
            color="healthy"
            icon="👥"
          />
        </div>
      </section>

      {/* Water Usage Trend Section */}
      <section className="analytics-section">
        <div className="analytics-section-header">
          <h2>Water Usage Trend</h2>
          <div className="time-range-selector">
            <button 
              className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              Week
            </button>
            <button 
              className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              Month
            </button>
            <button 
              className={`time-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => setTimeRange('year')}
            >
              Year
            </button>
          </div>
        </div>

        <div className="analytics-chart">
          <div className="chart-container">
            <svg className="line-chart" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
              {/* Y-axis line */}
              <line x1="40" y1="20" x2="40" y2="260" stroke="#ccc" strokeWidth="2" />
              
              {/* X-axis line */}
              <line x1="40" y1="260" x2="780" y2="260" stroke="#ccc" strokeWidth="2" />

              {/* Grid lines and data points */}
              {getTrendData().map((value, index) => {
                const trendArray = getTrendData();
                const x = 80 + (index * (700 / (Math.max(trendArray.length - 1, 1))));
                const maxValue = Math.max(...trendArray, 1); // Ensure at least 1 to avoid NaN
                const y = 260 - (value / maxValue) * 230;
                
                // Skip rendering if y is invalid
                if (!isFinite(y)) return null;
                
                return (
                  <g key={index}>
                    {/* Grid line */}
                    <line x1="40" y1={y} x2="780" y2={y} stroke="#f0f0f0" strokeWidth="1" />
                    
                    {/* Data point circle */}
                    <circle cx={x} cy={y} r="4" fill="#06b6d4" />
                    
                    {/* Value label */}
                    <text x={x} y={y - 12} textAnchor="middle" fontSize="11" fill="#666">
                      {value}
                    </text>
                  </g>
                );
              })}

              {/* Connecting line */}
              {getTrendData().map((value, index) => {
                if (index === 0) return null;
                const trendArray = getTrendData();
                const x1 = 80 + ((index - 1) * (700 / (Math.max(trendArray.length - 1, 1))));
                const x2 = 80 + (index * (700 / (Math.max(trendArray.length - 1, 1))));
                const maxValue = Math.max(...trendArray, 1); // Ensure at least 1 to avoid NaN
                const y1 = 260 - (trendArray[index - 1] / maxValue) * 230;
                const y2 = 260 - (value / maxValue) * 230;
                
                // Skip rendering if coordinates are invalid
                if (!isFinite(y1) || !isFinite(y2)) return null;
                
                return (
                  <line key={`line-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#06b6d4" strokeWidth="2" />
                );
              })}

              {/* Y-axis labels */}
              <text x="25" y="265" fontSize="11" fill="#666">0</text>
              <text x="15" y="25" fontSize="11" fill="#666">{isFinite(Math.max(...getTrendData())) ? Math.max(...getTrendData()) : 0}</text>
            </svg>
          </div>
          <p className="chart-label">Water Usage (ml) - {timeRange}</p>
        </div>
      </section>

      {/* Health Distribution Section */}
      <section className="analytics-section">
        <h2>Plant Health Distribution</h2>
        <div className="health-distribution">
          <div className="health-item">
            <div className="health-color excellent"></div>
            <div className="health-info">
              <span>Excellent (70-90%)</span>
              <strong>{healthDistribution.excellent} plants</strong>
            </div>
          </div>
          <div className="health-item">
            <div className="health-color good"></div>
            <div className="health-info">
              <span>Good (50-70%)</span>
              <strong>{healthDistribution.goodCondition} plants</strong>
            </div>
          </div>
          <div className="health-item">
            <div className="health-color warning"></div>
            <div className="health-info">
              <span>Needs Watering (30-50%)</span>
              <strong>{healthDistribution.needsWatering} plants</strong>
            </div>
          </div>
          <div className="health-item">
            <div className="health-color critical"></div>
            <div className="health-info">
              <span>Critical (&lt;30%)</span>
              <strong>{healthDistribution.critical} plants</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Plants by Location Section */}
      {Object.keys(plantsByLocation).length > 0 && (
        <section className="analytics-section">
          <h2>Plants by Location</h2>
          <div className="location-breakdown">
            {Object.entries(plantsByLocation).map(([location, count]) => (
              <div key={location} className="location-item">
                <span className="location-name">📍 {location}</span>
                <div className="location-bar">
                  <div 
                    className="location-bar-fill" 
                    style={{ width: `${(count / totalPlants) * 100}%` }}
                  ></div>
                </div>
                <span className="location-count">{count} plants</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Insights Section */}
      <section className="analytics-section insights">
        <h2>🔍 Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Most Watered</h4>
            <p>{getTrendData()[getTrendData().length - 1]} ml this {timeRange}</p>
          </div>
          <div className="insight-card">
            <h4>Health Score</h4>
            <p>{Math.round((healthyPlants / totalPlants) * 100)}% plants are healthy</p>
          </div>
          <div className="insight-card">
            <h4>Recommendation</h4>
            <p>{needsAttention > 0 
              ? `${needsAttention} plant${needsAttention > 1 ? 's' : ''} need attention`
              : 'All plants are doing great!'}
            </p>
          </div>
        </div>
      </section>
        </div>
      )}

      {activeTab === 'engagement' && (
        <UserEngagement users={users} activityLog={activityLog} />
      )}

      {activeTab === 'health' && (
        <PlantHealthTrends plants={plants} />
      )}

      {activeTab === 'watering' && (
        <WateringAnalytics wateringHistory={wateringHistory} plants={plants} />
      )}

      {activeTab === 'communication' && (
        <div className="communication-section">
          <CommunicationCenter users={users} />
          <BatchOperations users={users} plants={plants} />
        </div>
      )}

      {/* Advanced Reporting & Analytics */}
      <section style={{ marginTop: '3rem', borderTop: '2px solid #e0e0e0', paddingTop: '2rem' }}>
        <ReportingDashboard users={users} />
      </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;
