import React, { useState, useEffect } from "react";
import { Card, Typography, message, Spin } from "antd";
import { 
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  EnvironmentFilled,
  CalendarOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

const AttendanceHistoryUI = ({ employeeId = 1, projectId = 12345 }) => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const BASE_URL = "http://localhost:5000";

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/attendance/history`, {
        params: { employeeId: Number(employeeId), projectId: Number(projectId) }
      });

      const formatted = res.data.records.map((rec) => {
        const date = rec.date ? new Date(rec.date) : new Date();
        const checkIn = rec.checkIn ? new Date(rec.checkIn) : null;
        const checkOut = rec.checkOut ? new Date(rec.checkOut) : null;

        let status = "completed";

        if (!rec.checkIn) status = "not_checked_in";
        else if (rec.pendingCheckout) status = "pending";
        else if (rec.insideGeofenceAtCheckout === false) status = "outside";

        return {
          id: rec._id,
          date,
          checkIn,
          checkOut,
          status,
        };
      });

      setAttendanceHistory(formatted);
    } catch (err) {
      console.error("Fetch error:", err);
      message.error("Failed to fetch attendance history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [employeeId, projectId]);

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        icon: <CheckCircleFilled className="text-green-500" />,
        bg: "bg-green-50",
        color: "text-green-700",
        border: "border-green-200",
        label: "Completed",
      },
      pending: {
        icon: <ClockCircleFilled className="text-amber-500" />,
        bg: "bg-amber-50",
        color: "text-amber-700",
        border: "border-amber-200",
        label: "In Progress",
      },
      outside: {
        icon: <EnvironmentFilled className="text-rose-500" />,
        bg: "bg-rose-50",
        color: "text-rose-700",
        border: "border-rose-200",
        label: "Outside Zone",
      },
      not_checked_in: {
        icon: <CloseCircleFilled className="text-slate-400" />,
        bg: "bg-slate-50",
        color: "text-slate-600",
        border: "border-slate-200",
        label: "Not Checked In",
      },
    };
    return configs[status] || configs.completed;
  };

  const formatTime = (d) =>
    d instanceof Date && !isNaN(d) ?
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) :
      "-";

const formatDate = (date) => {
  if (!date || isNaN(date)) return "Invalid Date";

  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};


  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "";
    const diff = checkOut.getTime() - checkIn.getTime();
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Attendance History</h1>
          <p className="text-slate-600">Track your daily check-ins and check-outs</p>
        </div>

        <Card className="shadow-lg rounded-2xl border-0 overflow-hidden">

          {/* Table Header (only for tablet/desktop) */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="col-span-3 text-sm font-medium text-slate-600 uppercase">Date</div>
            <div className="col-span-6 text-sm font-medium text-slate-600 uppercase">Time</div>
            <div className="col-span-3 text-sm font-medium text-slate-600 uppercase">Status</div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spin size="large" />
              <p className="mt-4 text-slate-500">Loading records...</p>
            </div>
          ) : attendanceHistory.length === 0 ? (
            <div className="text-center py-16">
              <CalendarOutlined className="text-4xl text-slate-300 mb-4" />
              <p className="text-slate-500">No records found</p>
            </div>
          ) : (
            <div>
              {attendanceHistory.map((item, index) => {
                const statusCfg = getStatusConfig(item.status);
                const duration = calculateDuration(item.checkIn, item.checkOut);

                return (
                  <div
                    key={item.id}
                    className={`px-4 sm:px-6 py-5 transition-colors 
                      border-b border-slate-100 
                      hover:bg-slate-50`}
                  >
                    {/* Mobile Layout */}
                    <div className="sm:hidden flex flex-col space-y-3">
                      {/* Date */}
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusCfg.bg}`}>
                          {statusCfg.icon}
                        </div>
                        <p className="font-medium text-slate-800">{formatDate(item.date)}</p>
                      </div>

                      {/* Times */}
                      <div className="flex flex-col space-y-2">
                        <div>
                          <p className="text-xs text-slate-500">Check-in</p>
                          <p className="text-base font-medium text-slate-800">{formatTime(item.checkIn)}</p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Check-out</p>
                          <p className="text-base font-medium text-slate-800">{formatTime(item.checkOut)}</p>
                        </div>

                        {duration && (
                          <div>
                            <p className="text-xs text-slate-500">Duration</p>
                            <p className="text-base font-medium text-slate-800">{duration}</p>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border} w-fit`}>
                        {statusCfg.label}
                      </div>
                    </div>

                    {/* Desktop/Tablet Layout */}
                    <div className="hidden sm:grid grid-cols-12 gap-4">
                      {/* Date */}
                      <div className="col-span-3 flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusCfg.bg}`}>
                          {statusCfg.icon}
                        </div>
                        <p className="font-medium text-slate-800">{formatDate(item.date)}</p>
                      </div>

                      {/* Time */}
                      <div className="col-span-6 flex items-center justify-between max-w-lg">
                        <div className="text-center">
                          <p className="text-sm text-slate-500 mb-1">Check-in</p>
                          <p className="text-lg font-medium text-slate-800">{formatTime(item.checkIn)}</p>
                        </div>

                        {duration && (
                          <>
                            <ArrowRightOutlined className="text-slate-300 mx-4" />
                            <div className="text-center">
                              <p className="text-sm text-slate-500 mb-1">Check-out</p>
                              <p className="text-lg font-medium text-slate-800">{formatTime(item.checkOut)}</p>
                            </div>

                            <ArrowRightOutlined className="text-slate-300 mx-4" />
                            <div className="text-center">
                              <p className="text-sm text-slate-500 mb-1">Duration</p>
                              <p className="text-lg font-medium text-slate-800">{duration}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Status */}
                      <div className="col-span-3 flex items-center justify-end">
                        <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                          {statusCfg.label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default AttendanceHistoryUI;
