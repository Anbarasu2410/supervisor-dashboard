// src/pages/worker/TodayTrip.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tag, 
  Spin, 
  Alert, 
  Button, 
  Empty,
  Typography,
  Divider,
  Collapse,
  Modal,
  Row,
  Col,
  Badge,
  Statistic,
  Avatar,
  Space,
  Grid
} from 'antd';
import { 
  ClockCircleOutlined, 
  ProjectOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  CarOutlined,
  TeamOutlined,
  CloseOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PhoneFilled
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Countdown } = Statistic;
const { useBreakpoint } = Grid;

const TodayTrip = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Responsive breakpoints
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isSmallMobile = !screens.sm;

  useEffect(() => {
    fetchTodayTrip();
  }, []);

  const fetchTodayTrip = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/worker/today-trip');
      
      if (response.data && response.data.success) {
        if (Array.isArray(response.data.data)) {
          setTrips(response.data.data);
        } else {
          setTrips(response.data.data ? [response.data.data] : []);
        }
      } else {
        setError(response.data?.message || 'No trip data received from server');
        setTrips([]);
      }
      
    } catch (err) {
      console.error('❌ Error fetching today trip:', err);
      if (err.response?.status === 404) {
        setError(err.response.data?.message || 'No trip assigned for today');
        setTrips([]);
      } else {
        const errorMessage = err.response?.data?.message || 
                            err.message || 
                            'Failed to load today\'s trip';
        setError(errorMessage);
        setTrips([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTodayTrip();
  };

  // Handle contact driver button click - show phone number directly
  const handleContactDriver = (trip) => {
    if (trip.driverContact && trip.driverContact !== 'N/A') {
      window.location.href = `tel:${trip.driverContact}`;
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      PLANNED: { color: 'blue', text: 'SCHEDULED', icon: <ClockCircleOutlined /> },
      PENDING: { color: 'orange', text: 'PENDING', icon: <ClockCircleOutlined /> },
      ONGOING: { color: 'green', text: 'IN PROGRESS', icon: <CheckCircleOutlined /> },
      IN_PROGRESS: { color: 'green', text: 'IN PROGRESS', icon: <CheckCircleOutlined /> },
      COMPLETED: { color: 'purple', text: 'COMPLETED', icon: <SafetyCertificateOutlined /> },
      DONE: { color: 'purple', text: 'COMPLETED', icon: <SafetyCertificateOutlined /> },
      CANCELLED: { color: 'red', text: 'CANCELLED', icon: <ExclamationCircleOutlined /> }
    };
    return configs[status] || { color: 'default', text: status || 'UNKNOWN', icon: <ExclamationCircleOutlined /> };
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === 'N/A') return 'Not scheduled';
    try {
      return dayjs(timeString).format('hh:mm A');
    } catch (error) {
      return timeString;
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone || phone === 'N/A') return 'Not available';
    
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Calculate time until next trip
  const getTimeUntilTrip = (startTime) => {
    if (!startTime) return null;
    const tripTime = dayjs(startTime);
    const now = dayjs();
    
    if (tripTime.isBefore(now)) {
      return { type: 'passed', text: 'Departure time passed' };
    }
    
    const diffMinutes = tripTime.diff(now, 'minute');
    if (diffMinutes < 60) {
      return { type: 'soon', text: `Departs in ${diffMinutes} min` };
    }
    
    const diffHours = tripTime.diff(now, 'hour');
    return { type: 'later', text: `Departs in ${diffHours} hr` };
  };

  // Responsive title level
  const getTitleLevel = () => {
    if (isSmallMobile) return 5;
    if (isMobile) return 4;
    return 2;
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Spin size="large" className="mb-4" />
          <Title level={isMobile ? 4 : 3} className="text-gray-700 mb-2">Loading Your Trips</Title>
          <Text className="text-gray-500">Preparing your schedule for today...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-4">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className={`${isMobile ? 'p-2' : 'p-3'} bg-blue-100 rounded-full`}>
                <CalendarOutlined className={`text-blue-600 ${isMobile ? 'text-xl' : 'text-2xl'}`} />
              </div>
            </div>
            <Title level={getTitleLevel()} className="text-gray-800 mb-2">Today's Schedule</Title>
            <Text className={`text-gray-600 ${isMobile ? 'text-base' : 'text-lg'} font-medium`}>
              {dayjs().format('dddd, MMMM D, YYYY')}
            </Text>
            
            {trips.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <Badge 
                  count={trips.length} 
                  showZero={false}
                  style={{ backgroundColor: '#1890ff' }}
                  className="mr-2"
                />
                <Tag color="blue" className={`${isMobile ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1'} font-semibold`}>
                  {trips.length} trip{trips.length > 1 ? 's' : ''} scheduled
                </Tag>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Unable to Load Trips"
            description={error}
            type="error"
            showIcon
            closable
            className="mb-4 sm:mb-6 rounded-lg sm:rounded-xl border-0 shadow-sm"
            onClose={() => setError('')}
            action={
              <Button size="small" type="primary" onClick={handleRefresh}>
                Try Again
              </Button>
            }
          />
        )}

        {/* No Trips Found */}
        {trips.length === 0 && !loading && !error && (
          <Card className="rounded-xl sm:rounded-2xl shadow-sm border-0 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={isMobile ? 5 : 4} className="text-gray-700 mb-2">
                    No Trips Scheduled
                  </Title>
                  <Text type="secondary" className={isMobile ? "text-sm" : "text-base"}>
                    You're all caught up! Enjoy your day off or check back later for new assignments.
                  </Text>
                </div>
              }
            />
            <Button 
              type="primary" 
              onClick={handleRefresh}
              className={`mt-4 ${isMobile ? 'h-9 px-4' : 'h-10 px-6'} rounded-lg`}
              icon={<ReloadOutlined />}
            >
              Refresh Schedule
            </Button>
          </Card>
        )}

        {/* Trip List */}
        {trips.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            <Row gutter={[12, 12]}>
              {trips.map((trip, index) => {
                const statusConfig = getStatusConfig(trip.status);
                const timeInfo = getTimeUntilTrip(trip.startTime);
                
                return (
                  <Col xs={24} key={index}>
                    <Card 
                      className="rounded-xl sm:rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow duration-300"
                      bodyStyle={{ padding: 0 }}
                    >
                      <Collapse 
                        defaultActiveKey={trips.length === 1 ? ['0'] : []}
                        expandIconPosition="end"
                        className="border-0"
                        size={isMobile ? "small" : "default"}
                      >
                        <Panel 
                          key={index}
                          header={
                            <div className="flex items-center justify-between w-full pr-2 sm:pr-4">
                              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                                <div className={`flex items-center justify-center ${isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-blue-100 rounded-lg sm:rounded-xl flex-shrink-0`}>
                                  <Text strong className="text-blue-600 text-sm sm:text-lg">
                                    {index + 1}
                                  </Text>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-1 sm:space-x-2 mb-1 flex-wrap">
                                    <Text strong className={`${isMobile ? 'text-base' : 'text-lg'} truncate`}>
                                      Trip {index + 1}
                                    </Text>
                                    <Tag 
                                      color={statusConfig.color}
                                      icon={statusConfig.icon}
                                      className={`font-semibold ${isMobile ? 'text-xs px-1 py-0' : 'text-xs px-2 py-1'} rounded-lg flex-shrink-0`}
                                    >
                                      {isSmallMobile ? statusConfig.text.split(' ')[0] : statusConfig.text}
                                    </Tag>
                                  </div>
                                  <Text type="secondary" className={`${isMobile ? 'text-xs' : 'text-sm'} truncate block`}>
                                    {trip.projectName}
                                  </Text>
                                </div>
                              </div>
                              
                              <div className="text-right flex-shrink-0 ml-2">
                                <div className="flex items-center space-x-1 sm:space-x-2 mb-1 justify-end">
                                  <ClockCircleOutlined className="text-blue-500 text-sm sm:text-base" />
                                  <Text strong className={isMobile ? "text-sm" : "text-base"}>
                                    {formatTime(trip.startTime)}
                                  </Text>
                                </div>
                                {timeInfo && (
                                  <Tag 
                                    color={timeInfo.type === 'soon' ? 'red' : timeInfo.type === 'passed' ? 'orange' : 'blue'}
                                    className={`${isMobile ? 'text-xs' : 'text-xs'} rounded-full`}
                                  >
                                    {isSmallMobile ? timeInfo.text.replace('Departs in ', '') : timeInfo.text}
                                  </Tag>
                                )}
                              </div>
                            </div>
                          }
                          className="border-0"
                        >
                          {/* Trip Details */}
                          <div className="space-y-4 sm:space-y-6">
                            {/* Quick Stats */}
                            <Row gutter={[8, 8]}>
                              <Col xs={12} sm={6}>
                                <div className="text-center">
                                  <ClockCircleOutlined className="text-blue-500 mb-1 text-lg" />
                                  <Text strong className="block text-sm sm:text-base">{formatTime(trip.startTime)}</Text>
                                  <Text type="secondary" className="text-xs">Pickup Time</Text>
                                </div>
                              </Col>
                              <Col xs={12} sm={6}>
                                <div className="text-center">
                                  <ClockCircleOutlined className="text-orange-500 mb-1 text-lg" />
                                  <Text strong className="block text-sm sm:text-base">{formatTime(trip.dropTime)}</Text>
                                  <Text type="secondary" className="text-xs">Drop Time</Text>
                                </div>
                              </Col>
                              <Col xs={12} sm={6}>
                                <div className="text-center">
                                  <CarOutlined className="text-green-500 mb-1 text-lg" />
                                  <Text strong className="block text-sm sm:text-base truncate">{trip.vehicleNumber}</Text>
                                  <Text type="secondary" className="text-xs">Vehicle</Text>
                                </div>
                              </Col>
                              <Col xs={12} sm={6}>
                                <div className="text-center">
                                  <TeamOutlined className="text-purple-500 mb-1 text-lg" />
                                  <Text strong className="block text-sm sm:text-base">{trip.passengerCount}</Text>
                                  <Text type="secondary" className="text-xs">Passengers</Text>
                                </div>
                              </Col>
                            </Row>

                            <Divider className="my-2" />

                            {/* Detailed Information */}
                            <Row gutter={[12, 12]}>
                              <Col xs={24} md={12}>
                                <Card size="small" className="rounded-lg border-0 bg-gray-50">
                                  <div className="space-y-3 sm:space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <ProjectOutlined className="text-gray-600 mr-2 sm:mr-3" />
                                        <Text strong className={isMobile ? "text-sm" : ""}>Project</Text>
                                      </div>
                                      <Text className={`font-semibold text-right ${isMobile ? "text-sm" : ""}`}>{trip.projectName}</Text>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <UserOutlined className="text-gray-600 mr-2 sm:mr-3" />
                                        <Text strong className={isMobile ? "text-sm" : ""}>Driver</Text>
                                      </div>
                                      <Text className={`font-semibold text-right ${isMobile ? "text-sm" : ""}`}>{trip.driverName}</Text>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <CarOutlined className="text-gray-600 mr-2 sm:mr-3" />
                                        <Text strong className={isMobile ? "text-sm" : ""}>Vehicle Type</Text>
                                      </div>
                                      <Text className={`font-semibold text-right ${isMobile ? "text-sm" : ""}`}>{trip.vehicleType}</Text>
                                    </div>
                                  </div>
                                </Card>
                              </Col>

                              <Col xs={24} md={12}>
                                <div className="space-y-2 sm:space-y-3">
                                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-100">
                                    <div className="flex items-start">
                                      <EnvironmentOutlined className="text-green-600 mr-2 sm:mr-3 mt-0.5" />
                                      <div className="flex-1">
                                        <Text strong className={`block text-green-800 ${isMobile ? 'text-xs' : 'text-sm'} mb-1`}>
                                          PICKUP LOCATION
                                        </Text>
                                        <Text className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium break-words`}>{trip.pickupLocation}</Text>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-100">
                                    <div className="flex items-start">
                                      <EnvironmentOutlined className="text-orange-600 mr-2 sm:mr-3 mt-0.5" />
                                      <div className="flex-1">
                                        <Text strong className={`block text-orange-800 ${isMobile ? 'text-xs' : 'text-sm'} mb-1`}>
                                          DROP LOCATION
                                        </Text>
                                        <Text className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium break-words`}>{trip.dropLocation}</Text>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Col>
                            </Row>

                            <Divider className="my-2" />

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                              {trip.driverContact && trip.driverContact !== 'N/A' && (
                                <Button 
                                  type="primary" 
                                  size={isMobile ? "middle" : "large"}
                                  className="flex-1 rounded-lg font-semibold bg-green-600 hover:bg-green-700 border-green-600"
                                  icon={<PhoneOutlined />}
                                  onClick={() => handleContactDriver(trip)}
                                >
                                  {isMobile ? 'CALL DRIVER' : 'CALL DRIVER NOW'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </Panel>
                      </Collapse>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {/* Refresh Button */}
            <div className="text-center">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={refreshing}
                className={`${isMobile ? 'h-9 px-4' : 'h-10 px-6'} rounded-lg border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600`}
                size={isMobile ? "middle" : "large"}
              >
                Refresh Schedule
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayTrip;