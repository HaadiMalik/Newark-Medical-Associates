import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addStaff, type AddStaffPayload } from '../../services/apiService';
import './AddStaffPage.css';

const AddStaffPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<AddStaffPayload>({
        name: '',
        employmentNumber: '',
        email: '',
        jobType: 'Physician',
        department: '',
        gender: '',
        dob: '',
        address: '',
        telephone: '',
        hire_date: '',
        salary: null,
        create_login: false,
        username: '',
        password: '',
        role: 'Physician'
    });
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'salary') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? null : parseFloat(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        if (!formData.name || !formData.email || !formData.jobType || !formData.department) {
            setError('Name, Email, Job Type, and Department are required.');
            setIsLoading(false);
            return;
        }
        if (formData.create_login && (!formData.username || !formData.password || !formData.role)) {
            setError('If creating login, Username, Password, and Role are required.');
            setIsLoading(false);
            return;
        }

        let payload: AddStaffPayload | null = null;

        try {
            payload = { ...formData };
            if (typeof payload.salary === 'number' && isNaN(payload.salary)) {
                payload.salary = null;
            }

            const response = await addStaff(payload);
            setSuccessMessage(
                `Staff member ${response.staffId ? ' (ID: ' + response.staffId + ')' : ''} added successfully!` +
                `${response.userId ? ' Login created (User ID: ' + response.userId + ').' : ''}`
            );
            setFormData({
                name: '', employmentNumber: '', email: '', jobType: 'Physician', department: '',
                gender: '', dob: '', address: '', telephone: '', hire_date: '',
                salary: null, create_login: false, username: '', password: '', role: 'Physician'
            });
        } catch (err: any) {
            console.error('Payload sent to addStaff:', payload);
            console.error('Full Axios error object:', err);
            if (err.response) {
                setError(err.response.data?.error || err.response.data?.message || err.message || 'Failed to add staff member. Please try again.');
            } else if (err.request) {
                setError('No response received from server. Please check network connection.');
            } else {
                setError(err.message || 'An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const jobTypes = ['Physician', 'Nurse', 'Support Staff', 'Admin', 'Surgeon', 'Technician', 'Pharmacist'];
    const roles = ['Doctor', 'Nurse', 'Support', 'Admin'];

    return (
        <div className="container">
            <h2 className="title">Add New Staff Member</h2>
            {error && <p className="errorMessage">{error}</p>}
            {successMessage && <p className="successMessage">{successMessage}</p>}
            <form onSubmit={handleSubmit} className="form">
                <label className="label" htmlFor="name">Name *</label>
                <input className="input" type="text" name="name" id="name" value={formData.name} onChange={handleChange} required />

                <label className="label" htmlFor="employmentNumber">Employment Number</label>
                <input className="input" type="text" name="employmentNumber" id="employmentNumber" value={formData.employmentNumber || ''} onChange={handleChange} />

                <label className="label" htmlFor="email">Email *</label>
                <input className="input" type="email" name="email" id="email" value={formData.email} onChange={handleChange} required />

                <label className="label" htmlFor="jobType">Job Type *</label>
                <select className="select" name="jobType" id="jobType" value={formData.jobType} onChange={handleChange} required>
                    {jobTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>

                <label className="label" htmlFor="department">Department *</label>
                <input className="input" type="text" name="department" id="department" value={formData.department} onChange={handleChange} required />

                <label className="label" htmlFor="telephone">Telephone</label>
                <input className="input" type="tel" name="telephone" id="telephone" value={formData.telephone} onChange={handleChange} />

                <label className="label" htmlFor="gender">Gender</label>
                <select className="select" name="gender" id="gender" value={formData.gender} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>

                <label className="label" htmlFor="dob">Date of Birth</label>
                <input className="input" type="date" name="dob" id="dob" value={formData.dob} onChange={handleChange} />

                <label className="label" htmlFor="address">Address</label>
                <textarea className="textarea" name="address" id="address" value={formData.address} onChange={handleChange} />

                <label className="label" htmlFor="hire_date">Hire Date</label>
                <input className="input" type="date" name="hire_date" id="hire_date" value={formData.hire_date} onChange={handleChange} />

                <label className="label" htmlFor="salary">Salary</label>
                <input className="input" type="number" name="salary" id="salary" value={formData.salary === null ? '' : formData.salary} onChange={handleChange} placeholder="e.g., 60000" />

                <hr className="hr" />
                <h4 className="subheading">Create Login (Optional)</h4>
                <div className="checkboxContainer">
                    <input className="checkbox" type="checkbox" name="create_login" id="create_login" checked={formData.create_login} onChange={handleChange} />
                    <label htmlFor="create_login" className="checkboxLabel">Create a login for this staff member?</label>
                </div>

                {formData.create_login && (
                    <>
                        <label className="label" htmlFor="username">Username *</label>
                        <input className="input" type="text" name="username" id="username" value={formData.username} onChange={handleChange} required={formData.create_login} />

                        <label className="label" htmlFor="password">Password *</label>
                        <input className="input" type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={formData.create_login} />

                        <label className="label" htmlFor="role">Role *</label>
                        <select className="select" name="role" id="role" value={formData.role} onChange={handleChange} required={formData.create_login}>
                            {roles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </>
                )}

                <button className="button" type="submit" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Staff Member'}
                </button>
            </form>
            <button className="button backButton" onClick={() => navigate('/staff')} disabled={isLoading}>
                Back to Staff List
            </button>
        </div>
    );
};

export default AddStaffPage;
