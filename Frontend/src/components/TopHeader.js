import React, { useState, useEffect } from 'react';
import { Dropdown, Avatar, Button } from 'antd';
import { MoonOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const TopHeader = ({ onToggleSidebar, currentPage }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});

  // Initialize and listen for localStorage changes
  useEffect(() => {
    // Initial load
    const loadUserData = () => {
      const data = JSON.parse(localStorage.getItem('user') || '{}');
      setUserData(data);
    };

    loadUserData();

    // Listen for storage events (when other components update localStorage)
    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events if needed
    window.addEventListener('userDataUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleStorageChange);
    };
  }, []);

  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div className="px-2 py-1 flex items-center space-x-3">
          <Avatar 
            size="large" 
            src={userData.avatar} 
            icon={!userData.avatar && <UserOutlined />}
            className="border-2 border-gray-200"
          />
          <div>
            <div className="font-semibold">
              <span className="font-bold">{userData.name || 'Driver'}</span> <span className="text-green-500 ml-1">Pro</span>
            </div>
            <div className="text-gray-500 text-sm">{userData.email || 'driver@email.com'}</div>
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile')
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    },
  ];

  // Custom Hamburger Icon
  const HamburgerIcon = () => (
    <div className="w-6 h-6 flex flex-col justify-between cursor-pointer">
      <div className="w-full h-0.5 bg-white rounded"></div>
      <div className="w-full h-0.5 bg-white rounded"></div>
      <div className="w-full h-0.5 bg-white rounded"></div>
    </div>
  );

  return (
    <header className="app-header bg-gradient-to-r from-blue-400 to-purple-500 px-4 sm:px-6 py-3 flex justify-between items-center shadow-md">
      {/* Left side - Logo, Name, Hamburger */}
      <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
        <img 
          src="/logo.jpg" 
          alt="Logo" 
          className="h-8 w-auto"
        />
        {/* ERP Name - Hidden on mobile, visible on sm screens and up */}
        <div className="text-white text-lg font-bold hidden sm:block">
          ERP
        </div>
        <div 
          onClick={onToggleSidebar}
          className="cursor-pointer p-2 hover:bg-blue-300 rounded-lg transition-colors"
        >
          <HamburgerIcon />
        </div>
      </div>

      {/* Center - Dynamic Page Title */}
      <div className="flex-1 flex justify-center">
        <div className="text-white text-lg font-semibold">
          {currentPage}
        </div>
      </div>

      {/* Right side - Moon Icon and Avatar */}
      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 justify-end">
        <Button 
          type="text" 
          icon={<MoonOutlined />} 
          className="text-white hover:bg-white hover:bg-opacity-20 hidden sm:flex"
        />
        
        <Dropdown 
          menu={{ items: userMenuItems }} 
          placement="bottomRight"
          trigger={['click']}
        >
          <div 
            className="flex items-center cursor-pointer bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 transition-all"
            onClick={(e) => e.preventDefault()}
          >
            <Avatar 
              size="default" 
              src={userData.avatar} 
              icon={!userData.avatar && <UserOutlined />}
              className="border-2 border-white"
            />
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

export default TopHeader;