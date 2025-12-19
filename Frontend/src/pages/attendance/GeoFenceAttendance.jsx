import React, { useState, useEffect } from "react";
import { Button, Card, Typography, Spin, Table, Tag } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

const GeoFenceAttendance = ({ employeeId, projectId }) => {
  const empId = employeeId ?? 2; 
  const projId = projectId ?? 1003; 

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [insideGeofence, setInsideGeofence] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("Not Checked In");
  const [outsideDuration, setOutsideDuration] = useState(0);
  const [lastInsideTime, setLastInsideTime] = useState(new Date());

  const BASE_URL = "http://localhost:5000";

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        validateGeofence(pos.coords.latitude, pos.coords.longitude);
      },
      () => setLoading(false)
    );
  };

  const validateGeofence = async (lat, lon) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/attendance/log-location`, {
        employeeId: Number(empId),
        projectId: Number(projId),
        latitude: lat,
        longitude: lon,
      });

      setInsideGeofence(res.data.insideGeofence);

      if (res.data.insideGeofence) {
        setLastInsideTime(new Date());
        setOutsideDuration(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/attendance/history?employeeId=${Number(empId)}&projectId=${Number(projId)}`
      );

      const formatted = res.data.records.map((rec) => ({
        key: rec._id,
        date: new Date(rec.date).toLocaleDateString(),
        checkIn: rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : "-",
        checkOut: rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : "-",
        notes: !rec.checkIn
          ? "Not Checked In"
          : rec.pendingCheckout
          ? "Pending Checkout"
          : rec.insideGeofenceAtCheckout === false
          ? "Outside alert sent"
          : "-",
      }));

      setAttendanceHistory(formatted);

  
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayRecord = res.data.records.find((rec) => {
        const recDate = new Date(rec.date);
        recDate.setHours(0, 0, 0, 0);
        return recDate.getTime() === today.getTime();
      });

      if (!todayRecord) setCurrentStatus("Not Checked In");
      else if (todayRecord.checkIn && !todayRecord.checkOut) setCurrentStatus("Checked In");
      else if (todayRecord.checkIn && todayRecord.checkOut) setCurrentStatus("Checked Out");
    } catch (err) {
      console.error(err);
    }
  };

  const submitAttendance = async () => {
    if (latitude === null || longitude === null) return;
    const session = currentStatus === "Not Checked In" ? "checkin" : "checkout";

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/attendance/submit`, {
        employeeId: Number(empId),
        projectId: Number(projId),
        session,
        latitude,
        longitude,
      });

      fetchAttendanceHistory();

      // immediately update UI
      setCurrentStatus(session === "checkin" ? "Checked In" : "Checked Out");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto log location every 5 minutes (50 min interval intentional)
  useEffect(() => {
    const interval = setInterval(() => {
      if (latitude && longitude) {
        axios.post(`${BASE_URL}/api/attendance/log-location`, {
          employeeId: Number(empId),
          projectId: Number(projId),
          latitude,
          longitude,
        }).catch(console.error);
      }
    }, 1 * 60 * 1000);

    return () => clearInterval(interval);
  }, [latitude, longitude, empId, projId]);

  // Update outside duration every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (!insideGeofence && latitude && longitude) {
        const duration = Math.floor((new Date() - lastInsideTime) / 1000 / 60);
        setOutsideDuration(duration);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [insideGeofence, lastInsideTime, latitude, longitude]);

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Check In", dataIndex: "checkIn", key: "checkIn" },
    { title: "Check Out", dataIndex: "checkOut", key: "checkOut" },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (note) =>
        note === "Pending Checkout" ? (
          <Tag color="orange">{note}</Tag>
        ) : note === "Outside alert sent" ? (
          <Tag color="red">{note}</Tag>
        ) : note === "Not Checked In" ? (
          <Tag color="blue">{note}</Tag>
        ) : (
          <Tag color="green">{note}</Tag>
        ),
    },
  ];

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-lg p-6 shadow-lg">
        <Title level={3} className="text-center mb-4">
          GEO-FENCED ATTENDANCE
        </Title>

        <div className="mb-2 flex items-center">
          <Text strong className="mr-2">Current Status:</Text>
          {currentStatus === "Checked In" ? (
            <Tag icon={<CheckCircleOutlined />} color="green">{currentStatus}</Tag>
          ) : currentStatus === "Checked Out" ? (
            <Tag icon={<ClockCircleOutlined />} color="blue">{currentStatus}</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="red">{currentStatus}</Tag>
          )}
        </div>

        <div className="mb-2 flex items-center">
          <Text strong className="mr-2">Location:</Text>
          <EnvironmentOutlined className="mr-1" />
          {latitude && longitude
            ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            : "Not fetched"}
        </div>

        <div className="mb-4">
          <Text strong>Geofence Status: </Text>
          {insideGeofence ? (
            <Tag icon={<CheckCircleOutlined />} color="green">Inside Geofence</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="red">Outside Geofence</Tag>
          )}
        </div>

        <div className="flex justify-between mb-4">
          <Button type="default" onClick={getLocation} disabled={loading}>
            {loading ? <Spin /> : "Get My Location"}
          </Button>
          <Button
            type="primary"
            onClick={submitAttendance}
            disabled={loading || latitude === null || longitude === null}
          >
            {loading ? <Spin /> : currentStatus === "Not Checked In" ? "Check In" : "Check Out"}
          </Button>
        </div>

        <div className="mb-4">
          <Text strong>Notes / Alerts:</Text>
          <ul className="list-disc ml-6 mt-1">
            <li>
              {insideGeofence
                ? "You are inside the geofence ✅"
                : `You are outside the geofence for ${outsideDuration} minute(s) ⏰`}
            </li>
          </ul>
        </div>

        <div>
          <Text strong>Attendance History:</Text>
          <Table columns={columns} dataSource={attendanceHistory} pagination={{ pageSize: 5 }} />
        </div>
      </Card>
    </div>
  );
};

export default GeoFenceAttendance;
