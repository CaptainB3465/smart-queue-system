import { db, collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp } from "../firebase";

/**
 * Adds a new user to the Firestore queue.
 * @param {string} name - The name of the customer.
 * @param {number} nextNumber - The number assigned to this customer.
 * @returns {Promise<string>} - The ID of the created document.
 */
export const addToQueue = async (name, nextNumber) => {
    try {
        const docRef = await addDoc(collection(db, "queues"), {
            name: name,
            number: nextNumber,
            status: "waiting",
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding to queue:", error);
        throw error;
    }
};

/**
 * Listens to real-time updates from the "queues" collection.
 * @param {function} setQueue - Callback to update the local state.
 * @returns {function} - Unsubscribe function.
 */
export const listenToQueue = (setQueue) => {
    const q = query(collection(db, "queues"), orderBy("createdAt", "asc"));
    
    return onSnapshot(q, (snapshot) => {
        const queueData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setQueue(queueData);
    });
};

/**
 * Updates the status of a queue item to "served".
 * @param {string} id - The document ID to update.
 */
export const serveNext = async (id) => {
    try {
        const docRef = doc(db, "queues", id);
        await updateDoc(docRef, { status: "served" });
    } catch (error) {
        console.error("Error serving next user:", error);
        throw error;
    }
};

/**
 * Updates the status of a queue item to "serving".
 * @param {string} id - The document ID to update.
 */
export const setAsServing = async (id) => {
    try {
        const docRef = doc(db, "queues", id);
        await updateDoc(docRef, { status: "serving" });
    } catch (error) {
        console.error("Error setting user as serving:", error);
        throw error;
    }
};
