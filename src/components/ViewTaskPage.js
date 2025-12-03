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
      updatedBy: auth.currentUser?.email ?? editingTask.updatedBy ?? "Guest",
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
        className="w-100 d-flex align-items-center justify-content-between px-3 py-3 mb-4"
        style={{ backgroundColor: "#2a8c7b" }}
      >
        <button
          className="btn btn-light"
          style={{ borderRadius: "50%" }}
          onClick={() => window.history.back()}
        >
          ←
        </button>

        <div className="text-center">
          <h1 className="text-white  fw-bold ">TASKS</h1>
          <h2 className="text-white" style={{ fontSize: "14px" }}>
            {projectName}
          </h2>
        </div>

        <div style={{ width: "40px" }} />
      </div>

      {/* Add + Search */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* Floating Add Button */}
      <button onClick={() => setShowAddBox(true)} className="btn btn-success shadow-lg"
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
  className="input-group shadow-sm ms-auto"
  style={{
    width: "35%",
    maxWidth: "300px",
  }}
>
  <input
    className="form-control"
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
    
<div>
  <Timeline position="right">   {/* force items to the right */}
    {filtered.length === 0 ? (
      <div style={{ padding: 24 }}>
        <p className="text-center text-muted mt-4">No tasks found.</p>
      </div>
    ) : (
      filtered.map((t) => (
        <TimelineItem key={t.id}>

          {/* LEFT SIDE — ONLY DATE */}
          <TimelineOppositeContent
            align="right"
            sx={{ m: "auto 0", fontWeight: 600 }}
            color="text.secondary"
          >
            {formatTs(t.updatedAt)}
          </TimelineOppositeContent>

          <TimelineSeparator>
            <TimelineDot color="success" />
            <TimelineConnector />
          </TimelineSeparator>

          {/* RIGHT SIDE — COMPLETE TASK CARD */}
          <TimelineContent sx={{ py: "20px", px: 2 }}>
            <Paper elevation={2} style={{ padding: 14, borderRadius: 10, maxWidth: "330px", }}>
              <div className="d-flex align-items-start justify-content-between">

                {/* LEFT — TEXT & STATUS */}
                <div style={{ maxWidth: "75%" }}>
                  <div className="small text-muted mb-2">
                    Updated By: <strong>{t.updatedBy}</strong>
                  </div>

                  {/* status dropdown inline update */}
                 <div className="d-flex align-items-center mb-2">
  <label className="me-2 small mb-0">Status:</label>

  <select
    className="form-select form-select-sm"
    value={t.status}
    onChange={async (e) => {
      const user = auth.currentUser;
      const by = user?.email ?? "Guest";
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


                  <h5 className="card-title mb-0">{t.text}</h5>
                </div>

                {/* RIGHT — ACTION BUTTONS */}
                <div className="text-end d-flex">

  {/* EDIT ICON */}
  <button
    className="btn btn-sm btn-outline-primary mb-2 d-flex align-items-center justify-content-center"
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
 &nbsp;
  {/* DELETE ICON */}
  <button
    className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
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
    className="card shadow"
    style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "300px",
      zIndex: 1000,
      padding: "15px",
      borderRadius: "12px",
      animation: "slideUp 0.3s ease",
    }}
  >
    <div className="d-flex justify-content-between align-items-center mb-2">
      <h6 className="m-0">Add Task</h6>
      <button
        className="btn-close"
        onClick={() => setShowAddBox(false)}
      ></button>
    </div>

    <input
      value={taskText}
      onChange={(e) => setTaskText(e.target.value)}
      className="form-control mb-3"
      placeholder="Enter task"
    />

    <button
      className="btn btn-success w-100"
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
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Task</h5>
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
                    className="form-control"
                    value={editingTask.text}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, text: e.target.value })
                    }
                  />
                </div>

              </div>

              <div className="modal-footer">
                
                <button className="btn btn-success" onClick={saveEdit}>
                  Save 
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Delete Confirmation Modal ---------- */}
      {showDeleteConfirm && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-body">
                <p>Are you sure you want to delete this task?</p>
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-secondary me-2"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={doDelete}>
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
