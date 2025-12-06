import React from "react";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import Login from "./components/Login.js";
import Dashboard from "./components/Dashboard.js";
import ViewTaskPage from "./components/ViewTaskPage.js";
import ProjectBoard from "./components/ProjectBoard.js";

function App() {
  


  return (
    <Router>
    <Routes>
    
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/view/:projectId/:projectName" element={<ViewTaskPage />} />
      <Route path="/board/:projectId/:projectName" element={<ProjectBoard />} />

    </Routes>
    <ToastContainer
      position="bottom-left"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    </Router>
  );
}

export default App;
