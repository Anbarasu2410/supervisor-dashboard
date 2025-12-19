// src/pages/worker/WorkerAttendance.jsx
import React, { useEffect, useState } from "react";
import { Button, Card, message, Spin } from "antd";
import axios from "axios";

const BASE_URL = "http://localhost:5000"; 

export default function WorkerAttendance() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geo, setGeo] = useState({ latitude: null, longitude: null });

  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = user?.id;
 
const projectId = 1;
// adjust if needed

  useEffect(() => {
    if (!employeeId || !projectId) {
      message.error("User or project not found");
      setLoading(false);
      return;
    }

    fetchAttendance();
    getGeoLocation();
  }, []);

  // Fetch today's attendance
  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/attendance/today/${employeeId}`);
      setAttendance(res.data[0] || null);
      setLoading(false);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch attendance");
      setLoading(false);
    }
  };

  // Get worker location
  const getGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeo({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          message.error("Geo-location not available");
        }
      );
    } else {
      message.error("Geo-location not supported");
    }
  };

  // Clock In / Out
  const handleClock = async (type) => {
    if (!geo.latitude || !geo.longitude) {
      message.error("Geo-location required for clocking");
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/api/attendance/clock`, {
        employeeId,
        projectId,
        type,
        latitude: geo.latitude,
        longitude: geo.longitude,
      });
      message.success(`${type === "in" ? "Clocked In" : "Clocked Out"} successfully`);
      fetchAttendance(); // refresh attendance
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Error during clocking");
    }
  };

  if (loading) return <Spin className="m-4" />;

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card title="Today's Attendance" className="mb-4">
        <div className="flex justify-between my-2">
          <span>Morning Login:</span>
          <span>{attendance?.morningLogin ? new Date(attendance.morningLogin).toLocaleTimeString() : "--:--"}</span>
        </div>
        <div className="flex justify-between my-2">
          <span>Morning Logout:</span>
          <span>{attendance?.morningLogout ? new Date(attendance.morningLogout).toLocaleTimeString() : "--:--"}</span>
        </div>
        <div className="flex justify-between my-2">
          <span>Afternoon Login:</span>
          <span>{attendance?.afternoonLogin ? new Date(attendance.afternoonLogin).toLocaleTimeString() : "--:--"}</span>
        </div>
        <div className="flex justify-between my-2">
          <span>Afternoon Logout:</span>
          <span>{attendance?.afternoonLogout ? new Date(attendance.afternoonLogout).toLocaleTimeString() : "--:--"}</span>
        </div>
      </Card>

      <div className="flex justify-around mb-4">
        <Button type="primary" onClick={() => handleClock("in")}>
          Clock In
        </Button>
        <Button type="default" onClick={() => handleClock("out")}>
          Clock Out
        </Button>
      </div>

      <Card title="Geo-location">
        <p>Latitude: {geo.latitude || "--"}</p>
        <p>Longitude: {geo.longitude || "--"}</p>
        <p>Status: {geo.latitude && geo.longitude ? "Location Captured" : "Fetching..."}</p>
      </Card>
    </div>
  );
}
