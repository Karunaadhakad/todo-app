import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import googleLogo from "../img/google.png";

import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  // -----------------------------------------------------
  // 🔍 Check if email exists in Firestore users collection
  // -----------------------------------------------------
  const checkEmailInFirestore = async (userEmail) => {
    const q = query(collection(db, "users"), where("email", "==", userEmail));
    const snap = await getDocs(q);
    return !snap.empty; // found = true
  };

  // -----------------------------------------------------
  // 🔐 EMAIL + PASSWORD LOGIN
  // -----------------------------------------------------
  const handleLogin = async () => {
  if (!email || !password) {
    alert("Please enter email & password!");
    return;
  }

  try {
    // Step 1: Firebase Auth Login
    const userCred = await signInWithEmailAndPassword(auth, email, password);

    // Step 2: Save user to Firestore with UID as document ID
   await setDoc(
        doc(db, "users", userCred.user.uid),
        { email: userCred.user.email },
        { merge: true } // 🔥 role delete नहीं होगा
      );

    console.log("Current User:", auth.currentUser);

    alert("Login Successful!");
    navigate("/dashboard");
  } catch (err) {
    console.log("error:", err.code, err.message);
    alert(err.message);
  }
};

  // -----------------------------------------------------
  // 🔵 GOOGLE LOGIN + Save user in Firestore
  // -----------------------------------------------------
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Firestore check
      const exists = await checkEmailInFirestore(user.email);

      if (!exists) {
        alert("Your Google Account is not allowed to login!");
        return;
      }

      // SAVE user UID-based document in Firestore
      // await setDoc(doc(db, "users", user.uid), {
      //   email: user.email,
      // });

      alert("Google Login Successful!");
      navigate("/dashboard");

    } catch (error) {
      console.log(error);
      alert("Google sign-in failed!");
    }
  };

  // -----------------------------------------------------
  // UI PART
  // -----------------------------------------------------
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{
        minHeight: "100vh",
        backgroundColor: "#2a8c7b",
        position: "relative",
      }}
    >
      <h1
        className="fw-bold text-white position-absolute"
        style={{
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "3rem",
          color: "#fff8cc",
        }}
      >
        Login
      </h1>

      <div
        className="bg-white p-4 p-md-5 shadow rounded w-100"
        style={{ maxWidth: "500px", marginTop: "90px" }}
      >
        <div className="mb-4">
          <label className="fw-bold fs-5">User Email :</label>
          <input
            type="email"
            className="form-control mt-2"
            placeholder="Enter email"
            style={{ border: "2px solid #2a8c7b" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="fw-bold fs-5">Password :</label>
          <input
            type="password"
            className="form-control mt-2"
            placeholder="Enter password"
            style={{ border: "2px solid #2a8c7b" }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={handleLogin}
          className="btn text-white fw-bold w-100 py-2 fs-5"
          style={{ backgroundColor: "#2a8c7b" }}
        >
          Login
        </button>

        <div className="text-center mt-4">
          <p>-- Or continue with --</p>

          <button
            onClick={handleGoogleLogin}
            className="btn mt-2 d-flex align-items-center justify-content-center w-100"
          >
            <img
              src={googleLogo}
              alt="Google"
              style={{ width: "60%", marginRight: "12px" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
