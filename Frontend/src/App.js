// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Tasks from './components/Tasks';
import TaskDetails from './pages/TaskDetails';
import PickupConfirmation from './pages/pickupConfirmation';
import DropConfirmation from './pages/DropConfirmation';
import TripSummary from './pages/TripSummary';
import TripHistory from './pages/TripHistory';
import DriverProfile from './pages/DriverProfile';
import WorkerAttendance from "./pages/worker/WorkerAttendance.jsx";
import GeoFenceAttendance from './pages/attendance/GeoFenceAttendance';
import AttendanceHistory from './pages/attendance/AttendanceHistory';
import TaskAssignmentScreen from './pages/supervisor/TaskAssignmentScreen.jsx';
import MyTaskToday from  './pages/worker/MyTaskToday'

import TodayTrip from './pages/worker/TodayTrip';
import TopHeader from './components/TopHeader';
import SideNav from './components/SideNav';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard.jsx';
import WorkerTaskReviewToday from './pages/supervisor/WorkerTaskReviewToday.jsx';

import { Layout } from 'antd';
import SupervisorDailyProgress from './pages/supervisor/SupervisorDailyProgress.jsx';

const { Content } = Layout;

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return token && user?.role ? children : <Navigate to="/login" />;
};

const CurrentPageTitle = () => {
  const location = useLocation();
  
  const getPageTitle = (pathname) => {
    if (pathname === '/driver/tasks' || pathname === '/tasks') return 'My Tasks';
    if (pathname === '/driver/trip-history') return 'Trip History';
      if (pathname === '/attendance') return 'Attendance';
      if (pathname === '/attendance/history') return 'AttendanceHistory';
    if (pathname === '/worker/today-trip') return "Today's Trip";
      if (pathname === '/attendance') return 'Attendance';
      if (pathname === '/attendance/history') return 'AttendanceHistory';
    if (pathname === '/profile') return 'Profile';
    if (pathname.includes('/driver/tasks/') && pathname.includes('/pickup')) return 'Pickup Confirmation';
    if (pathname.includes('/driver/tasks/') && pathname.includes('/drop')) return 'Drop Confirmation';
    if (pathname.includes('/driver/tasks/') && pathname.includes('/summary')) return 'Trip Summary';
    if (pathname.includes('/driver/tasks/')) return 'Task Details';
    if (pathname === '/admin/tasks') return 'Admin Tasks';
if (pathname === '/boss/tasks') return 'Boss Tasks';
if (pathname === '/manager/tasks') return 'Manager Tasks';
if (pathname === '/supervisor/dashboard') return 'Supervisor Tasks';

    return 'My Tasks';
  };

  return getPageTitle(location.pathname);
};

const AppLayout = ({ children, sidebarCollapsed, onToggleSidebar, onCloseSidebar }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <Layout className="min-h-screen relative">
      <SideNav 
        collapsed={sidebarCollapsed} 
        onClose={onCloseSidebar}
        user={user}
      />
      
      <Layout className="w-full">
        <TopHeader 
          onToggleSidebar={onToggleSidebar} 
          currentPage={<CurrentPageTitle />}
          user={user}
        />
        <Content className="bg-gray-50 min-h-screen w-full main-content">
          {children}
        </Content>
      </Layout>
      
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}
    </Layout>
  );
};

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleCloseSidebar = () => {
    setSidebarCollapsed(true);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Driver Routes */}
          <Route 
            path="/driver/tasks" 
            element={
              <ProtectedRoute>
                <AppLayout 
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={handleToggleSidebar}
                  onCloseSidebar={handleCloseSidebar}
                >
                  <Tasks />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/driver/tasks/:taskId" 
            element={
              <ProtectedRoute>
                <AppLayout 
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={handleToggleSidebar}
                  onCloseSidebar={handleCloseSidebar}
                >
                  <TaskDetails />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/driver/tasks/:taskId/pickup" 
            element={
              <ProtectedRoute>
                <AppLayout 
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={handleToggleSidebar}
                  onCloseSidebar={handleCloseSidebar}
                >
                  <PickupConfirmation />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/driver/tasks/:taskId/drop" 
            element={
              <ProtectedRoute>
                <AppLayout 
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={handleToggleSidebar}
                  onCloseSidebar={handleCloseSidebar}
                >
                  <DropConfirmation />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/driver/tasks/:taskId/summary" 
            element={
              <ProtectedRoute>
                <AppLayout 
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={handleToggleSidebar}
                  onCloseSidebar={handleCloseSidebar}
                >
                  <TripSummary />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/driver/trip-history" 
            element={
              <ProtectedRoute>
                <AppLayout 
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={handleToggleSidebar}
                  onCloseSidebar={handleCloseSidebar}
                >
                  <TripHistory />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
  <Route 
            path="/worker/my-task" 
            element={
              <ProtectedRoute>
                <AppLayout 
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={handleToggleSidebar}
                  onCloseSidebar={handleCloseSidebar}
                >
                  <MyTaskToday />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          {/* Worker Routes */}
          <Route 
            path="/worker/today-trip" 
            element={
              <ProtectedRoute>
                <AppLayout 
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={handleToggleSidebar}
                  onCloseSidebar={handleCloseSidebar}
                >
                  <TodayTrip />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
         
          
         {/* <Route 
  path="/attendance" 
  element={
    <ProtectedRoute>
      <AppLayout 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <WorkerAttendance />
      </AppLayout>
    </ProtectedRoute>
  } 
/> */}
<Route 
  path="/attendance" 
  element={
    <ProtectedRoute>
      <AppLayout 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <GeoFenceAttendance />
      </AppLayout>
    </ProtectedRoute>
  } 
/>
<Route 
  path="/attendance/history" 
  element={
    <ProtectedRoute>
      <AppLayout 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <AttendanceHistory />
      </AppLayout>
    </ProtectedRoute>
  } 
/>
{/* Admin Tasks */}
<Route 
  path="/admin/tasks"
  element={
    <ProtectedRoute>
      <AppLayout 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <Tasks />
      </AppLayout>
    </ProtectedRoute>
  }
/>

{/* Boss Tasks */}
<Route 
  path="/boss/tasks"
  element={
    <ProtectedRoute>
      <AppLayout 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <Tasks />
      </AppLayout>
    </ProtectedRoute>
  }
/>

{/* Manager Tasks */}
<Route 
  path="/manager/tasks"
  element={
    <ProtectedRoute>
      <AppLayout 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <Tasks />
      </AppLayout>
    </ProtectedRoute>
  }
/>

{/* Supervisor Tasks */}
<Route 
  path="/supervisor/dashboard"
  element={
    <ProtectedRoute>
      <AppLayout 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <SupervisorDashboard />
      </AppLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/supervisor/tasks"
  element={
    <ProtectedRoute>
      <AppLayout
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <TaskAssignmentScreen />
      </AppLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/supervisor/tasks"
  element={
    <ProtectedRoute>
      <AppLayout
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <TaskAssignmentScreen />
      </AppLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/supervisor/review-tasks"
  element={
    <ProtectedRoute>
      <AppLayout
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <WorkerTaskReviewToday />
      </AppLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/supervisor/daily-progress"
  element={
    <ProtectedRoute>
      <AppLayout
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onCloseSidebar={handleCloseSidebar}
      >
        <SupervisorDailyProgress />
      </AppLayout>
    </ProtectedRoute>
  }
/>

          
          {/* Common Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <AppLayout 
                  sidebarCollapsed={sidebarCollapsed}
                  onToggleSidebar={handleToggleSidebar}
                  onCloseSidebar={handleCloseSidebar}
                >
                  <DriverProfile />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          {/* Default redirects based on role */}
          <Route path="/" element={<NavigateToRoleBasedRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

// Component to handle role-based default routing
const NavigateToRoleBasedRoute = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  switch(user?.role) {
    case 'driver':
      return <Navigate to="/driver/tasks" replace />;
    case 'worker':
      return <Navigate to="/worker/today-trip" replace />;
      
   
      case 'boss':
  return <Navigate to="/boss/tasks" replace />;

case 'manager':
  return <Navigate to="/manager/tasks" replace />;

case 'supervisor':
  return <Navigate to="/supervisor/dashboard" replace />;


case 'admin':
  return <Navigate to="/admin/tasks" replace />;

    default:
      return <Navigate to="/login" replace />;
  }
};

export default App;