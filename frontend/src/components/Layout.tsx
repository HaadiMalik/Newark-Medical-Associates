import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
    const { user, logout, isAuthenticated, hasRole } = useAuth();

    const canAccessInPatientsRoles = ['Admin', 'Doctor', 'Nurse', 'Support'];
    const canAccessAppointmentsRoles = ['Admin', 'Support', 'Doctor', 'Nurse'];
    const canAccessShiftsRoles = ['Admin', 'Doctor', 'Nurse'];
    const canBookSurgeryRoles = ['Admin', 'Doctor'];
    const canViewScheduledSurgeriesRoles = ['Admin', 'Doctor', 'Nurse'];

    return (
        <>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    {isAuthenticated() ? (
                        <>
                            <li><Link to="/dashboard">Dashboard</Link></li>
                            <li><Link to="/staff">Staff</Link></li>
                            <li><Link to="/patients">Patients</Link></li>
                            {user && hasRole(canAccessInPatientsRoles) && (
                                <li><Link to="/inpatients">In-Patients</Link></li>
                            )}
                            {user && hasRole(canAccessAppointmentsRoles) && (
                                <li><Link to="/appointments">Appointments</Link></li>
                            )}
                            {user && hasRole(canAccessShiftsRoles) && (
                                <li><Link to="/shifts">Shifts</Link></li>
                            )}
                            {user && hasRole(canBookSurgeryRoles) && (
                                <li><Link to="/book-surgery">Book Surgery</Link></li>
                            )}
                            {user && hasRole(canViewScheduledSurgeriesRoles) && (
                                <li><Link to="/view-scheduled-surgeries">View Scheduled Surgeries</Link></li>
                            )}
                            {user && <li><span>Welcome, {user.username} ({user.role})</span></li>}
                            <li>
                                <button onClick={logout}>Logout</button>
                            </li>
                        </>
                    ) : (
                        <li><Link to="/login">Login</Link></li>
                    )}
                </ul>
            </nav>
            <div className="page-content">
                <Outlet /> 
            </div>
        </>
    );
};

export default Layout; 