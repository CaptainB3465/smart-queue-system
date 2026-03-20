import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, where, addDoc, updateDoc, doc, serverTimestamp, orderBy, limit } from "../firebase";

const QueueWorker = () => {
    const [workerLogs, setWorkerLogs] = useState([]);
    const [isWorkerActive, setIsWorkerActive] = useState(true);

    const addLog = (msg) => {
        const timestamp = new Date().toLocaleTimeString();
        setWorkerLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
    };

    useEffect(() => {
        if (!isWorkerActive) return;

        addLog("🚀 MQ Worker Started - Listening for tasks...");

        const tasksRef = collection(db, "tasks");
        const failedTasksRef = collection(db, "failed_tasks");
        const queuesRef = collection(db, "queues");

        const q = query(tasksRef, where("status", "==", "pending"));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            for (const change of snapshot.docChanges()) {
                if (change.type === "added") {
                    const taskDoc = change.doc;
                    const taskData = taskDoc.data();
                    const taskId = taskDoc.id;

                    addLog(`📦 New Task: ${taskData.name} - ${taskId.substring(0, 6)}`);

                    try {
                        // 1. Claim task
                        await updateDoc(doc(db, "tasks", taskId), { 
                            status: "processing",
                            startedAt: serverTimestamp()
                        });

                        // 2. Process Business Logic: Move to high-priority if needed
                        await addDoc(queuesRef, {
                            userId: taskData.userId,
                            name: taskData.name,
                            industry: taskData.industry,
                            service: taskData.service,
                            priority: taskData.priority || false,
                            status: "waiting",
                            createdAt: serverTimestamp(),
                            originalTaskId: taskId
                        });

                        // 4. Mark as completed
                        await updateDoc(doc(db, "tasks", taskId), { 
                            status: "completed",
                            completedAt: serverTimestamp()
                        });
                        
                        addLog(`✅ Task ${taskId.substring(0, 6)} Success.`);

                    } catch (error) {
                        console.error("Worker Error:", error);
                        addLog(`❌ Error: ${taskId.substring(0, 6)} Failed.`);
                        
                        const currentRetries = taskData.retryCount || 0;
                        if (currentRetries >= 3) {
                            await addDoc(failedTasksRef, {
                                ...taskData,
                                originalTaskId: taskId,
                                error: error.message,
                                failedAt: serverTimestamp()
                            });
                            await updateDoc(doc(db, "tasks", taskId), { status: "failed" });
                        } else {
                            await updateDoc(doc(db, "tasks", taskId), { 
                                status: "pending",
                                retryCount: currentRetries + 1,
                                lastError: error.message
                            });
                        }
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [isWorkerActive]);

    // This component renders a small status panel in the AdminView
    return (
        <div className="worker-status-panel card glass mt-20">
            <div className="worker-header">
                <h3>Message Queue Worker</h3>
                <label className="switch">
                    <input 
                        type="checkbox" 
                        checked={isWorkerActive} 
                        onChange={(e) => setIsWorkerActive(e.target.checked)} 
                    />
                    <span className="slider round"></span>
                </label>
            </div>
            <div className="worker-logs mt-10">
                {workerLogs.map((log, i) => (
                    <div key={i} className={`log-entry ${log.includes('❌') ? 'text-danger' : log.includes('✅') ? 'text-success' : ''}`}>
                        {log}
                    </div>
                ))}
                {workerLogs.length === 0 && <p className="muted">Waiting for tasks...</p>}
            </div>
        </div>
    );
};

export default QueueWorker;
