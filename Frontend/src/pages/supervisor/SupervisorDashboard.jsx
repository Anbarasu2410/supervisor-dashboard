import React, { useEffect, useState } from 'react';
import { Table, Select, Input, Button, Spin, message } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  BellOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import axios from 'axios';

import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000'
});

const SupervisorDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // ================= FETCH PROJECTS =================
  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const response = await api.get('/api/projects');
        if (Array.isArray(response.data)) setProjects(response.data);
        else if (response.data?.projects) setProjects(response.data.projects);
        else if (response.data?.data) setProjects(response.data.data);
        else setProjects([]);
      } catch (err) {
        message.error('Failed to fetch projects');
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // ================= FETCH WORKERS =================
  const fetchWorkers = async (projectId) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const response = await api.get(
        `/api/supervisor/workers-assigned?projectId=${projectId}&search=${searchText}`
      );
      if (Array.isArray(response.data)) setWorkers(response.data);
      else if (response.data?.workers) setWorkers(response.data.workers);
      else if (response.data?.data) setWorkers(response.data.data);
      else setWorkers([]);
    } catch (err) {
      message.error('Failed to fetch workers');
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= EXPORT PDF =================
  const exportPDF = () => {
    if (!workers.length) {
      message.warning('No data to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Workers Report', 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [[
        '#',
        'Worker Name',
        'Role/Trade',
        'Check-In',
        'Check-Out',
        'Status'
      ]],
      body: workers.map((w, i) => [
        i + 1,
        w.workerName || '-',
        w.role || '-',
        w.checkIn || '-',
        w.checkOut || '-',
        w.status || '-'
      ]),
      styles: { fontSize: 9 }
    });

    doc.save(`workers-report-${selectedProject}.pdf`);
  };

  // ================= EXPORT CSV =================
  const exportCSV = () => {
    if (!workers.length) {
      message.warning('No data to export');
      return;
    }

    const headers = [
      'Worker Name',
      'Role/Trade',
      'Check-In',
      'Check-Out',
      'Status'
    ];

    const rows = workers.map(w => [
      w.workerName,
      w.role,
      w.checkIn,
      w.checkOut,
      w.status
    ]);

    const csv =
      headers.join(',') +
      '\n' +
      rows.map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `workers-report-${selectedProject}.csv`);
  };

  // ================= TABLE COLUMNS =================
  const columns = [
    { title: '#', render: (_, __, i) => i + 1, width: 50 },
    { title: 'Worker Name', dataIndex: 'workerName' },
    { title: 'Role/Trade', dataIndex: 'role' },
    { title: 'Check-In', dataIndex: 'checkIn' },
    { title: 'Check-Out', dataIndex: 'checkOut' },
    { title: 'Status', dataIndex: 'status' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Supervisor Dashboard
        </h1>
        <div className="flex space-x-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchWorkers(selectedProject)}
            disabled={!selectedProject}
          >
            Refresh
          </Button>

          <Button
            icon={<FileTextOutlined />}
            onClick={exportPDF}
            disabled={!selectedProject || workers.length === 0}
          >
            Export Report
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto p-4">
        <div className="bg-white rounded shadow p-4 flex flex-wrap gap-4 items-center mb-4">
          <div className="flex flex-col">
            <span className="font-medium mb-1">Select Project</span>
            {projectsLoading ? (
              <Spin />
            ) : (
              <Select
                value={selectedProject}
                onChange={(v) => {
                  setSelectedProject(v);
                  fetchWorkers(v);
                }}
                style={{ width: 250 }}
                placeholder="Select Project"
                disabled={projects.length === 0}
              >
                {projects.map((p) => (
                  <Select.Option key={p.id || p._id} value={p.id || p._id}>
                    {p.name || p.projectName || 'Unnamed Project'}
                  </Select.Option>
                ))}
              </Select>
            )}
          </div>

          <div className="flex flex-col">
            <span className="font-medium mb-1">Search Worker</span>
            <div className="flex gap-2">
              <Input
                placeholder="Enter worker name"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={() => fetchWorkers(selectedProject)}
                style={{ width: 250 }}
                disabled={!selectedProject}
              />
              <Button
                icon={<SearchOutlined />}
                onClick={() => fetchWorkers(selectedProject)}
                disabled={!selectedProject}
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Workers Table */}
        <div className="bg-white rounded shadow p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={workers}
              rowKey={(r) => r.id || r._id || r.workerName}
              pagination={false}
              bordered
              locale={{
                emptyText: selectedProject
                  ? 'No workers found'
                  : 'Select a project to view workers'
              }}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded shadow p-4 mt-4 flex justify-between">
          <div className="flex gap-2">
            <Button icon={<BellOutlined />} disabled={!selectedProject}>
              Send Alert
            </Button>
            <Button icon={<UserAddOutlined />} disabled={!selectedProject}>
              Assign Task
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-gray-500 p-4">
        Version 1.0 | Company Logo | Contact Support
      </footer>
    </div>
  );
};

export default SupervisorDashboard;
