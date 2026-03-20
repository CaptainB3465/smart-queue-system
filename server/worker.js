import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, where, addDoc, updateDoc, doc, serverTimestamp, getDocs, orderBy, limit } from "firebase/firestore";

// Reuse the same config as frontend (for simulation purposes)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🚀 MQ Worker Started - Listening for tasks...");

/**
 * Worker Logic:
 * 1. Listen for 'pending' tasks.
 * 2. Competing Consumer: Use a 'processing' status to ensure single-worker pickup.
 * 3. Process: Add to 'queues' collection.
 * 4. Cleanup: Mark task as 'completed' or move to 'failed_tasks' (DLQ) after 3 retries.
 */

const tasksRef = collection(db, "tasks");
const failedTasksRef = collection(db, "failed_tasks");
const queuesRef = collection(db, "queues");

// Query for pending tasks
const q = query(tasksRef, where("status", "==", "pending"), orderBy("createdAt", "asc"), limit(10));

onSnapshot(q, async (snapshot) => {
    for (const change of snapshot.docChanges()) {
        if (change.type === "added") {
            const taskDoc = change.doc;
            const taskData = taskDoc.data();
            const taskId = taskDoc.id;

            console.log(`📦 New Task Received: ${taskId} for ${taskData.name}`);

            try {
                // 1. Claim task (Atomic update for Competing Consumers)
                // In a real distributed system, we'd use a transaction or 'processedBy' field.
                await updateDoc(doc(db, "tasks", taskId), { 
                    status: "processing",
                    processedBy: "worker-node-1",
                    startedAt: serverTimestamp()
                });

                // 2. Business Logic: Process Queue Entry
                console.log(`⚙️ Processing ${taskData.name}...`);
                
                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, 1500));

                await addDoc(queuesRef, {
                    name: taskData.name,
                    priority: taskData.priority || false,
                    status: "waiting",
                    createdAt: serverTimestamp(),
                    processedAt: serverTimestamp(),
                    originalTaskId: taskId
                });

                // 3. Mark as completed
                await updateDoc(doc(db, "tasks", taskId), { 
                    status: "completed",
                    completedAt: serverTimestamp()
                });
                
                console.log(`✅ Task ${taskId} Completed Successfully.`);

            } catch (error) {
                console.error(`❌ Error processing task ${taskId}:`, error);
                
                const currentRetries = taskData.retryCount || 0;
                if (currentRetries >= 3) {
                    // Move to DLQ (Dead Letter Queue)
                    console.log(`⚠️ Task ${taskId} failed 3 times. Moving to DLQ.`);
                    await addDoc(failedTasksRef, {
                        ...taskData,
                        originalTaskId: taskId,
                        error: error.message,
                        failedAt: serverTimestamp()
                    });
                    await updateDoc(doc(db, "tasks", taskId), { status: "failed" });
                } else {
                    // Retry logic: increment retry count and set back to pending
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
