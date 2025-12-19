import { useEffect, useState } from "react";
import { Card, Button, Input, Slider, Upload, Spin, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/worker",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});

export default function MyTaskToday() {
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [progress, setProgress] = useState(0);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/my-task/today")
      .then(res => {
        setTask(res.data.data);
        setProgress(res.data.data.progressPercent || 0);
      })
      .catch(() => message.error("No task for today"))
      .finally(() => setLoading(false));
  }, []);

  const submitWork = async () => {
    if (!photos.length) {
      return message.error("Upload at least one photo");
    }

    setSubmitting(true);
    try {
      await api.post("/task-progress", {
        assignmentId: task.assignmentId,
        progressPercent: progress,
        description,
        notes
      });

      const formData = new FormData();
      photos.forEach(p => formData.append("photos", p));
      formData.append("assignmentId", task.assignmentId);

      await api.post("/task-photos", formData);

      message.success("Work submitted");
      setPhotos([]);
    } catch {
      message.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin className="mt-10 block mx-auto" />;
  if (!task) return <p className="text-center mt-10">No task today</p>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
    <Card>
  <h3 className="font-semibold text-lg">🏗️ Project</h3>
  <p className="mt-1">
    <strong>Project Name:</strong> {task.projectName}
  </p>
  <p>
    <strong>Site:</strong> {task.projectAddress}
  </p>
</Card>

<Card>
  <h3 className="font-semibold text-lg">🧱 Assigned Task</h3>
  <p className="mt-1">
    <strong>Task:</strong> {task.taskName}
  </p>
  <p>
    <strong>Status:</strong> {task.status}
  </p>
   <p>
    <strong>Supervisor:</strong> {task.supervisorName}
  </p>
</Card>



      <Card title={`Progress: ${progress}%`}>
        <Slider value={progress} onChange={setProgress} />
      </Card>

      <Card title="Work Done">
        <Input.TextArea
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </Card>

      <Card title="Photos">
        <Upload
          multiple
          beforeUpload={file => {
            setPhotos(prev => [...prev, file]);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>Add Photos</Button>
        </Upload>
      </Card>

      <Card title="Notes">
        <Input.TextArea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </Card>

      <Button
        type="primary"
        block
        loading={submitting}
        onClick={submitWork}
      >
        Submit Work
      </Button>
    </div>
  );
}
