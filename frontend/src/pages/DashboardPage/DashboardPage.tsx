import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="container">
            <h2>Dashboard</h2>
            {user && <p className="welcomeMessage">Welcome, {user.username} ({user.role})!</p>}
            <p>This is your main dashboard. From here, you can access various parts of the application.</p>
             <div className="quick-action">
                <h4>Quick Actions:</h4>
                <button onClick={() => navigate('/appointments')}>
          Book New Appointment
        </button>
         </div>
        </div>
    );
};

export default DashboardPage;
