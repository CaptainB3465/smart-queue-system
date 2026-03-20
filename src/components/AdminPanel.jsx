import React from 'react';
import { useQueue, INDUSTRIES } from '../context/QueueContext';
import QueueWorker from '../workers/queueWorker';

const AdminPanel = () => {
    const { 
        deskWaitingList, 
        currentlyServing, 
        serveNext, 
        skipCustomer, 
        completeServing, 
        waitingCount,
        deskNumber,
        setDeskNumber,
        deskServices,
        updateDeskService,
        currentDeskService,
        adminIndustry
    } = useQueue();

    const formatTime = (createdAt) => {
        if (!createdAt) return '...';
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="admin-container fade-in">
            <div className="admin-header card glass">
                <div className="desk-config">
                    <div className="desk-selector">
                        <label>Active Desk:</label>
                        <select value={deskNumber} onChange={(e) => setDeskNumber(e.target.value)} className="select-field">
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Desk {n}</option>)}
                        </select>
                    </div>
                    <div className="service-selector">
                        <label>{adminIndustry} Service:</label>
                        <select 
                            value={currentDeskService} 
                            onChange={(e) => updateDeskService(deskNumber, e.target.value)}
                            className="select-field"
                        >
                            {INDUSTRIES[adminIndustry] && INDUSTRIES[adminIndustry].map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="admin-actions card glass border-accent mt-20">
                {currentlyServing ? (
                    <div className="serving-status">
                        <div className="badge-serving">SERVING: {currentDeskService}</div>
                        <div className="queue-number-large">#{currentlyServing.number}</div>
                        <h3>{currentlyServing.name}</h3>
                        <div className="button-group mt-20">
                            <button className="btn-success" onClick={() => completeServing(currentlyServing.id)}>
                                Complete
                            </button>
                            <button className="btn-danger" onClick={() => skipCustomer(currentlyServing.id)}>
                                Skip
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="waiting-status">
                        <div className="mb-10">
                            <span className="badge-info">{currentDeskService}</span>
                        </div>
                        <button 
                            className="btn-primary btn-large" 
                            onClick={serveNext}
                            disabled={waitingCount === 0}
                        >
                            Serve Next ({waitingCount})
                        </button>
                        {waitingCount === 0 && <p className="subtitle mt-10">No {currentDeskService} tasks</p>}
                    </div>
                )}
            </div>

            <div className="waiting-list card glass mt-20">
                <h3>{currentDeskService} Waitlist</h3>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deskWaitingList.map(item => (
                            <tr key={item.id} className={item.priority ? 'priority-row' : ''}>
                                <td>{item.number}</td>
                                <td>
                                    {item.name}
                                    {item.priority && <span className="priority-pill">VIP</span>}
                                </td>
                                <td><span className="status-waiting">Waiting</span></td>
                                <td>{formatTime(item.createdAt)}</td>
                                <td>
                                    <button className="btn-small btn-danger" onClick={() => skipCustomer(item.id)}>
                                        Skip
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {deskWaitingList.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                    No {currentDeskService} customers
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <QueueWorker />
        </div>
    );
};

export default AdminPanel;
