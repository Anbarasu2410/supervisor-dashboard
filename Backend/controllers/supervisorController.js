import Attendance from '../models/Attendance.js';
import Project from '../models/Project.js';
import Employee from '../models/Employee.js';
import LocationLog from '../models/LocationLog.js';
import WorkerTaskAssignment from '../models/WorkerTaskAssignment.js';
import CompanyUser from "../models/CompanyUser.js";
import Task from "../models/Task.js"
/**
 * Fetch Workers Assigned to a Project
 * @route GET /api/supervisor/workers-assigned
 */
// export const getAssignedWorkers = async (req, res) => {
//   try {
//     const { projectId, search } = req.query;
    
//     const project = await Project.findOne({ id: projectId });
//     if (!project) return res.status(404).json({ message: 'Project not found' });

//     const workers = await Employee.find({
//       projectId: projectId,
//       fullName: { $regex: search, $options: 'i' } // search by worker name (case insensitive)
//     });

//     const workerData = await Promise.all(workers.map(async (worker) => {
//       const attendance = await Attendance.findOne({ employeeId: worker.id, projectId: projectId, date: new Date().setHours(0, 0, 0, 0) });
//       const status = attendance
//         ? attendance.checkOut ? '✅ Present' : '⏳ Pending'
//         : '❌ Absent';

//       return {
//         workerName: worker.fullName,
//         role: worker.role,
//         checkIn: attendance ? attendance.checkIn : '-',
//         checkOut: attendance ? attendance.checkOut : '-',
//         status: status
//       };
//     }));

//     return res.status(200).json({ workers: workerData });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Error fetching assigned workers' });
//   }
// };

export const getAssignedWorkers = async (req, res) => {
  try {
    const { projectId, search = '', date } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const workDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
   
    // 1️⃣ Get assignments for the project & date
    const assignments = await WorkerTaskAssignment.find({
      projectId: Number(projectId),
      date: workDate
    });

    if (assignments.length === 0) {
      return res.status(200).json({ workers: [] });
    }

    const employeeIds = assignments.map(a => a.employeeId);

    // 2️⃣ Fetch employees
    const employees = await Employee.find({
      id: { $in: employeeIds },
      fullName: { $regex: search, $options: 'i' }
    }).lean();

    // 3️⃣ Build response
    const workers = await Promise.all(
      employees.map(async (worker) => {
        // Format the workDate properly for MongoDB query
        const targetDate = new Date(workDate);
        targetDate.setHours(0, 0, 0, 0); // Set to beginning of day
        
        const attendance = await Attendance.findOne({
          employeeId: worker.id,
          projectId: Number(projectId),
          date: {
            $gte: new Date(workDate), // Greater than or equal to start of day
            $lt: new Date(new Date(workDate).setDate(new Date(workDate).getDate() + 1)) // Less than next day
          }
        }).lean();

        let status = '❌ Absent';
        if (attendance) {
          status = attendance.checkOut ? '✅ Present' : '⏳ Pending';
        }

        return {
          employeeId: worker.id,
          workerName: worker.fullName,
          role: worker.role,
          checkIn: attendance?.checkIn || '-',
          checkOut: attendance?.checkOut || '-',
          status
        };
      })
    );

    return res.status(200).json({ workers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching assigned workers' });
  }
};


/**
 * Export Daily Attendance Report (CSV/PDF)
 * @route GET /api/supervisor/export-report
 */
export const exportReport = async (req, res) => {
  try {
    const { projectId, date } = req.query;
    const project = await Project.findOne({ id: projectId });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Logic to generate the report (CSV or PDF) for workers' attendance on the selected date
    // This part should implement the export functionality (you can use libraries like csv-writer, pdfkit, etc.)

    const workers = await Employee.find({ projectId: projectId });
    const attendanceRecords = await Attendance.find({
      projectId: projectId,
      date: new Date(date).setHours(0, 0, 0, 0)
    });

    // Mock response for demonstration
    return res.status(200).json({
      message: 'Exported report successfully',
      fileUrl: 'http://example.com/reports/attendance_report.csv'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error exporting report' });
  }
};

/**
 * Refresh Workers Attendance (For UI update)
 * @route GET /api/supervisor/refresh-attendance
 */
export const refreshAttendance = async (req, res) => {
  try {
    const { projectId } = req.query;

    const workers = await Employee.find({ projectId });
    const workerData = await Promise.all(workers.map(async (worker) => {
      const attendance = await Attendance.findOne({ employeeId: worker.id, projectId: projectId, date: new Date().setHours(0, 0, 0, 0) });
      const status = attendance
        ? attendance.checkOut ? '✅ Present' : '⏳ Pending'
        : '❌ Absent';

      return {
        workerName: worker.fullName,
        role: worker.role,
        checkIn: attendance ? attendance.checkIn : '-',
        checkOut: attendance ? attendance.checkOut : '-',
        status: status
      };
    }));

    return res.status(200).json({ workers: workerData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error refreshing attendance' });
  }
};

export const getSupervisorProjects = async (req, res) => {
  try {
    // 1️⃣ Get all projects
    const projects = await Project.find();

    // 2️⃣ Filter projects by checking linked employee and companyUser
    const filteredProjects = [];

    for (const project of projects) {
      // Find employee linked to supervisorId
      const employee = await Employee.findOne({ id: project.supervisorId });
      if (!employee) continue; // skip if no employee

      // Check if the employee's userId is a supervisor in CompanyUser
      const companyUser = await CompanyUser.findOne({ userId: employee.userId, role: "supervisor" });
      if (!companyUser) continue; // skip if not a supervisor

      // Passed all checks, include project
      filteredProjects.push(project);
    }

    // 3️⃣ Return filtered projects
    res.json({
      success: true,
      data: filteredProjects,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: filteredProjects.length,
        itemsPerPage: filteredProjects.length,
      },
    });
  } catch (err) {
    console.error("getSupervisorProjects error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * Get checked-in workers for a project
 */
export const getCheckedInWorkers = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Only workers who checked in today and are inside geofence
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendances = await Attendance.find({
      projectId,
      date: { $gte: today },
      insideGeofenceAtCheckin: true
    }).populate('employeeId');

    // Map to WorkerTaskAssignment
    const workerAssignments = await Promise.all(attendances.map(async att => {
      const assignment = await WorkerTaskAssignment.findOne({
        projectId,
        employeeId: att.employeeId
      });
      return {
        assignmentId: assignment ? assignment.id : null,
        employee: att.employeeId,
        taskId: assignment ? assignment.taskId : null
      };
    }));

    res.json(workerAssignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all tasks for a project
 */
export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ projectId });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Assign task to a worker
 */


export const assignTask = async (req, res) => {
  try {
    let { assignmentId, taskId } = req.body;

    if (!assignmentId || !taskId) {
      return res.status(400).json({ message: 'assignmentId and taskId are required' });
    }

    // Find assignment by numeric assignmentId
    const assignment = await WorkerTaskAssignment.findOne({ id: Number(assignmentId) });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Find task by numeric id
    const task = await Task.findOne({ id: Number(taskId) });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Ensure task belongs to the same project
    if (task.projectId !== assignment.projectId) {
      return res.status(400).json({ message: 'Task does not belong to this project' });
    }

    // Assign task using numeric id
    assignment.taskId = Number(taskId);
    assignment.status = 'in_progress';
    assignment.assignedAt = new Date();

    await assignment.save();

    res.json({ message: 'Task assigned successfully' });
  } catch (err) {
    console.error('assignTask error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

