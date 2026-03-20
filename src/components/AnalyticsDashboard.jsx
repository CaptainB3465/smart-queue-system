import React from 'react';
import { useQueue } from '../context/QueueContext';

const AnalyticsDashboard = () => {
    const { analytics, servedList, skippedList } = useQueue();

    return (
        <div className="analytics-container fade-in">
            <h2 className="section-title">Queue Analytics</h2>
            
            <div className="stats-grid">
                <div className="stat-card glass">
                    <span className="stat-label">Total Served</span>
                    <strong className="stat-value">{analytics.totalServed}</strong>
                </div>
                <div className="stat-card glass border-accent">
                    <span className="stat-label">Avg. Wait Time</span>
                    <strong className="stat-value">{analytics.avgWaitTime} <small>min</small></strong>
                </div>
                <div className="stat-card glass">
                    <span className="stat-label">Waiting Now</span>
                    <strong className="stat-value">{analytics.totalWaiting}</strong>
                </div>
                <div className="stat-card glass border-danger">
                    <span className="stat-label">Skipped</span>
                    <strong className="stat-value">{analytics.totalSkipped}</strong>
                </div>
            </div>

            <div className="analytics-details card glass mt-20">
                <h3>Activity Summary</h3>
                <div className="chart-simulation">
                    <div className="bar-group">
                        <div className="bar-label">Served</div>
                        <div className="bar-container">
                            <div 
                                className="bar-fill bg-success" 
                                style={{ width: `${(analytics.totalServed / (analytics.totalServed + analytics.totalSkipped || 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="bar-group">
                        <div className="bar-label">Skipped</div>
                        <div className="bar-container">
                            <div 
                                className="bar-fill bg-danger" 
                                style={{ width: `${(analytics.totalSkipped / (analytics.totalServed + analytics.totalSkipped || 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="recent-served-table card glass mt-20">
                <h3>Recently Served</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Wait time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servedList.slice(-5).reverse().map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.servedAt && item.createdAt ? 
                                    Math.round((item.servedAt.toDate() - item.createdAt.toDate()) / 60000) : '-'} min</td>
                                <td className="text-success">Completed</td>
                            </tr>
                        ))}
                        {servedList.length === 0 && <tr><td colSpan="3">No customers served yet</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
