// ViewTaskPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "./firebase.js";



import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import { Paper } from "@mui/material";

export default function ViewTaskPage() {
  const { projectId, projectName } = useParams();

  const [taskText, setTaskText] = useState("");
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState([]);

  // modal state (edit)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"];
const [showAddBox, setShowAddBox] = useState(false);
  // const tasksColPath = collection(db, "projects", projectId, "tasks");
const tasksColPath = projectId
  ? collection(db, "projects", projectId, "tasks")
  : null;


  // realtime listener
  useEffect(() => {
    if (!projectId || !tasksColPath) return;

    const q = query(tasksColPath, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTasks(arr);
      },
      (err) => {
        console.error("Tasks snapshot error:", err);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

 // Add task
const addTask = async () => {
  if (!taskText.trim()) return;
  const by = auth.currentUser?.displayName ?? "Guest";

  await addDoc(tasksColPath, {
    text: taskText.trim(),
    status: "Pending",
    updatedBy: by,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    projectId: projectId,   // <-- REQUIRED !!
  });

  setTaskText("");
};


  // Open edit modal (we keep modal behavior as original)
  const openEditModal = (task) => {
    setEditingTask({
      ...task,
      text: task.text ?? "",
      status: task.status ?? "Pending",
      updatedBy: task.updatedBy ?? (auth.currentUser?.displayName ?? "User"),
    });
    setShowEditModal(true);
  };

  // Save editing changes
  const saveEdit = async () => {
    if (!editingTask?.id) return;
    const ref = doc(db, "projects", projectId, "tasks", editingTask.id);
    await updateDoc(ref, {
      text: editingTask.text,
      status: editingTask.status,
      updatedBy: auth.currentUser?.displayName ?? editingTask.updatedBy ?? "Guest",
      updatedAt: serverTimestamp(),
    });
    setShowEditModal(false);
    setEditingTask(null);
  };

  // Delete
  const confirmDelete = (taskId) => {
    setDeletingTaskId(taskId);
    setShowDeleteConfirm(true);
  };

  const doDelete = async () => {
    if (!deletingTaskId) return;
    await deleteDoc(doc(db, "projects", projectId, "tasks", deletingTaskId));
    setShowDeleteConfirm(false);
    setDeletingTaskId(null);
  };

  // Filter only (NO sort) — search works by status substring
  const filtered = tasks.filter((t) => {
    if (!search.trim()) return true;
    return t.status?.toLowerCase().includes(search.toLowerCase());
  });

  // helper: format Firestore timestamp safely
  const formatTs = (ts) => {
  if (!ts) return "—";

  let date;

  if (ts.seconds) {
    date = new Date(ts.seconds * 1000);
  } else {
    date = new Date(ts);
  }

  if (isNaN(date)) return "—";

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" }); // Nov
  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${day} ${month}, ${time}`;
};




  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div
        className="w-100 d-flex align-items-center justify-content-between px-2 px-md-3 py-2 py-md-3 mb-3 mb-md-4 task-header-responsive"
        style={{ backgroundColor: "#2a8c7b" }}
      >
        <button
          className="btn btn-light back-btn-responsive"
          style={{ borderRadius: "50%", width: "35px", height: "35px", padding: 0, fontSize: "18px" }}
          onClick={() => window.history.back()}
        >
          ←
        </button>

        <div className="text-center flex-grow-1">
          <h1 className="text-white fw-bold task-title-responsive">TASKS</h1>
          <h2 className="text-white task-subtitle-responsive" style={{ fontSize: "14px" }}>
            {projectName}
          </h2>
        </div>

        <div className="back-btn-responsive" style={{ width: "35px" }} />
      </div>

      {/* Add + Search */}
      <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4 px-2 px-md-0 search-container-responsive">
        {/* Floating Add Button */}
      <button onClick={() => setShowAddBox(true)} className="btn btn-success shadow-lg task-add-btn-responsive"
       style={{
                 position: "fixed",
                 bottom: "25px",
                 right: "25px",
                 width: "60px",
                 height: "60px",
                 borderRadius: "50%",
                 fontSize: "32px",
                 zIndex: 1000,
               }}
             > +</button>


        <div
  className="input-group shadow-sm ms-auto search-input-group-responsive"
  style={{
    width: "100%",
    maxWidth: "300px",
  }}
>
  <input
    className="form-control search-input-responsive"
    placeholder="Search status"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      height: 40,
      fontSize: 14,
    }}
  />

  {/* NEW SEARCH ICON */}
  <span
    className="input-group-text bg-success text-white shadow-sm ms-auto search-bar-responsive"
    style={{
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      padding: "0 12px",
    }}
  >
    <i className="bi bi-search"></i>
  </span>
</div>

      </div>

      {/* MUI Timeline */}
    
<div className="timeline-container-responsive px-2 px-md-0">
  <Timeline position="right" className="task-timeline-responsive">   {/* force items to the right */}
    {filtered.length === 0 ? (
      <div className="px-2 px-md-4" style={{ padding: "24px 0" }}>
        <p className="text-center text-muted mt-4">No tasks found.</p>
      </div>
    ) : (
      filtered.map((t) => (
        <TimelineItem key={t.id} className="task-item-responsive">

          {/* LEFT SIDE — ONLY DATE */}
          <TimelineOppositeContent
            align="right"
            sx={{ m: "auto 0", fontWeight: 600 }}
            color="text.secondary"
            className="timeline-date-responsive"
          >
            {formatTs(t.updatedAt)}
          </TimelineOppositeContent>

          <TimelineSeparator>
            <TimelineDot color="success" />
            <TimelineConnector />
          </TimelineSeparator>

          {/* RIGHT SIDE — COMPLETE TASK CARD */}
          <TimelineContent sx={{ py: "20px", px: 2 }} className="timeline-content-responsive">
            <Paper elevation={2} className="task-card-paper" style={{ padding: 14, borderRadius: 10, maxWidth: "330px", width: "100%" }}>
              <div className="d-flex align-items-start justify-content-between flex-wrap task-card-content">

                {/* LEFT — TEXT & STATUS */}
                <div className="task-card-left" style={{ maxWidth: "75%", flex: "1 1 auto", minWidth: "200px" }}>
                  <div className="small text-muted mb-2 task-updated-by">
                    Updated By: <strong>{t.updatedBy}</strong>
                  </div>

                  {/* status dropdown inline update */}
                 <div className="d-flex align-items-center mb-2 flex-wrap task-status-group">
  <label className="me-2 small mb-0 task-status-label">Status:</label>

  <select
    className="form-select form-select-sm task-status-select"
    value={t.status}
    onChange={async (e) => {
      const user = auth.currentUser;
       const by = user?.displayName?.trim()? user.displayName: user?.email ?? "Guest";
      const ref = doc(db, "projects", projectId, "tasks", t.id);
      await updateDoc(ref, {
        status: e.target.value,
        updatedBy: by,
        updatedAt: serverTimestamp(),
      });
    }}
    style={{
      width: 150,
      backgroundColor:
        t.status === "Completed"
          ? "#9bf294ff"      // light green
          : t.status === "Pending"
          ? "#eecf6aff"      // light yellow
          : t.status === "In Progress"
          ? "#9bc6f3ff"      // light blue
          : "white",       // default
      fontWeight: "500",
    }}
  >
    {STATUS_OPTIONS.map((s) => (
      <option key={s} value={s}>
        {s}
      </option>
    ))}
  </select>
</div>


                  <h5 className="card-title mb-0 task-text-responsive">{t.text}</h5>
                </div>

                {/* RIGHT — ACTION BUTTONS */}
                <div className="text-end d-flex gap-1 task-action-buttons">

  {/* EDIT ICON */}
  <button
    className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center task-action-btn"
    onClick={() => openEditModal(t)}
    style={{
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      padding: 0,
    }}
    title="Edit"
  >
    <i className="bi bi-pencil-square"></i>
  </button>
  {/* DELETE ICON */}
  <button
    className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center task-action-btn"
    onClick={() => confirmDelete(t.id)}
    style={{
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      padding: 0,
    }}
    title="Delete"
  >
    <i className="bi bi-trash3"></i>
  </button>

</div>


              </div>
            </Paper>
          </TimelineContent>

        </TimelineItem>
      ))
    )}
  </Timeline>
</div>
{showAddBox && (
  <div
    className="card shadow add-task-box-responsive"
    style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "100%",
      maxWidth: "300px",
      zIndex: 1000,
      padding: "15px",
      borderRadius: "12px",
      animation: "slideUp 0.3s ease",
      margin: "0 15px",
    }}
  >
    <div className="d-flex justify-content-between align-items-center mb-2">
      <h6 className="m-0 add-task-title">Add Task</h6>
      <button
        className="btn-close"
        onClick={() => setShowAddBox(false)}
      ></button>
    </div>

    <input
      value={taskText}
      onChange={(e) => setTaskText(e.target.value)}
      className="form-control mb-3 add-task-input"
      placeholder="Enter task"
    />

    <button
      className="btn btn-success w-100 add-task-submit-btn"
      onClick={() => {
        addTask();
        setShowAddBox(false);
      }}
    >
      Add
    </button>
  </div>
)}


      {/* ---------- Edit Modal ---------- */}
      {showEditModal && editingTask && (
        <div className="modal show d-block modal-overlay-responsive" tabIndex="-1" role="dialog" style={{ padding: "15px" }}>
          <div className="modal-dialog modal-dialog-centered task-modal-responsive" role="document" style={{ maxWidth: "500px", width: "100%" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title modal-title-responsive">Edit Task</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Task Text</label>
                  <input
                    className="form-control modal-input-responsive"
                    value={editingTask.text}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, text: e.target.value })
                    }
                  />
                </div>

              </div>

              <div className="modal-footer d-flex flex-column flex-sm-row justify-content-end gap-2">
                
                <button className="btn btn-success modal-btn-responsive" onClick={saveEdit}>
                  Save 
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Delete Confirmation Modal ---------- */}
      {showDeleteConfirm && (
        <div className="modal show d-block modal-overlay-responsive" tabIndex="-1" role="dialog" style={{ padding: "15px" }}>
          <div className="modal-dialog modal-sm modal-dialog-centered task-modal-responsive" role="document" style={{ maxWidth: "400px", width: "100%" }}>
            <div className="modal-content">
              <div className="modal-body">
                <p className="delete-confirm-text">Are you sure you want to delete this task?</p>
                <div className="d-flex flex-column flex-sm-row justify-content-end gap-2">
                  <button
                    className="btn btn-secondary modal-btn-responsive"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-danger modal-btn-responsive" onClick={doDelete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}
