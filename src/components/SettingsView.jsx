import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';

const SettingsView = () => {
    const { userProfile, updateBrandName } = useQueue();
    const [brandName, setBrandName] = useState(userProfile?.brandName || 'Smart Queue');
    const [feedback, setFeedback] = useState('');
    const [saved, setSaved] = useState(false);

    const handleSaveBrand = async (e) => {
        e.preventDefault();
        await updateBrandName(brandName || 'Smart Queue');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleFeedback = (e) => {
        e.preventDefault();
        alert("Thank you for your feedback! Our team will review it.");
        setFeedback('');
    };

    return (
        <div className="settings-container fade-in">
            <div className="card glass">
                <h2>App Settings</h2>
                <form onSubmit={handleSaveBrand} className="form-group mt-20">
                    <label className="label-text">Custom Brand Heading (e.g. {userProfile?.industry || 'Hospital'} Advanced)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Enter brand name" 
                            value={brandName}
                            onChange={e => setBrandName(e.target.value)}
                        />
                        <button type="submit" className="btn-primary">Save</button>
                    </div>
                    {saved && <p className="text-success mt-10">Brand name updated successfully!</p>}
                </form>
            </div>

            <div className="card glass mt-20">
                <h2>Feedback & Support</h2>
                <p className="subtitle mt-10">We'd love to hear your thoughts on how we can improve Smart Queue.</p>
                <form onSubmit={handleFeedback} className="form-group mt-15">
                    <textarea 
                        className="input-field" 
                        rows="4" 
                        placeholder="Type your feedback here..."
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        required
                    ></textarea>
                    <button type="submit" className="btn-secondary mt-10">Submit Feedback</button>
                </form>

                <div className="support-info mt-30 p-15" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <h4>Need Help?</h4>
                    <p>Contact our support team anytime at:</p>
                    <strong style={{ color: 'var(--primary)' }}>support@smartqueue.app</strong>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
