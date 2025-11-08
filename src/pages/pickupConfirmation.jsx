// src/pages/driver/PickupConfirmation.jsx
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Button, 
  List, 
  Tag, 
  Spin, 
  Alert, 
  Typography, 
  Divider,
  Space,
  Avatar,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  CarOutlined,
  TeamOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  EnvironmentOutlined,
  RocketOutlined,
  ProjectOutlined,
  ThunderboltOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PickupConfirmation = () => {
  const [task, setTask] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { taskId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await api.get(`/driver/tasks/${taskId}`);
        
        if (response.data) {
          setTask(response.data);
          const initializedPassengers = response.data.passengers?.map(p => ({
            ...p,
            pickup_status: 'pending'
          })) || [];
          setPassengers(initializedPassengers);
        }
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [taskId]);

  const togglePassengerStatus = (passengerIndex) => {
    setPassengers(prev => 
      prev.map((passenger, index) => {
        if (index === passengerIndex) {
          const statusCycle = {
            'pending': 'present',
            'present': 'absent', 
            'absent': 'pending'
          };
          return {
            ...passenger,
            pickup_status: statusCycle[passenger.pickup_status]
          };
        }
        return passenger;
      })
    );
  };

  const handleConfirmPickups = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const confirmedIds = passengers
        .filter(p => p.pickup_status === 'present')
        .map(p => p.id);

      const missedIds = passengers
        .filter(p => p.pickup_status === 'absent')
        .map(p => p.id);

      console.log('Sending pickup confirmation:', { confirmed: confirmedIds, missed: missedIds });

      const response = await api.post(`/driver/tasks/${taskId}/pickup`, {
        confirmed: confirmedIds,
        missed: missedIds
      });

      if (response.data.success) {
        setSuccess('Pickup confirmed successfully! Redirecting to drop confirmation...');
        
        setTimeout(() => {
          navigate(`/driver/tasks/${taskId}/drop`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error confirming pickups:', err);
      setError(err.response?.data?.message || 'Failed to confirm pickups');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'present': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'absent': <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      'pending': <ScheduleOutlined style={{ color: '#faad14' }} />
    };
    return icons[status] || icons.pending;
  };

  const getStatusText = (status) => {
    const texts = {
      'present': 'Present',
      'absent': 'Absent',
      'pending': 'Pending'
    };
    return texts[status] || texts.pending;
  };

  const getStatusColor = (status) => {
    const colors = {
      'present': 'green',
      'absent': 'red',
      'pending': 'orange'
    };
    return colors[status] || colors.pending;
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('HH:mm A');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" indicator={<RocketOutlined spin />} />
        <Text className="block mt-4 text-gray-600">Loading pickup details...</Text>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Alert
          message="Error Loading Task"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/driver/tasks')}
        >
          Back to Tasks
        </Button>
      </div>
    );
  }

  const presentCount = passengers.filter(p => p.pickup_status === 'present').length;
  const absentCount = passengers.filter(p => p.pickup_status === 'absent').length;
  const pendingCount = passengers.filter(p => p.pickup_status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="text-center mb-6">
        <Title level={3}>📍 Pickup Confirmation</Title>
      </div>

      {success && (
        <Alert
          message={success}
          type="success"
          showIcon
          closable
          className="mb-4"
        />
      )}

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          className="mb-4"
        />
      )}

      <Card className="bg-white border-0 shadow-sm rounded-lg mb-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <ProjectOutlined className="text-blue-600" />
            <Text strong className="text-gray-900 text-lg">Project: {task?.project_name}</Text>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CarOutlined className="text-green-600" />
            <Text strong className="text-gray-900">Vehicle: {task?.vehicle_no}</Text>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <ClockCircleOutlined className="text-orange-600" />
            <Text strong className="text-gray-900">{formatTime(task?.start_time)} → {formatTime(task?.end_time)}</Text>
          </div>
        </div>
      </Card>

      <Divider className="my-4" />

      <Card className="bg-white border-0 shadow-sm rounded-lg mb-4">
        <div className="space-y-3">
          {passengers.length > 0 ? (
            passengers.map((passenger, index) => (
              <div 
                key={passenger.id || index}
                onClick={() => togglePassengerStatus(index)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  passenger.pickup_status === 'present' 
                    ? 'bg-green-50 border-green-200' 
                    : passenger.pickup_status === 'absent'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar 
                    size="default"
                    icon={<UserOutlined />}
                    className="bg-gray-300 text-white"
                  />
                  <div>
                    <Text strong className="text-gray-900 block text-base">
                      {passenger.name || `Passenger ${index + 1}`}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {passenger.pickup_point || 'Location not specified'}
                    </Text>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag color={getStatusColor(passenger.pickup_status)} className="m-0">
                    {getStatusText(passenger.pickup_status)}
                  </Tag>
                  {getStatusIcon(passenger.pickup_status)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <UserOutlined className="text-gray-300 text-2xl mb-2" />
              <Text className="text-gray-500 block">No passengers assigned</Text>
            </div>
          )}
        </div>
      </Card>

      <Divider className="my-4" />

      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircleOutlined className="text-green-600 text-2xl mb-2" />
            <div className="text-green-600 text-2xl font-bold">{presentCount}</div>
            <Text className="text-green-700 text-sm font-medium">Present</Text>
          </div>
        </Col>
        <Col span={8}>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <CloseCircleOutlined className="text-red-600 text-2xl mb-2" />
            <div className="text-red-600 text-2xl font-bold">{absentCount}</div>
            <Text className="text-red-700 text-sm font-medium">Absent</Text>
          </div>
        </Col>
        <Col span={8}>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <ScheduleOutlined className="text-orange-600 text-2xl mb-2" />
            <div className="text-orange-600 text-2xl font-bold">{pendingCount}</div>
            <Text className="text-orange-700 text-sm font-medium">Pending</Text>
          </div>
        </Col>
      </Row>

      <div className="sticky bottom-4">
        <Button
          type="primary"
          size="large"
          loading={submitting}
          onClick={handleConfirmPickups}
          disabled={passengers.length === 0 || submitting || pendingCount > 0}
          className="w-full h-12 text-base font-semibold shadow-lg"
          icon={<CheckCircleOutlined />}
        >
          {submitting ? 'CONFIRMING PICKUPS...' : 'CONFIRM PICKUPS'}
        </Button>
        
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/driver/tasks/${taskId}`)}
          className="w-full h-10 mt-2 border-gray-300"
          size="large"
        >
          BACK TO TASK DETAILS
        </Button>
      </div>
    </div>
  );
};

export default PickupConfirmation;