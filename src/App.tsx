import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import PrivateRoute from './components/PrivateRoute.tsx';
import Navbar from './components/Navbar.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Companies from './pages/Companies.tsx';
import MyLinks from './pages/MyLinks.tsx';
import Reports from './pages/Reports.tsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/links" element={<MyLinks />} />
                <Route path="/reports" element={<Reports />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;