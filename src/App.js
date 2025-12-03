import React from "react";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate
} from "react-router-dom";


import Login from "./components/Login.js";
import Dashboard from "./components/Dashboard.js";
import ViewTaskPage from "./components/ViewTaskPage.js";
function App() {
  


  return (
    <Router>
    <Routes>
    
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
   <Route path="/view/:projectId/:projectName" element={<ViewTaskPage />} />

    </Routes>
    </Router>
  );
}

export default App;
