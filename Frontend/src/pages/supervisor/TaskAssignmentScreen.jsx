import { useEffect, useState } from "react";
import { Select, Card, Button, Modal, Tag, message, Spin, Radio } from "antd";
import axios from "axios";

const { Option } = Select;

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export default function TaskAssignmentScreen() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);

  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [taskFilter, setTaskFilter] = useState("all"); // all / assigned / unassigned

  /* ----------------------------------
     Load Supervisor Projects
  ---------------------------------- */
 useEffect(() => {
  api
    .get("/supervisor/projects")
    .then((res) => setProjects(res.data.data)) // ✅ use res.data.data
    .catch(() => message.error("Failed to load projects"));
}, []);


  /* ----------------------------------
     Load Workers + Tasks on Project Change
  ---------------------------------- */
  useEffect(() => {
    if (!projectId) return;
    refreshWorkers();
    refreshTasks();
  }, [projectId]);

  /* ----------------------------------
     Refresh Workers
  ---------------------------------- */
  const refreshWorkers = () => {
    if (!projectId) return;
    setLoadingWorkers(true);
    api
      .get(`/supervisor/projects/${projectId}/checked-in-workers`)
      .then((res) => setWorkers(res.data))
      .catch(() => message.error("Failed to load workers"))
      .finally(() => setLoadingWorkers(false));
  };

  /* ----------------------------------
     Refresh Tasks
  ---------------------------------- */
  const refreshTasks = () => {
    if (!projectId) return;
    setLoadingTasks(true);
    api
      .get(`/supervisor/projects/${projectId}/tasks`)
      .then((res) => setTasks(res.data))
      .catch(() => message.error("Failed to load tasks"))
      .finally(() => setLoadingTasks(false));
  };

  /* ----------------------------------
     Open Assign Task Modal
  ---------------------------------- */
  const openAssignTask = (worker) => {
    setSelectedWorker(worker);
    setSelectedTask(worker.taskId || null); // prefill if assigned
    setTaskModalOpen(true);
  };

  /* ----------------------------------
     Assign Task API Call
  ---------------------------------- */
  const assignTask = async () => {
    if (!selectedWorker || !selectedTask) return;

    console.log('Assigning task:', {
    assignmentId: selectedWorker?.assignmentId,
    taskId: selectedTask,
  });
    try {
      await api.patch("/supervisor/assign-task", {
        assignmentId: selectedWorker.assignmentId,
        taskId: selectedTask,
      });
      message.success("Task assigned successfully");
      setTaskModalOpen(false);
      refreshWorkers();
    } catch {
      message.error("Failed to assign task");
    }
  };

  /* ----------------------------------
     Filter Workers Based on Task Assignment
  ---------------------------------- */
  const filteredWorkers = workers.filter((w) => {
    if (taskFilter === "assigned") return w.taskId;
    if (taskFilter === "unassigned") return !w.taskId;
    return true; // all
  });

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-lg font-semibold mb-4">On-Site Task Assignment</h1>

      {/* Project Selector */}
      <Select
        placeholder="Select Project"
        className="w-full mb-4"
        onChange={setProjectId}
        loading={!projects.length}
        value={projectId}
      >
        {projects.map((p) => (
          <Option key={p.id} value={p.id}>
            {p.projectName}
          </Option>
        ))}
      </Select>

      {/* Task Filter */}
      <Radio.Group
        value={taskFilter}
        onChange={(e) => setTaskFilter(e.target.value)}
        className="mb-4"
      >
        <Radio.Button value="all">All</Radio.Button>
        <Radio.Button value="assigned">Assigned</Radio.Button>
        <Radio.Button value="unassigned">Unassigned</Radio.Button>
      </Radio.Group>

      {/* Workers List */}
      {projectId && (
        <Spin spinning={loadingWorkers}>
          <div className="space-y-3">
            {filteredWorkers.length ? (
              filteredWorkers.map((worker) => (
                <Card
                  key={worker.assignmentId}
                  className="shadow-sm"
                  bodyStyle={{ padding: "12px" }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{worker.employee.fullName}</p>
                      <Tag color="blue" className="mt-1">
                        {worker.employee.jobTitle}
                      </Tag>
                      {worker.taskId && (
                        <Tag color="green" className="ml-2">
                          Task Assigned
                        </Tag>
                      )}
                    </div>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => openAssignTask(worker)}
                    >
                      {worker.taskId ? "Change Task" : "Assign Task"}
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-gray-500 text-center mt-4">No workers found</p>
            )}
          </div>
        </Spin>
      )}

      {/* Assign Task Modal */}
      <Modal
        title={`Assign Task – ${selectedWorker?.employee?.fullName || ""}`}
        open={taskModalOpen}
        onCancel={() => setTaskModalOpen(false)}
        onOk={assignTask}
        okText="Confirm"
        okButtonProps={{ disabled: !selectedTask }}
      >
        <Spin spinning={loadingTasks}>
          <Select
            placeholder="Select Task"
            className="w-full"
            value={selectedTask}
            onChange={setSelectedTask}
          >
            {tasks.map((task) => (
              <Option key={task.id} value={task.id}>
                {task.taskName}
              </Option>
            ))}
          </Select>
        </Spin>
      </Modal>
    </div>
  );
}
