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

const Modal = ({ children, onClose, size = 'sm' }) => ( <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className={`bg-white rounded-2xl p-6 w-full max-w-${size} relative shadow-xl flex flex-col`}><button onClick={onClose} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-800 rounded-full bg-gray-100/50 z-10"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59L7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12L5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg></button>{children}</div></div>);

const FamilySetup = ({ user, setUserData }) => {
    const [familyIdInput, setFamilyIdInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const createFamily = async () => { setIsLoading(true); setError(''); const newFamilyId = `fam-${crypto.randomUUID().slice(0, 8)}`; try { await setDoc(doc(db, FAMILIES_COLLECTION, newFamilyId), { createdAt: serverTimestamp(), owner: user.uid }); const newUserData = { ...user, familyId: newFamilyId, role: 'parent' }; await setDoc(doc(db, USERS_COLLECTION, user.uid), newUserData, { merge: true }); setUserData(newUserData); } catch (err) { console.error("Error creating family:", err); setError("Could not create family. Please try again."); } setIsLoading(false); };
    const joinFamily = async () => { if (!familyIdInput.trim()) { setError("Please enter a Family ID."); return; } setIsLoading(true); setError(''); try { const familyDoc = await getDoc(doc(db, FAMILIES_COLLECTION, familyIdInput)); if (familyDoc.exists()) { const newUserData = { ...user, familyId: familyIdInput, role: 'child' }; await setDoc(doc(db, USERS_COLLECTION, user.uid), newUserData, { merge: true }); setUserData(newUserData); } else { setError("Family ID not found. Please check and try again."); } } catch (err) { console.error("Error joining family:", err); setError("Could not join family. Please try again."); } setIsLoading(false); };
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
            <div className="w-full max-w-md text-center">
                <Icon name="logo" className="w-16 h-16 text-indigo-500 mx-auto mb-4"/>
                <h1 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">Welcome to MauZenfan</h1>
                <p className="text-gray-600 mb-10">Your family's safety, connected.</p>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-6">{error}</p>}

                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
                    <div>
                        <h2 className="font-bold text-xl mb-2 text-gray-700">Join an Existing Family</h2>
                        <input type="text" value={familyIdInput} onChange={(e) => setFamilyIdInput(e.target.value)} placeholder="Enter Family ID" className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
                        <button onClick={joinFamily} disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-transform transform hover:scale-105 shadow-md hover:shadow-lg">
                            {isLoading ? 'Joining...' : 'Join Family'}
                        </button>
                    </div>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink mx-4 text-gray-400 font-semibold">OR</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <div>
                        <h2 className="font-bold text-xl mb-2 text-gray-700">Create a New Family</h2>
                        <button onClick={createFamily} disabled={isLoading} className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-transform transform hover:scale-105 shadow-md hover:shadow-lg">
                            {isLoading ? 'Creating...' : 'Create New Family'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IFrameMapView = ({ center }) => { const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center[1]-0.01},${center[0]-0.01},${center[1]+0.01},${center[0]+0.01}&layer=mapnik&marker=${center[0]},${center[1]}`; return ( <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={mapUrl} style={{ border: 'none' }} ></iframe> ); };
const AddSafeZoneModal = ({ onClose, familyId, userLocation }) => { const [zoneName, setZoneName] = useState(''); const [radius, setRadius] = useState(150); const [center, setCenter] = useState({ lat: userLocation[0], lng: userLocation[1] }); const [isLoading, setIsLoading] = useState(false); const handleSave = async () => { if (!zoneName.trim()) { alert("Please enter a name for the zone."); return; } setIsLoading(true); try { await addDoc(collection(db, SAFE_ZONES_COLLECTION), { familyId: familyId, name: zoneName, center: { latitude: center.lat, longitude: center.lng }, radius: Number(radius) }); onClose(); } catch(error) { console.error("Error saving safe zone: ", error); alert("Could not save the safe zone. Please try again."); } setIsLoading(false); }; return ( <Modal onClose={onClose} size="lg"><div className="flex flex-col h-[70vh]"><h2 className="text-2xl font-bold mb-4 text-center">Add a New Safe Zone</h2><div className="flex-grow h-1/2 mb-4 rounded-xl overflow-hidden border"><p className="text-center p-4 text-gray-600">Interactive location picker not available in this view.</p></div><div className="space-y-4"><input type="text" value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="e.g., Lekol, Lakaz..." className="w-full px-4 py-2 border rounded-lg" /><div><label className="block text-sm font-medium">Radius: {radius}m</label><input type="range" min="50" max="500" value={radius} onChange={e => setRadius(e.target.value)} className="w-full" /></div></div><button onClick={handleSave} disabled={isLoading} className="mt-6 w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300">{isLoading ? 'Saving...' : 'Save Zone'}</button></div></Modal>);};
const SafeZonesView = ({ safeZones, familyId, userLocation }) => { const [isAdding, setIsAdding] = useState(false); return (<div className="p-4 bg-gray-50 h-full overflow-y-auto">{isAdding && <AddSafeZoneModal onClose={() => setIsAdding(false)} familyId={familyId} userLocation={userLocation} />}<div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Safe Zones</h2><button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all"><Icon name="plus" className="w-5 h-5" /><span>Add New</span></button></div><div className="space-y-3">{safeZones.length > 0 ? safeZones.map(zone => (<div key={zone.id} className="bg-white p-4 rounded-xl shadow-sm border flex items-center space-x-4"><div className="bg-green-100 p-3 rounded-full"><Icon name="shield" className="text-green-600" /></div><div><p className="font-bold">{zone.name}</p><p className="text-sm text-gray-500">{zone.radius}m radius</p></div></div>)) : (<div className="text-center py-10 bg-white rounded-lg border border-dashed"><p className="text-gray-500">You haven't added any Safe Zones yet.</p><p className="text-gray-400 text-sm mt-1">Click 'Add New' to create one for home or school.</p></div>)}</div></div>);};
const ChildDashboard = ({ userData, familyId }) => { const [statusMessage, setStatusMessage] = useState(''); const handleCheckIn = async () => { const userDocRef = doc(db, USERS_COLLECTION, userData.uid); const checkInTime = new Date(); await updateDoc(userDocRef, { lastCheckIn: serverTimestamp() }); if (checkInTime.getHours() >= 17) { const alertMessage = `${userData.name || 'Your child'} checked in after 5 PM.`; await addDoc(collection(db, ALERTS_COLLECTION), { familyId: familyId, message: alertMessage, timestamp: serverTimestamp(), userId: userData.uid }); } setStatusMessage('Checked in successfully!'); setTimeout(() => setStatusMessage(''), 3000); }; const handleSOS = async () => { const userDocRef = doc(db, USERS_COLLECTION, userData.uid); await updateDoc(userDocRef, { sos: { active: true, time: serverTimestamp() } }); setStatusMessage('SOS sent! Your family has been alerted.'); }; return ( <div className="w-full h-full flex flex-col bg-gray-50 p-6"><header className="text-center mb-8"><h1 className="text-4xl font-bold text-gray-800 tracking-tight">Hi, {userData.name || 'there'}!</h1><p className="text-lg text-gray-600 mt-2">You are connected to your family.</p></header><main className="flex-grow flex flex-col justify-center space-y-6"><button onClick={handleCheckIn} className="bg-blue-500 text-white rounded-2xl p-8 flex items-center space-x-6 shadow-lg hover:bg-blue-600 transition-all transform hover:scale-105"><Icon name="map-pin" className="w-12 h-12" /><div className="text-left"><h2 className="font-bold text-2xl">Check-in</h2><p className="text-blue-100 text-lg">Let your family know you're here.</p></div></button><button onClick={handleSOS} className="bg-red-600 text-white rounded-2xl p-8 flex items-center space-x-6 shadow-xl hover:bg-red-700 transition-all transform hover:scale-105"><Icon name="siren" className="w-12 h-12" /><div className="text-left"><h2 className="font-bold text-2xl">SOS</h2><p className="text-red-100 text-lg">Press only in an emergency.</p></div></button></main><footer className="text-center h-12 mt-6">{statusMessage && <p className="text-green-600 font-semibold bg-green-100 p-3 rounded-lg transition-opacity duration-300">{statusMessage}</p>}{userData.sos?.active && <p className="text-red-600 font-bold bg-red-100 p-3 rounded-lg animate-pulse">SOS is active.</p>}</footer></div> ); };

// --- Main Components ---
const ParentDashboard = ({ userData, familyMembers, safeZones, alerts, geolocationError }) => {
    const [showFamilyId, setShowFamilyId] = useState(false);
    const [activeView, setActiveView] = useState('map');
    const userLocation = userData?.location ? [userData.location.latitude, userData.location.longitude] : [-20.24, 57.58];
    const sosMember = familyMembers.find(m => m.sos?.active);

    const clearSOS = async (memberId) => { const userDocRef = doc(db, USERS_COLLECTION, memberId); await updateDoc(userDocRef, { "sos.active": false }); };
    const NavButton = ({ viewName, icon, label }) => (<button onClick={() => setActiveView(viewName)} className={`flex flex-col items-center w-full justify-center p-2 rounded-lg transition-colors ${activeView === viewName ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-100'}`}><Icon name={icon} className="w-6 h-6 mb-1" /><span className="text-xs font-semibold">{label}</span></button>);

    return (
        <div className="w-full h-screen flex flex-col bg-white">
            <header className="bg-white p-4 flex justify-between items-center border-b z-20 flex-shrink-0"><h1 className="text-xl font-bold text-gray-800 flex items-center space-x-2"><Icon name="logo" className="w-6 h-6 text-indigo-500" /><span>MauZenfan</span></h1><button onClick={() => setShowFamilyId(true)} className="bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-200">Family ID</button></header>
            {showFamilyId && (<Modal onClose={() => setShowFamilyId(false)}><h2 className="text-xl font-bold text-center mb-2">Your Family ID</h2><p className="text-gray-600 text-center mb-4">Share this ID with family members to join.</p><div className="bg-gray-100 p-4 rounded-lg text-center"><p className="text-2xl font-mono font-bold tracking-widest text-gray-800">{userData.familyId}</p></div></Modal>)}
            {geolocationError && (<div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 z-20" role="alert"><p className="font-bold">Location Error</p><p>{geolocationError}</p></div>)}
            {sosMember && ( <div className="bg-red-500 text-white p-4 z-30 animate-pulse flex justify-between items-center"><div><p className="font-bold text-lg">SOS ALERT!</p><p>{sosMember.name} has sent an emergency alert!</p></div><button onClick={() => clearSOS(sosMember.uid)} className="bg-white text-red-500 font-bold py-1 px-3 rounded">Clear</button></div> )}

            <main className="flex-1 min-h-0">
                {activeView === 'map' ? (
                    <div className="w-full h-full">
                        <IFrameMapView center={userLocation} />
                    </div>
                ) : (
                    <SafeZonesView safeZones={safeZones} familyId={userData.familyId} userLocation={userLocation} />
                )}
            </main>

            <footer className="bg-white border-t p-2 z-20 flex-shrink-0"><div className="flex justify-around items-center space-x-2"><NavButton viewName="map" icon="map" label="Map" /><NavButton viewName="zones" icon="shield" label="Zones" /><NavButton viewName="settings" icon="settings" label="Settings" /></div></footer>
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
        document.documentElement.style.height = '100%';
        document.body.style.height = '100%';
        const root = document.getElementById('root');
        if (root) {
            root.style.height = '100%';
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
