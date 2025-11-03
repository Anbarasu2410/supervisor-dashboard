// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Tasks from './components/Tasks';
import TaskDetails from './pages/TaskDetails';
import PickupConfirmation from './pages/pickupConfirmation';
import DropConfirmation from './pages/DropConfirmation';
import TripSummary from './pages/TripSummary';
import TripHistory from './pages/TripHistory';
import DriverProfile from './pages/DriverProfile';
import TopHeader from './components/TopHeader';
import SideNav from './components/SideNav';
import { Layout } from 'antd';

const { Content } = Layout;

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Component to get current page title based on route
const CurrentPageTitle = () => {
  const location = useLocation();
  
  const getPageTitle = (pathname) => {
    if (pathname === '/driver/tasks' || pathname === '/tasks') return 'My Tasks';
    if (pathname === '/driver/trip-history') return 'Trip History';
    if (pathname === '/profile') return 'Profile';
    if (pathname.includes('/driver/tasks/') && pathname.includes('/pickup')) return 'Pickup Confirmation';
    if (pathname.includes('/driver/tasks/') && pathname.includes('/drop')) return 'Drop Confirmation';
    if (pathname.includes('/driver/tasks/') && pathname.includes('/summary')) return 'Trip Summary';
    if (pathname.includes('/driver/tasks/')) return 'Task Details';
    return 'My Tasks';
  };

  return getPageTitle(location.pathname);
};

// Layout component for protected routes
const AppLayout = ({ children, sidebarCollapsed, onToggleSidebar, onCloseSidebar }) => {
  return (
    <Layout className="min-h-screen relative">
      {/* Sidebar - Fixed position, overlays content */}
      <SideNav 
        collapsed={sidebarCollapsed} 
        onClose={onCloseSidebar}
      />
      
      {/* Main content - Always full width */}
      <Layout className="w-full">
        <TopHeader 
          onToggleSidebar={onToggleSidebar} 
          currentPage={<CurrentPageTitle />}
        />
        <Content className="bg-gray-50 min-h-screen w-full">
          {children}
        </Content>
      </Layout>
      
      {/* Overlay when sidebar is open - for mobile */}
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
          
          {/* Protected routes */}
          <Route 
            path="/tasks" 
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

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/driver/tasks" replace />} />
          <Route path="*" element={<Navigate to="/driver/tasks" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;