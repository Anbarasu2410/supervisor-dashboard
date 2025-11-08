// src/pages/driver/DropConfirmation.jsx
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
  ScheduleOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DropConfirmation = () => {
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
            drop_status: p.drop_status || 'pending'
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
            'pending': 'confirmed',
            'confirmed': 'missed', 
            'missed': 'pending'
          };
          return {
            ...passenger,
            drop_status: statusCycle[passenger.drop_status]
          };
        }
        return passenger;
      })
    );
  };

  const handleConfirmDropoffs = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const confirmedIds = passengers
        .filter(p => p.drop_status === 'confirmed')
        .map(p => p.id);

      const missedIds = passengers
        .filter(p => p.drop_status === 'missed')
        .map(p => p.id);

      console.log('Sending drop confirmation:', { confirmed: confirmedIds, missed: missedIds });

      const response = await api.post(`/driver/tasks/${taskId}/drop`, {
        confirmed: confirmedIds,
        missed: missedIds
      });

      if (response.data.success) {
        setSuccess('Drop-off confirmed successfully! Redirecting to trip summary...');
        
        setTimeout(() => {
          navigate(`/driver/tasks/${taskId}/summary`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error confirming drop-offs:', err);
      setError(err.response?.data?.message || 'Failed to confirm drop-offs');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'confirmed': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      'missed': <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      'pending': <ScheduleOutlined style={{ color: '#faad14' }} />
    };
    return icons[status] || icons.pending;
  };

  const getStatusText = (status) => {
    const texts = {
      'confirmed': 'Confirmed',
      'missed': 'Missed',
      'pending': 'Pending'
    };
    return texts[status] || texts.pending;
  };

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': 'green',
      'missed': 'red',
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
        <Text className="block mt-4 text-gray-600">Loading drop details...</Text>
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

  const confirmedCount = passengers.filter(p => p.drop_status === 'confirmed').length;
  const missedCount = passengers.filter(p => p.drop_status === 'missed').length;
  const pendingCount = passengers.filter(p => p.drop_status === 'pending').length;

  const allPassengersProcessed = pendingCount === 0 && passengers.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="text-center mb-6">
        <Title level={3}>📍 Drop Confirmation</Title>
        <Text type="secondary">Tap on each passenger to mark as Confirmed ✅ or Missed ❌</Text>
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

      <Card 
        title={
          <div className="flex items-center space-x-2">
            <TeamOutlined className="text-blue-600" />
            <span>Passengers ({passengers.length})</span>
          </div>
        }
        className="bg-white border-0 shadow-sm rounded-lg mb-4"
      >
        <div className="space-y-3">
          {passengers.length > 0 ? (
            passengers.map((passenger, index) => (
              <div 
                key={passenger.id || index}
                onClick={() => togglePassengerStatus(index)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  passenger.drop_status === 'confirmed' 
                    ? 'bg-green-50 border-green-200' 
                    : passenger.drop_status === 'missed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar 
                    size="default"
                    icon={<UserOutlined />}
                    className={`${
                      passenger.drop_status === 'confirmed' 
                        ? 'bg-green-500' 
                        : passenger.drop_status === 'missed'
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    } text-white`}
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
                  <Tag color={getStatusColor(passenger.drop_status)} className="m-0">
                    {getStatusText(passenger.drop_status)}
                  </Tag>
                  {getStatusIcon(passenger.drop_status)}
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
        <Col span={6}>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <TeamOutlined className="text-blue-600 text-2xl mb-2" />
            <div className="text-blue-600 text-2xl font-bold">{passengers.length}</div>
            <Text className="text-blue-700 text-sm font-medium">Total</Text>
          </div>
        </Col>
        <Col span={6}>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircleOutlined className="text-green-600 text-2xl mb-2" />
            <div className="text-green-600 text-2xl font-bold">{confirmedCount}</div>
            <Text className="text-green-700 text-sm font-medium">Confirmed</Text>
          </div>
        </Col>
        <Col span={6}>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <CloseCircleOutlined className="text-red-600 text-2xl mb-2" />
            <div className="text-red-600 text-2xl font-bold">{missedCount}</div>
            <Text className="text-red-700 text-sm font-medium">Missed</Text>
          </div>
        </Col>
        <Col span={6}>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <ScheduleOutlined className="text-orange-600 text-2xl mb-2" />
            <div className="text-orange-600 text-2xl font-bold">{pendingCount}</div>
            <Text className="text-orange-700 text-sm font-medium">Pending</Text>
          </div>
        </Col>
      </Row>

      {!allPassengersProcessed && passengers.length > 0 && (
        <Alert
          message="Action Required"
          description="Please mark all passengers as either Confirmed or Missed before proceeding."
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <div className="sticky bottom-4">
        <Button
          type="primary"
          size="large"
          loading={submitting}
          onClick={handleConfirmDropoffs}
          disabled={!allPassengersProcessed || submitting}
          className="w-full h-12 text-base font-semibold shadow-lg"
          icon={<SafetyCertificateOutlined />}
        >
          {submitting ? 'CONFIRMING DROPOFFS...' : `CONFIRM DROPOFFS (${confirmedCount + missedCount}/${passengers.length})`}
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

export default DropConfirmation;