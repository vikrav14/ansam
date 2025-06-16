import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, onSnapshot, updateDoc, serverTimestamp, addDoc, orderBy, limit } from 'firebase/firestore';

// --- Firebase & App Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyAv7gNc17ZsVQUQSyibzRenabKLoqlRPBY",
    authDomain: "safekids-6465b.firebaseapp.com",
    projectId: "safekids-6465b",
    storageBucket: "safekids-6465b.firebasestorage.app",
    messagingSenderId: "1020322926990",
    appId: "1:1020322926990:web:a13e32672697f9bffb94df",
    measurementId: "G-1KMGMSF0E9"
};

// --- App Initialization ---
const appId = firebaseConfig.projectId || 'mauzenfan-app-default';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const USERS_COLLECTION = `/artifacts/${appId}/public/data/users`;
const FAMILIES_COLLECTION = `/artifacts/${appId}/public/data/families`;
const SAFE_ZONES_COLLECTION = `/artifacts/${appId}/public/data/safezones`;
const ALERTS_COLLECTION = `/artifacts/${appId}/public/data/alerts`;

// --- SVG Icons ---
const Icon = ({ name, className }) => {
    const icons = {
        map: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></>,
        shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>,
        settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></>,
        plus: <><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></>,
        siren: <><path d="M5.5 12.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm14 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM12 2a9 9 0 0 0-9 9v4.5a.5.5 0 0 0 1 0V11a8 8 0 0 1 16 0v4.5a.5.5 0 0 0 1 0V11a9 9 0 0 0-9-9z"></path><path d="M12 15a4 4 0 0 0-4 4v1h8v-1a4 4 0 0 0-4-4z"></path></>,
        'map-pin': <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></>,
        sparkles: <path d="M9.5 2.5l1-1 1 1 2 2 1 1-1 1-2 2-1 1-1-1-2-2-1-1 1-1 2-2zM4.5 9.5l1-1 1 1 2 2 1 1-1 1-2 2-1 1-1-1-2-2-1-1 1-1 2-2zM15 14l-1 1-2 2-1 1-1-1-2-2-1-1 1-1 2-2 1-1 1 1 2 2 1 1z"/>,
        logo: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    };
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{icons[name]}</svg>;
};

// Updated Modal to use DaisyUI classes
const Modal = ({ children, onClose, size = 'md' }) => ( // Default size 'md' for DaisyUI
    <dialog className="modal modal-open">
        <div className={`modal-box max-w-${size}`}>
            <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
            </form>
            {children}
        </div>
         {/* Optional: Click outside to close */}
        <form method="dialog" className="modal-backdrop">
            <button onClick={onClose}>close</button>
        </form>
    </dialog>
);

const FamilySetup = ({ user, setUserData }) => {
    const [familyIdInput, setFamilyIdInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const createFamily = async () => { setIsLoading(true); setError(''); const newFamilyId = `fam-${crypto.randomUUID().slice(0, 8)}`; try { await setDoc(doc(db, FAMILIES_COLLECTION, newFamilyId), { createdAt: serverTimestamp(), owner: user.uid }); const newUserData = { ...user, familyId: newFamilyId, role: 'parent' }; await setDoc(doc(db, USERS_COLLECTION, user.uid), newUserData, { merge: true }); setUserData(newUserData); } catch (err) { console.error("Error creating family:", err); setError("Could not create family. Please try again."); } setIsLoading(false); };
    const joinFamily = async () => { if (!familyIdInput.trim()) { setError("Please enter a Family ID."); return; } setIsLoading(true); setError(''); try { const familyDoc = await getDoc(doc(db, FAMILIES_COLLECTION, familyIdInput)); if (familyDoc.exists()) { const newUserData = { ...user, familyId: familyIdInput, role: 'child' }; await setDoc(doc(db, USERS_COLLECTION, user.uid), newUserData, { merge: true }); setUserData(newUserData); } else { setError("Family ID not found. Please check and try again."); } } catch (err) { console.error("Error joining family:", err); setError("Could not join family. Please try again."); } setIsLoading(false); };
    return (
        <div className="hero min-h-screen bg-base-200">
            <div className="hero-content flex-col lg:flex-row-reverse">
                <div className="text-center lg:text-left">
                     <Icon name="logo" className="w-16 h-16 text-primary mx-auto mb-4"/>
                    <h1 className="text-5xl font-bold">Welcome to MauZenfan!</h1>
                    <p className="py-6">Your family's safety, connected. Join or create a family to get started.</p>
                </div>
                <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
                    <form className="card-body">
                        {error && <div role="alert" className="alert alert-error"><svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{error}</span></div>}
                        <div className="form-control">
                            <h2 className="text-xl font-bold mb-2">Join an Existing Family</h2>
                            <label className="label">
                                <span className="label-text">Family ID</span>
                            </label>
                            <input type="text" value={familyIdInput} onChange={(e) => setFamilyIdInput(e.target.value)} placeholder="Enter Family ID" className="input input-bordered input-primary w-full" />
                        </div>
                        <div className="form-control mt-6">
                            <button type="button" onClick={joinFamily} disabled={isLoading} className="btn btn-primary w-full">
                                {isLoading ? <span className="loading loading-spinner"></span> : 'Join Family'}
                            </button>
                        </div>
                        <div className="divider">OR</div>
                        <div className="form-control">
                             <h2 className="text-xl font-bold mb-2">Create a New Family</h2>
                            <button type="button" onClick={createFamily} disabled={isLoading} className="btn btn-secondary w-full">
                                {isLoading ? <span className="loading loading-spinner"></span> : 'Create New Family'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const IFrameMapView = ({ center }) => { const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center[1]-0.01},${center[0]-0.01},${center[1]+0.01},${center[0]+0.01}&layer=mapnik&marker=${center[0]},${center[1]}`; return ( <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={mapUrl} style={{ border: 'none' }} ></iframe> ); };

const AddSafeZoneModal = ({ onClose, familyId, userLocation }) => {
    const [zoneName, setZoneName] = useState('');
    const [radius, setRadius] = useState(150);
    // Ensure userLocation is defined before trying to access its properties
    const [center, setCenter] = useState(userLocation ? { lat: userLocation[0], lng: userLocation[1] } : { lat: -20.24, lng: 57.58 }); // Default to a fallback if needed
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!zoneName.trim()) {
            alert("Please enter a name for the zone.");
            return;
        }
        setIsLoading(true);
        try {
            await addDoc(collection(db, SAFE_ZONES_COLLECTION), {
                familyId: familyId,
                name: zoneName,
                center: { latitude: center.lat, longitude: center.lng },
                radius: Number(radius)
            });
            onClose();
        } catch (error) {
            console.error("Error saving safe zone: ", error);
            alert("Could not save the safe zone. Please try again.");
        }
        setIsLoading(false);
    };

    return (
        <Modal onClose={onClose} size="lg"> {/* Ensure Modal component is updated to handle size prop correctly with DaisyUI classes */}
            <div className="flex flex-col"> {/* Removed h-[70vh] for auto sizing by content */}
                <h3 className="text-2xl font-bold mb-6 text-center">Add a New Safe Zone</h3>
                <div className="h-48 bg-base-200 rounded-lg mb-4 flex items-center justify-center">
                    <p className="text-base-content/60">Interactive location picker not available in this view.</p>
                </div>
                <div className="space-y-4">
                    <input type="text" value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="e.g., Lekol, Lakaz..." className="input input-bordered w-full" />
                    <div>
                        <label className="label">
                            <span className="label-text">Radius: {radius}m</span>
                        </label>
                        <input type="range" min="50" max="500" value={radius} onChange={e => setRadius(e.target.value)} className="range range-primary" />
                    </div>
                </div>
                <button onClick={handleSave} disabled={isLoading} className="btn btn-primary w-full mt-6">
                    {isLoading ? <span className="loading loading-spinner"></span> : 'Save Zone'}
                </button>
            </div>
        </Modal>
    );
};

const SafeZonesView = ({ safeZones, familyId, userLocation }) => {
    const [isAdding, setIsAdding] = useState(false);
    // Ensure userLocation is available before rendering AddSafeZoneModal
    const handleAddNewClick = () => {
        if (userLocation && userLocation.length === 2) {
            setIsAdding(true);
        } else {
            alert("User location is not available yet. Please wait a moment and try again.");
            console.warn("AddSafeZoneModal cannot be opened: userLocation is not yet available.", userLocation);
        }
    };

    return (
        <div className="p-4 bg-base-200 h-full overflow-y-auto">
            {isAdding && userLocation && <AddSafeZoneModal onClose={() => setIsAdding(false)} familyId={familyId} userLocation={userLocation} />}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-base-content">Safe Zones</h2>
                <button onClick={handleAddNewClick} className="btn btn-primary">
                    <Icon name="plus" className="w-5 h-5" />
                    Add New
                </button>
            </div>
            <div className="space-y-4">
                {safeZones.length > 0 ? safeZones.map(zone => (
                    <div key={zone.id} className="card bg-base-100 shadow-md border border-base-300">
                        <div className="card-body flex-row items-center space-x-4 p-4">
                             <div className="avatar placeholder">
                                <div className="bg-green-500 text-neutral-content rounded-full w-12 h-12">
                                   <Icon name="shield" className="text-white w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <p className="card-title text-lg">{zone.name}</p>
                                <p className="text-sm text-base-content/70">{zone.radius}m radius</p>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-10 card bg-base-100 shadow border border-base-300 border-dashed">
                        <div className="card-body items-center text-center">
                             <Icon name="shield" className="w-16 h-16 text-base-content/30 mb-4" />
                            <p className="text-xl font-semibold text-base-content/70">You haven't added any Safe Zones yet.</p>
                            <p className="text-base-content/50 text-sm mt-1">Click 'Add New' to create one for home or school.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ChildDashboard = ({ userData, familyId }) => {
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState(''); // 'success', 'info', 'error'

    const handleCheckIn = async () => {
        const userDocRef = doc(db, USERS_COLLECTION, userData.uid);
        const checkInTime = new Date();
        await updateDoc(userDocRef, { lastCheckIn: serverTimestamp() });
        if (checkInTime.getHours() >= 17) {
            const alertMessage = `${userData.name || 'Your child'} checked in after 5 PM.`;
            await addDoc(collection(db, ALERTS_COLLECTION), { familyId: familyId, message: alertMessage, timestamp: serverTimestamp(), userId: userData.uid });
        }
        setStatusMessage('Checked in successfully!');
        setStatusType('success');
        setTimeout(() => setStatusMessage(''), 3000);
    };

    const handleSOS = async () => {
        const userDocRef = doc(db, USERS_COLLECTION, userData.uid);
        await updateDoc(userDocRef, { sos: { active: true, time: serverTimestamp() } });
        setStatusMessage('SOS sent! Your family has been alerted.');
        setStatusType('info');
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-base-200 text-base-content">
            <header className="text-center mb-8">
                <h1 className="text-5xl font-bold">Hi, {userData.name || 'there'}!</h1>
                <p className="text-lg mt-2">You are connected to your family.</p>
            </header>
            <main className="flex-grow flex flex-col justify-center items-center w-full max-w-md space-y-6">
                <button onClick={handleCheckIn} className="btn btn-primary btn-lg w-full h-auto py-4 flex items-center justify-start space-x-4 shadow-lg hover:shadow-xl transition-shadow">
                    <Icon name="map-pin" className="w-10 h-10" />
                    <div className="text-left">
                        <h2 className="font-bold text-2xl">Check-in</h2>
                        <p className="text-base-100/80 text-sm">Let your family know you're here.</p>
                    </div>
                </button>
                <button onClick={handleSOS} className="btn btn-error btn-lg w-full h-auto py-4 flex items-center justify-start space-x-4 shadow-lg hover:shadow-xl transition-shadow">
                    <Icon name="siren" className="w-10 h-10" />
                    <div className="text-left">
                        <h2 className="font-bold text-2xl">SOS</h2>
                        <p className="text-error-content/80 text-sm">Press only in an emergency.</p>
                    </div>
                </button>
            </main>
            <footer className="text-center h-20 mt-6 w-full max-w-md">
                {statusMessage && (
                    <div role="alert" className={`alert ${statusType === 'success' ? 'alert-success' : statusType === 'info' ? 'alert-info' : 'alert-error'} shadow-md transition-opacity duration-300`}>
                        <Icon name={statusType === 'success' ? 'sparkles' : statusType === 'info' ? 'siren' : 'siren'} className="w-6 h-6"/>
                        <span>{statusMessage}</span>
                    </div>
                )}
                {userData.sos?.active && !statusMessage && ( // Show only if no other status message is active
                    <div role="alert" className="alert alert-error shadow-lg animate-pulse">
                         <Icon name="siren" className="w-6 h-6"/>
                        <span>SOS is active.</span>
                    </div>
                )}
            </footer>
        </div>
    );
};

// --- Main Components ---
const ParentDashboard = ({ userData, familyMembers, safeZones, alerts, geolocationError }) => {
    const [showFamilyId, setShowFamilyId] = useState(false);
    const [activeView, setActiveView] = useState('map');
    const userLocation = userData?.location ? [userData.location.latitude, userData.location.longitude] : [-20.24, 57.58];
    const sosMember = familyMembers.find(m => m.sos?.active);

    const clearSOS = async (memberId) => { const userDocRef = doc(db, USERS_COLLECTION, memberId); await updateDoc(userDocRef, { "sos.active": false }); };
    const NavButton = ({ viewName, icon, label }) => (<button onClick={() => setActiveView(viewName)} className={`btn btn-ghost flex-1 ${activeView === viewName ? 'btn-active' : ''}`}><Icon name={icon} className="w-6 h-6" /><span className="btm-nav-label">{label}</span></button>);

    return (
        <div className="w-full h-screen flex flex-col"> {/* Removed redundant data-theme for DaisyUI, assuming global set on html */}
            <header className="navbar bg-base-100 shadow-sm z-20 flex-shrink-0">
                <div className="flex-1">
                    <a className="btn btn-ghost text-xl"><Icon name="logo" className="w-6 h-6 text-primary" />MauZenfan</a>
                </div>
                <div className="flex-none">
                    <button onClick={() => setShowFamilyId(true)} className="btn btn-outline btn-primary btn-sm">Family ID</button>
                </div>
            </header>

            {showFamilyId && (
                <Modal onClose={() => setShowFamilyId(false)}>
                    <h3 className="font-bold text-lg text-center">Your Family ID</h3>
                    <p className="py-4 text-center">Share this ID with family members to join.</p>
                    <div className="text-center">
                        <kbd className="kbd kbd-lg tracking-widest">{userData.familyId}</kbd>
                    </div>
                </Modal>
            )}

            {geolocationError && (
                <div role="alert" className="alert alert-warning shadow-md z-20 rounded-none">
                    <Icon name="siren" className="w-6 h-6"/>
                    <div>
                        <h3 className="font-bold">Location Error!</h3>
                        <div className="text-xs">{geolocationError}</div>
                    </div>
                </div>
            )}

            {sosMember && (
                <div role="alert" className="alert alert-error shadow-lg z-30 animate-pulse rounded-none">
                     <Icon name="siren" className="w-6 h-6"/>
                    <div>
                        <h3 className="font-bold">SOS ALERT!</h3>
                        <div className="text-sm">{sosMember.name} has sent an emergency alert!</div>
                    </div>
                    <button onClick={() => clearSOS(sosMember.uid)} className="btn btn-sm btn-ghost">Clear</button>
                </div>
            )}

            <main className="flex-1 min-h-0 bg-base-200">
                {activeView === 'map' ? (
                    <div className="w-full h-full">
                        <IFrameMapView center={userLocation} />
                    </div>
                ) : (
                    <SafeZonesView safeZones={safeZones} familyId={userData.familyId} userLocation={userLocation} />
                )}
            </main>

            <footer className="btm-nav btm-nav-sm md:btm-nav-md z-20 flex-shrink-0">
                <NavButton viewName="map" icon="map" label="Map" />
                <NavButton viewName="zones" icon="shield" label="Zones" />
                <NavButton viewName="settings" icon="settings" label="Settings" />
            </footer>
        </div>
    );
};

export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [safeZones, setSafeZones] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [geolocationError, setGeolocationError] = useState('');

    useEffect(() => {
        // document.documentElement.style.height = '100%'; // Managed by DaisyUI theme or Tailwind base
        // document.body.style.height = '100%';
        // const root = document.getElementById('root');
        // if (root) {
        //     root.style.height = '100%';
        // }
        // Set a default theme if not already set
        if (!document.documentElement.getAttribute('data-theme')) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                if (Object.values(firebaseConfig).some(v => v.includes("YOUR_"))) {
                    console.error("Firebase config is not set. Please update it in App.jsx");
                    setIsAuthReady(true);
                    return;
                }
                await signInAnonymously(auth);
            } catch (error) {
                console.error("Authentication failed:", error);
            }
        };
        const unsubAuth = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                const userDocRef = doc(db, USERS_COLLECTION, authUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                } else {
                    const newUserData = { uid: authUser.uid, name: `User-${authUser.uid.slice(0, 4)}`, role: 'unassigned' };
                    await setDoc(userDocRef, newUserData);
                    setUserData(newUserData);
                }
                setUser(authUser);
            } else {
                setUser(null);
                setUserData(null);
            }
            setIsAuthReady(true);
        });
        initAuth();
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (!user || !userData?.familyId) return;
        if (!navigator.geolocation) { setGeolocationError("Geolocation is not supported by your browser."); return; }
        const handleSuccess = async (position) => { setGeolocationError(''); const { latitude, longitude } = position.coords; const userDocRef = doc(db, USERS_COLLECTION, user.uid); try { await updateDoc(userDocRef, { location: { latitude, longitude }, lastUpdated: serverTimestamp() }); } catch (e) { console.error("Error updating location:", e); } };
        const handleError = (error) => { console.error(`Geolocation error: Code ${error.code} - ${error.message}`); let message = 'Could not get your location. Please check device settings.'; if (error.code === 1) { message = 'Location access was denied. Please check your settings.'; } setGeolocationError(message); };
        const watchId = navigator.geolocation.watchPosition( handleSuccess, handleError, { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 } );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [user, userData]);

    useEffect(() => {
        if (!userData || !userData.familyId) return;
        const membersQuery = query(collection(db, USERS_COLLECTION), where("familyId", "==", userData.familyId));
        const unsubMembers = onSnapshot(membersQuery, (snapshot) => { const membersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id })); setFamilyMembers(membersData); });
        const zonesQuery = query(collection(db, SAFE_ZONES_COLLECTION), where("familyId", "==", userData.familyId));
        const unsubZones = onSnapshot(zonesQuery, (snapshot) => { const zonesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })); setSafeZones(zonesData); });
        let unsubAlerts = () => {};
        if(userData.role === 'parent') { const alertsQuery = query(collection(db, ALERTS_COLLECTION), where("familyId", "==", userData.familyId), orderBy("timestamp", "desc"), limit(5)); unsubAlerts = onSnapshot(alertsQuery, (snapshot) => { const alertsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })); setAlerts(alertsData); }); }
        return () => { unsubMembers(); unsubZones(); unsubAlerts(); };
    }, [userData]);

    if (!isAuthReady) { return <div className="w-full h-full flex items-center justify-center"><p>Loading MauZenfan...</p></div>; }

    if (Object.values(firebaseConfig).some(v => v.includes("YOUR_"))) {
        return <div className="w-full h-full flex items-center justify-center p-8 bg-red-100 text-red-800"><p className="text-center font-semibold">Firebase configuration is missing. Please create a Firebase project and paste your keys into App.jsx.</p></div>
    }

    if (!userData) { return <div className="w-full h-full flex items-center justify-center"><p>Authenticating...</p></div>; }

    if (userData.role === 'parent') {
        return <ParentDashboard userData={userData} familyMembers={familyMembers} safeZones={safeZones} alerts={alerts} geolocationError={geolocationError} />;
    }

    if (userData.role === 'child') {
        return <ChildDashboard userData={userData} familyId={userData.familyId} />;
    }

    return <FamilySetup user={userData} setUserData={setUserData} />;
}
