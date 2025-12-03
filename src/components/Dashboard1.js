// Dashboard.js
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { auth, db } from "./firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("");
  const [userUID, setUserUID] = useState("");
  const [userRole, setUserRole] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);


  const navigate = useNavigate();
  const firstLetter = userEmail ? userEmail.charAt(0).toUpperCase() : "";

  // --------------------------
  // AUTH LISTENER + LOAD USER ROLE
  // --------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserUID(user.uid);

        const uRef = doc(db, "users", user.uid);
        const snap = await getDoc(uRef);
        if (snap.exists()) {
          setUserRole(snap.data().role || "user");
        } else {
          setUserRole("user");
        }
      } else {
        setUserEmail("");
        setUserUID("");
        setUserRole("");
      }
    });

    return () => unsubscribe();
  }, []);

  // --------------------------
  // LOAD PROJECTS (admin created)
  // --------------------------
  useEffect(() => {
    if (!userUID) return;

    const q = query(
  collection(db, "projects"),
  where("users", "array-contains", userUID)
);


    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProjects(list);
    });

    return () => unsub();
  }, [userUID]);

  useEffect(() => {
  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  loadUsers();
}, []);


  // --------------------------
  // ADD NEW PROJECT (Admin only)
  // --------------------------
  const addProject = async () => {
    if (!projectName.trim()) {
      alert("Please enter project name");
      return;
    }

    if (userRole !== "admin") {
      alert("Only admin can create projects");
      return;
    }

    try {
     await addDoc(collection(db, "projects"), {
  name: projectName,
  createdBy: userUID,
  users: [userUID],  // admin automatically assigned
  createdAt: serverTimestamp(),
});


      setProjectName("");
      alert("Project created");
    } catch (err) {
      console.error(err);
      alert("Failed to create project");
    }
  };

  // --------------------------
  // UPDATE PROJECT NAME
  // --------------------------
  const updateProject = async (id) => {
    if (!editName.trim()) return;

    try {
      const ref = doc(db, "projects", id);
      await updateDoc(ref, { name: editName });
      setEditId(null);
      setEditName("");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  // --------------------------
  // DELETE PROJECT
  // --------------------------
  const deleteProject = async (id) => {
    if (!window.confirm("Delete project permanently?")) return;

    try {
      await deleteDoc(doc(db, "projects", id));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  // --------------------------
  // LOGOUT
  // --------------------------
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  // --------------------------
  // VIEW PROJECT DETAILS
  // --------------------------
  const handleView = (id, name) => {
    navigate(`/view/${id}/${name}`);
  };
  //Assign Modal open
  const openAssignModal = async (project) => {
  if (userRole !== "admin") {
    alert("Only admin can assign users");
    return;
  }

  setSelectedProject(project);
  setAssignedUsers(project.users || []);

  const snap = await getDocs(collection(db, "users"));
  setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

  setShowAssignModal(true);
};

 // TOGGLE USER IN CHECKBOX
const toggleUser = (uid) => {
  setAssignedUsers((prev) =>
    prev.includes(uid)
      ? prev.filter((u) => u !== uid)   // remove
      : [...prev, uid]                  // add
  );
};
// SAVE ASSIGNED USERS TO FIRESTORE
const saveAssignedUsers = async () => {
  try {
    await updateDoc(doc(db, "projects", selectedProject.id), {
      users: assignedUsers,
    });
    
    setShowAssignModal(false);
  } catch (err) {
    console.error("Error Saving Assigned Users:", err);
    alert(err.message);
  }
};



  return (
    <div className="container-fluid p-0">

      <div className="w-100 text-center py-3" style={{ backgroundColor: "#2a8c7b" }}>
        <h1 className="text-white fw-bold display-4">Dashboard</h1>
      </div>

      <div className="row m-0">

        {/* Sidebar */}
        <div className="col-12 col-md-3 p-4" style={{ backgroundColor: "#e8e8e8", minHeight: "100vh" }}>
          <div
            className="mb-4"
            style={{
              width: "90px",
              height: "90px",
              backgroundColor: "#777",
              borderRadius: "50%",
              margin: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "40px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            {firstLetter}
          </div>

          <button className="btn w-100 mb-3 text-white fw-bold" style={{ backgroundColor: "#2a8c7b" }}>
            {userEmail}
          </button>
          <button className="btn w-100 mb-3 text-white fw-bold" style={{ backgroundColor: "#2a8c7b" }}>
            Settings
          </button>
          <button className="btn w-100 fw-bold text-white" style={{ backgroundColor: "black" }} onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Main */}
        <div className="col-12 col-md-9 p-4">

          {/* Admin: Create project */}
          {userRole === "admin" && (
            <div className="mb-4 p-3 shadow-sm bg-white">
              <h5 className="mb-3">Create New Project</h5>

              <div className="d-flex align-items-center mb-3">
                <input
                  type="text"
                  className="form-control fs-5"
                  placeholder="Project Name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{ border: "2px solid #2a8c7b" }}
                />
                <button
                  className="btn ms-3 text-white fs-4"
                  onClick={addProject}
                  style={{
                    backgroundColor: "#2a8c7b",
                    borderRadius: "50%",
                    width: "56px",
                    height: "56px",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}

   {/* Project Cards Grid */}
<div className="row">
  {projects.map((p) => (
    <div key={p.id} className="col-md-4 col-sm-6 mb-4">
      <div
        className="card shadow-sm p-3"
        style={{
          borderRadius: "12px",
          minHeight: "200px",
          borderLeft: "6px solid #2a8c7b",
        }}
      >
        {/* Project Name + Edit */}
        {editId === p.id ? (
          <input
            className="form-control fs-5 mb-2"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
        ) : (
          <h5 style={{ fontFamily: "serif" }}>{p.name}</h5>
        )}

        {/* Assigned Users (Admin Only) */}
        {userRole === "admin" && (
          <p className="text-muted mt-2">
            <strong>Assigned:</strong>{" "}
            {p.users && p.users.length > 0
              ? p.users
                  .map((uid) => {
                    const user = allUsers.find((u) => u.id === uid);
                    return user ? user.email : "Unknown";
                  })
                  .join(", ")
              : "None"}
          </p>
        )}

        {/* Buttons */}
        <div className="mt-auto d-flex justify-content-between">
          {editId === p.id ? (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => updateProject(p.id)}
            >
              Save
            </button>
          ) : (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                setEditId(p.id);
                setEditName(p.name);
              }}
            >
              Edit
            </button>
          )}

          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => deleteProject(p.id)}
          >
            Delete
          </button>

          {userRole === "admin" && (
            <button
              className="btn btn-sm btn-warning"
              onClick={() => openAssignModal(p)}
            >
              Assign
            </button>
          )}

          <button
            className="btn btn-sm text-white"
            style={{ backgroundColor: "#2a8c7b" }}
            onClick={() => handleView(p.id, p.name)}
          >
            View
          </button>
        </div>
      </div>
    </div>
  ))}

  {projects.length === 0 && (
    <div className="text-center text-muted mt-4">
      No projects created yet.
    </div>
  )}
</div>
{/* ASSIGN MODAL */}
{showAssignModal && (
  <div
    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
    style={{ background: "rgba(0,0,0,0.5)", zIndex: 99999 }}
  >
    <div className="bg-white p-4 rounded shadow" style={{ width: "380px" }}>
      <h4 className="mb-3">Assign Users</h4>

      <div style={{ maxHeight: "200px", overflowY: "auto" }}>
        {allUsers.map((u) => (
          <div key={u.id} className="d-flex align-items-center mb-2">
            <input
              type="checkbox"
              checked={assignedUsers.includes(u.id)}
              onChange={() => toggleUser(u.id)}
            />
            <span className="ms-2">{u.email}</span>
          </div>
        ))}
      </div>

      <div className="text-end mt-3">
        <button
          className="btn btn-secondary me-2"
          onClick={() => setShowAssignModal(false)}
        >
          Cancel
        </button>
        <button className="btn btn-primary" onClick={saveAssignedUsers}>
          Save
        </button>
      </div>
    </div>
  </div>
)}

</div>
</div>
</div>
  )}
