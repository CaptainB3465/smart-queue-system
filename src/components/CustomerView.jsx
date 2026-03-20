import React, { useState, useEffect } from 'react';
import { useQueue, INDUSTRIES } from '../context/QueueContext';

const CustomerView = () => {
    const { joinQueue, waitingList, allCurrentlyServing, queue, analytics, adminIndustry } = useQueue();
    const [name, setName] = useState('');
    
    // Default service to the first service of the Admin's Industry
    const defaultService = INDUSTRIES[adminIndustry] ? INDUSTRIES[adminIndustry][0] : 'Unknown';
    const [service, setService] = useState(defaultService);
    const [isPriority, setIsPriority] = useState(false);
    const [myTaskId, setMyTaskId] = useState(localStorage.getItem('myTaskId'));
    const [isJoining, setIsJoining] = useState(false);

    // The queue item is created by QueueWorker with originalTaskId linking back to the task doc
    const myTicket = queue.find(item => item.originalTaskId === myTaskId);
    const myPosition = waitingList.findIndex(item => item.originalTaskId === myTaskId) + 1;
    const estimatedWait = myPosition * parseInt(analytics.avgWaitTime || 5);

    // Once the ticket appears in queue, clear the joining state
    useEffect(() => {
        if (myTicket) setIsJoining(false);
    }, [myTicket]);

    // Keep service in sync if adminIndustry changes quickly on load
    useEffect(() => {
        if (INDUSTRIES[adminIndustry] && !INDUSTRIES[adminIndustry].includes(service)) {
            setService(INDUSTRIES[adminIndustry][0]);
        }
    }, [adminIndustry]);

    // Show loading card while worker processes the task
    if (isJoining && !myTicket) {
        return (
            <div className="card glass bounce-in" style={{ textAlign: 'center' }}>
                <div className="badge-serving">Processing...</div>
                <div className="queue-number-large pulse">⏳</div>
                <p>Your ticket is being generated, please wait a moment...</p>
            </div>
        );
    }

    if (myTicket && (myTicket.status === 'waiting' || myTicket.status === 'serving')) {
        if (myTicket.status === 'waiting') {
            return (
                <div className="card glass bounce-in">
                    <h2>Your Ticket: #{myTicket.number}</h2>
                    <div className="queue-number-large pulse">#{myTicket.number}</div>
                    <p>Hello, <strong>{myTicket.name}</strong>!</p>
                    <p className="subtitle">Industry: {myTicket.industry}</p>
                    <p className="subtitle">Service: {myTicket.service}</p>
                    <div className="stats-mini mt-10">
                        <div className="stat-mini">
                            <span>Position</span>
                            <strong>{myPosition || '...'}</strong>
                        </div>
                        <div className="stat-mini">
                            <span>Est. Wait</span>
                            <strong>{estimatedWait || '5'} min</strong>
                        </div>
                    </div>
                    <button className="btn-secondary mt-20" onClick={() => {
                        localStorage.removeItem('myTaskId');
                        setMyTaskId(null);
                    }}>
                        Add Another Customer
                    </button>
                </div>
            );
        }
        
        return (
            <div className="card glass border-success bounce-in">
                <div className="badge-serving">IT'S YOUR TURN!</div>
                <h2>Go to Desk {myTicket.desk}</h2>
                <div className="queue-number-large success-pulse">#{myTicket.number}</div>
                <p>Please proceed to the {myTicket.industry} counter now.</p>
                <button className="btn-primary mt-20" onClick={() => {
                    localStorage.removeItem('myTaskId');
                    setMyTaskId(null);
                }}>
                    I'm done
                </button>
            </div>
        );
    }

    return (
        <div className="card glass fade-in">
            <h2>Get Your Ticket</h2>
            <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                    const taskId = await joinQueue(name, adminIndustry, service, isPriority);
                    localStorage.setItem('myTaskId', taskId);
                    setMyTaskId(taskId);
                    setIsJoining(true);
                    setName('');
                } catch (error) {
                    alert("Failed to join queue");
                }
            }} className="form-group">
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input-field"
                />

                <div className="input-group mt-15">
                    <label className="label-text">Select Service Required ({adminIndustry}):</label>
                    <select 
                        value={service} 
                        onChange={(e) => setService(e.target.value)}
                        className="input-field select-field"
                    >
                        {INDUSTRIES[adminIndustry] && INDUSTRIES[adminIndustry].map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                </div>

                <div className="checkbox-group mt-10">
                    <label className="switch">
                        <input 
                            type="checkbox" 
                            checked={isPriority} 
                            onChange={(e) => setIsPriority(e.target.checked)} 
                        />
                        <span className="slider round"></span>
                    </label>
                    <span>Priority / VIP Service</span>
                </div>
                <button type="submit" className="btn-primary mt-20">
                    Join Queue
                </button>
            </form>

            <div className="customer-status-board mt-30">
                <div className="status-section">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Currently Serving ({adminIndustry})</h3>
                    <div className="serving-grid-small">
                        {allCurrentlyServing.filter(item => item.industry === adminIndustry).map(item => (
                            <div key={item.id} className="serving-card-small pulse-border">
                                <div className="now-serving-number" style={{ fontSize: '1.5rem' }}>#{item.number}</div>
                                <div className="desk-label" style={{ fontSize: '0.7rem' }}>Desk {item.desk}</div>
                                <div className="service-tag" style={{ fontSize: '0.6rem' }}>{item.service}</div>
                            </div>
                        ))}
                        {allCurrentlyServing.filter(item => item.industry === adminIndustry).length === 0 && (
                            <p className="muted" style={{ fontSize: '0.9rem' }}>None currently being served.</p>
                        )}
                    </div>
                </div>

                <div className="status-section mt-20">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Waitlist ({adminIndustry})</h3>
                    <ul className="waitlist-list">
                        {waitingList.filter(item => item.industry === adminIndustry).map(item => (
                            <li key={item.id} className="waitlist-item">
                                <span className="waitlist-number">#{item.number}</span>
                                <span className="waitlist-service">{item.service}</span>
                            </li>
                        ))}
                        {waitingList.filter(item => item.industry === adminIndustry).length === 0 && (
                            <p className="muted" style={{ fontSize: '0.9rem' }}>The queue is currently empty!</p>
                        )}
                    </ul>
                </div>
            </div>

            <div className="qr-scan-promo mt-20">
                <div className="qr-box-small">QR</div>
                <p className="subtitle">Scan QR at entrance to join automatically</p>
            </div>
        </div>
    );
};

export default CustomerView;
