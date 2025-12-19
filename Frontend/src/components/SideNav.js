// src/components/SideNav.jsx
import React from 'react';
import { Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CarOutlined,
  UserOutlined,
  HistoryOutlined,
  DoubleLeftOutlined,
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
  ProjectOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons';

const SideNav = ({ collapsed, onClose, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Role-based menu items
  const getMenuItems = () => {
    const commonItems = [
      {
        key: '/profile',
        icon: <UserOutlined />,
        label: 'Profile',
      },
    ];

    if (user?.role === 'driver') {
      return [
        {
          key: '/driver/tasks',
          icon: <DashboardOutlined />,
          label: 'My Tasks',
        },
        {
          key: '/driver/trip-history',
          icon: <HistoryOutlined />,
          label: 'Trip History',
        },
        {
      key: '/attendance',
      icon: <HistoryOutlined />,
      label: "Attendance",
    },
      {
      key: '/attendance/history',
      icon: <HistoryOutlined />,
      label: "AttendanceHistory",
    },
        ...commonItems
      ];
    }

    if (user?.role === 'worker') {
      return [
        {
          key: '/worker/today-trip',
          icon: <TeamOutlined />,
          label: "Today's Trip",
        },
          {
      key: '/attendance',
      icon: <HistoryOutlined />,
      label: "Attendance",
    },
     {
      key: '/attendance/history',
      icon: <HistoryOutlined />,
      label: "AttendanceHistory",
    },
    {
  key: '/worker/my-task',
  icon: <DeploymentUnitOutlined />,
  label: 'My Task Today',
},

    
        ...commonItems
      ];
    }

    // Only add for admin role
  

    // Add for other roles if they should also see it
    if ( user?.role === 'supervisor') {
      return [
        {
          key: '/supervisor/dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
        },
            { key: '/supervisor/tasks', icon: <ProjectOutlined />, label: 'Task Assignment' },
            {
  key: "/supervisor/review-tasks",
  icon: <DeploymentUnitOutlined />,
  label: "Task Review"
},
{
  key: "/supervisor/daily-progress",
  icon: <DeploymentUnitOutlined />,
  label: "Daily Progress"
},

        {
          key: '/profile',
          icon: <UserOutlined />,
          label: 'Profile',
        },
      ];
    }

    return commonItems;
  };

  const menuItems = getMenuItems();

  const handleMenuClick = ({ key }) => {
    console.log('Navigating to:', key);
    navigate(key);
    onClose();
  };

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getPortalTitle = () => {
    switch(user?.role) {
      case 'driver': return 'Driver Portal';
      case 'worker': return 'Worker Portal';
      case 'admin': return 'Admin Portal';
      case 'boss': return 'Boss Portal';
      case 'manager': return 'Manager Portal';
      case 'supervisor': return 'Supervisor Portal';
      default: return 'Portal';
    }
  };

  return (
    <>
      <div className={`
        fixed inset-y-0 left-0 z-50
        bg-white shadow-xl
        transform transition-transform duration-300 ease-in-out
        w-64
        ${collapsed ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* Header Section */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CarOutlined className="text-blue-600 text-lg" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-gray-800">{getPortalTitle()}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
          </div>
          
          <Button 
            type="text" 
            icon={<DoubleLeftOutlined />} 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1"
            size="small"
          />
        </div>

        {/* Menu Items */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-0 mt-2"
          onClick={handleMenuClick}
        />

        {/* Logout Button at Bottom */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="border-t border-gray-200 pt-4">
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 border-red-600"
              size="large"
            >
              LOGOUT
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideNav;