import React, { useState } from 'react';
import { auth, db, setDoc, doc } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { INDUSTRIES } from '../context/QueueContext';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [animating, setAnimating] = useState('enter');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role] = useState('admin');
    const [industry, setIndustry] = useState('Hospitals');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSwitchMode = () => {
        if (animating === 'leaving' || animating === 'entering') return;
        setAnimating('leaving');
        setTimeout(() => {
            setIsLogin(!isLogin);
            setAnimating('entering');
            setTimeout(() => {
                setAnimating('enter');
            }, 400);
        }, 400);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Set flag to prevent QueueContext from rendering the dashboard
                sessionStorage.setItem('isSigningUp', 'true');
                
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCred.user.uid), { role: 'admin', industry });
                
                await signOut(auth); // Immediately sign them out
                sessionStorage.removeItem('isSigningUp'); // Clear flag
                
                setIsLogin(true); // Manually swap the UI variable to Login
                handleSwitchMode(); // Trigger visual CSS animation
                alert("Account created successfully! You may now log in to the dashboard.");
                setLoading(false);
                return;
            }
        } catch (err) {
            setError(err.message);
            sessionStorage.removeItem('isSigningUp');
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper" style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px'
        }}>
            <div className="auth-container card glass bounce-in" style={{ maxWidth: '400px', width: '100%', margin: '0', overflow: 'hidden' }}>
                <div className={`auth-content ${animating}`}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px', gap: '12px' }}>
                        <div className="logo" style={{ width: '64px', height: '64px', fontSize: '1.8rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.5)' }}>
                            SQM
                        </div>
                        <h1 style={{ 
                            fontSize: '1.5rem', 
                            textAlign: 'center', 
                            background: 'linear-gradient(to right, #ffffff, #a855f7)', 
                            WebkitBackgroundClip: 'text', 
                            WebkitTextFillColor: 'transparent', 
                            fontWeight: '800',
                            lineHeight: '1.2'
                        }}>
                            Smart Queue <br/> Management
                        </h1>
                    </div>

                    <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.1rem', color: '#94a3b8', fontWeight: '500' }}>
                        {isLogin ? 'Log in to your account' : 'Create an administrative account'}
                    </h2>
                 
                    {error && <div className="badge-urgent" style={{ marginBottom: '15px' }}>{error}</div>}
                
                <form onSubmit={handleSubmit} className="form-group">
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="input-field"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="input-field"
                    />

                    {!isLogin && (
                        <div className="input-group mt-15">
                            <label className="label-text">Select Industry (Your Location):</label>
                            <select 
                                value={industry} 
                                onChange={(e) => setIndustry(e.target.value)}
                                className="input-field select-field"
                            >
                                {Object.keys(INDUSTRIES).map(ind => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn-primary mt-20" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>

                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#94a3b8' }}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button 
                        type="button"
                        onClick={handleSwitchMode} 
                        style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
