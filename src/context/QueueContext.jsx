import React, { createContext, useState, useContext, useEffect, useMemo } from "react";
import { db, auth, collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp, getDoc } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const QueueContext = createContext();

export const useQueue = () => {
    const context = useContext(QueueContext);
    if (!context) {
        throw new Error("useQueue must be used within a QueueProvider");
    }
    return context;
};

export const INDUSTRIES = {
    'Hospitals': ['Triage', 'Consultation', 'Pharmacy', 'Laboratory', 'Billing'],
    'Banks': ['Teller', 'Loan Officer', 'Customer Service', 'Account Opening'],
    'Airports': ['Check-in', 'Security', 'Boarding', 'Baggage Claim', 'Immigration'],
    'Voting Sections': ['Registration', 'Verification', 'Voting Booth', 'Issue Resolution'],
    'Universities': ['Admissions', 'Financial Aid', 'Registrar', 'Student Services', 'Housing'],
    'High Schools': ['Administration', 'Counseling', 'Library', 'Clinic'],
    'Government Offices': ['ID Renewal', 'Licensing', 'Tax Inquiries', 'General Services'],
    'Tech Repair Centers': ['Diagnostics', 'Hardware Repair', 'Software Support', 'Pickup'],
    'Restaurants': ['Dine-in Waiting', 'Takeout Pickup', 'Customer Service']
};

export const QueueProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [queue, setQueue] = useState([]);
    const [deskNumber, setDeskNumber] = useState(localStorage.getItem('agentDesk') || '1');
    const [deskServices, setDeskServices] = useState(() => {
        const saved = localStorage.getItem('deskServices');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('deskServices', JSON.stringify(deskServices));
    }, [deskServices]);

    useEffect(() => {
        let profileUnsubscribe;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Attach live snapshot and bind user state *after* profile completes
                profileUnsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data());
                    } else {
                        setUserProfile({ role: 'admin', industry: 'Hospitals' });
                    }
                    setUser(currentUser); 
                    setAuthLoading(false);
                }, (err) => {
                    console.error("Error fetching user profile", err);
                    setUser(currentUser); // Fallback
                    setAuthLoading(false);
                });
            } else {
                if (profileUnsubscribe) {
                    profileUnsubscribe();
                    profileUnsubscribe = null;
                }
                setUser(null);
                setUserProfile(null);
                setAuthLoading(false);
            }
        });

        return () => {
            unsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('agentDesk', deskNumber);
    }, [deskNumber]);

    useEffect(() => {
        // Fetch all generic queues
        const q = query(collection(db, "queues"), orderBy("createdAt", "asc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const queueData = snapshot.docs.map((doc, index) => ({
                id: doc.id,
                ...doc.data(),
                number: index + 1
            }));
            setQueue(queueData);
        });

        return () => unsubscribe();
    }, []);

    const logout = () => signOut(auth);

    const updateDeskService = (desk, service) => {
        setDeskServices(prev => ({
            ...prev,
            [desk]: service
        }));
    };

    // Global sorted queue
    const sortedQueue = useMemo(() => {
        return [...queue].sort((a, b) => {
            if (a.priority === b.priority) return 0;
            return a.priority ? -1 : 1; 
        });
    }, [queue]);

    // Computed Stats - Specific to the Admin's Industry
    const adminIndustry = userProfile?.industry || 'Hospitals';
    
    let currentDeskService = deskServices[deskNumber];
    if (!currentDeskService || !INDUSTRIES[adminIndustry]?.includes(currentDeskService)) {
        currentDeskService = INDUSTRIES[adminIndustry] ? INDUSTRIES[adminIndustry][0] : 'Unknown';
    }
    
    // Global generic filters
    const contextQueue = sortedQueue.filter(item => item.industry === adminIndustry || !item.industry);
    
    const waitingList = contextQueue.filter(item => item.status === "waiting");
    
    // Specific Admin desk filters
    const deskWaitingList = waitingList.filter(item => item.service === currentDeskService);
    
    const currentlyServing = contextQueue.find(item => item.status === "serving" && String(item.desk) === String(deskNumber));
    const allCurrentlyServing = contextQueue.filter(item => item.status === "serving");
    const servedList = contextQueue.filter(item => item.status === "served");
    const skippedList = contextQueue.filter(item => item.status === "skipped");

    const analytics = useMemo(() => {
        const totalServed = servedList.length;
        const totalSkipped = skippedList.length;
        
        let totalWaitTime = 0;
        servedList.forEach(item => {
            if (item.createdAt && item.servedAt) {
                const wait = (item.servedAt.toDate() - item.createdAt.toDate()) / 60000;
                totalWaitTime += wait;
            }
        });
        
        const avgWaitTime = totalServed > 0 ? (totalWaitTime / totalServed).toFixed(1) : 0;

        return {
            totalServed,
            totalSkipped,
            avgWaitTime,
            totalWaiting: waitingList.length
        };
    }, [servedList, skippedList, waitingList]);

    const joinQueue = async (name, adminIndustry, service, isPriority = false) => {
        if (!user) throw new Error("User not authenticated");
        
        try {
            const docRef = await addDoc(collection(db, "tasks"), {
                userId: user.uid,
                name,
                industry: adminIndustry || 'Hospitals',
                service: service || INDUSTRIES['Hospitals'][0],
                priority: isPriority,
                status: "pending",
                createdAt: serverTimestamp()
            });
            
            return docRef.id;
        } catch (error) {
            console.error("Error joining queue:", error);
            throw error;
        }
    };

    const serveNext = async () => {
        if (deskWaitingList.length === 0) return;
        const nextToServe = deskWaitingList[0];

        try {
            const docRef = doc(db, "queues", nextToServe.id);
            await updateDoc(docRef, { 
                status: "serving",
                desk: deskNumber,
                servedAt: serverTimestamp() 
            });
        } catch (error) {
            console.error("Error serving next:", error);
        }
    };

    const skipCustomer = async (id) => {
        try {
            const docRef = doc(db, "queues", id);
            await updateDoc(docRef, { status: "skipped" });
        } catch (error) {
            console.error("Error skipping customer:", error);
        }
    };

    const completeServing = async (id) => {
        try {
            const docRef = doc(db, "queues", id);
            await updateDoc(docRef, { 
                status: "served",
                completedAt: serverTimestamp() 
            });
        } catch (error) {
            console.error("Error completing serving:", error);
        }
    };

    const updateBrandName = async (newName) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid), { brandName: newName });
            setUserProfile(prev => ({ ...prev, brandName: newName }));
        } catch (error) {
            console.error("Error updating brand name:", error);
        }
    };

    const value = {
        user,
        userProfile,
        authLoading,
        logout,
        queue: sortedQueue,
        allQueue: queue,
        waitingList,
        deskWaitingList,
        currentlyServing,
        allCurrentlyServing,
        servedList,
        skippedList,
        analytics,
        deskNumber,
        setDeskNumber,
        deskServices,
        updateDeskService,
        currentDeskService,
        adminIndustry,
        joinQueue,
        serveNext,
        skipCustomer,
        completeServing,
        updateBrandName,
        waitingCount: deskWaitingList.length,
        totalWaitingCount: waitingList.length
    };

    return (
        <QueueContext.Provider value={value}>
            {children}
        </QueueContext.Provider>
    );
};

