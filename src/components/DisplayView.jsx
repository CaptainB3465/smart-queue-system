import React from 'react';
import { useQueue } from '../context/QueueContext';

const DisplayView = () => {
    const { allCurrentlyServing, waitingList, adminIndustry } = useQueue();
    
    // Filter by selected TV industry (strictly bound to admin profile)
    const filteredServing = allCurrentlyServing.filter(item => item.industry === adminIndustry || !item.industry);
    const filteredWaiting = waitingList.filter(item => item.industry === adminIndustry || !item.industry);
    const nextFive = filteredWaiting.slice(0, 5);

    return (
        <div className="display-container-advanced fade-in">
            <div className="display-heading">
                <h2>NOW SERVING: {adminIndustry.toUpperCase()}</h2>
                <p className="subtitle">Please proceed to your assigned desk</p>
            </div>
            
            <div className="serving-grid">
                {filteredServing.length > 0 ? (
                    filteredServing.map(serving => (
                        <div key={serving.id} className="serving-card glass pulse-border">
                            <div className="desk-label">DESK {serving.desk}</div>
                            <div className="now-serving-number">#{serving.number}</div>
                            <div className="service-tag">{serving.service}</div>
                            <div className="serving-name">{serving.name}</div>
                        </div>
                    ))
                ) : (
                    <div className="serving-card glass muted">
                        <div className="desk-label">LOBBY</div>
                        <div className="now-serving-number">--</div>
                        <div className="serving-name">Waiting for next...</div>
                    </div>
                )}
            </div>

            <div className="bottom-display mt-30">
                <div className="next-in-line card glass">
                    <h4>Next in Line</h4>
                    <div className="next-grid">
                        {nextFive.map(item => (
                            <div key={item.id} className="next-item glass-dark">
                                <span className={item.priority ? 'priority-pill-small' : 'number-pill'}>
                                    #{item.number}
                                </span>
                                <div className="next-info">
                                    <span className="name">{item.name}</span>
                                    <span className="service-mini">{item.service}</span>
                                </div>
                            </div>
                        ))}
                        {nextFive.length === 0 && <p className="muted">No one waiting</p>}
                    </div>
                </div>

                <div className="announcement card glass">
                    <div className="ticker-wrap">
                        <div className="ticker">
                            Welcome to Smart Queue. We offer 10 specialized desks for your convenience. Please ensure you have selected the correct service in the Customer View.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisplayView;
