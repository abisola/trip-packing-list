import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { Plus, Check, User, Wifi, WifiOff } from 'lucide-react';
import './App.css';

// Replace with YOUR Firebase config from the setup steps
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9iFIxuUegNbp0PObkVhmutyMMAxno73A",
  authDomain: "abisolafatokun.firebaseapp.com",
  projectId: "abisolafatokun",
  storageBucket: "abisolafatokun.firebasestorage.app",
  messagingSenderId: "980985992618",
  appId: "1:980985992618:web:9a17522484297e244c47d3",
  measurementId: "G-XKDWT39C0B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Item {
  id: number;
  name: string;
  completed: boolean;
  completedBy: string | null;
}

interface Categories {
  [key: string]: Item[];
}

const TripPackingList = () => {
  const [categories, setCategories] = useState<Categories>({
    'Food and refreshments': [
      { id: 1, name: 'Rice', completed: false, completedBy: null },
      { id: 2, name: 'BBQ meat', completed: false, completedBy: null }
    ],
    'Kitchen and bathroom': [
      { id: 3, name: 'Dishwasher tablets', completed: false, completedBy: null },
      { id: 4, name: 'Toilet roll (x2)', completed: false, completedBy: null }
    ],
    'Play and fun': [
      { id: 5, name: 'Badminton', completed: false, completedBy: null },
      { id: 6, name: 'Frisbee', completed: false, completedBy: null }
    ],
    'Entertainment': [
      { id: 7, name: 'Projector', completed: false, completedBy: null },
      { id: 8, name: 'Boom box', completed: false, completedBy: null }
    ]
  });

  const [newItems, setNewItems] = useState<{[key: string]: string}>({});
  const [newPersonName, setNewPersonName] = useState('');
  const [showNameInput, setShowNameInput] = useState<{[key: number]: boolean}>({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());

  // Real-time sync with Firebase
  useEffect(() => {
    const tripListRef = doc(db, 'trips', 'main-trip');

    // Listen for real-time updates
    const unsubscribe = onSnapshot(tripListRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.categories) {
          setCategories(data.categories);
          setLastSync(new Date());
          setIsConnected(true);
        }
      } else {
        // Initialize document if it doesn't exist
        setDoc(tripListRef, { categories });
      }
    }, (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync data with Firebase
  const syncWithFirebase = async (updatedCategories: Categories) => {
    try {
      const tripListRef = doc(db, 'trips', 'main-trip');
      await updateDoc(tripListRef, { categories: updatedCategories });
      setIsConnected(true);
    } catch (error) {
      console.error('Sync failed:', error);
      setIsConnected(false);
    }
  };

  const addItem = async (category: string) => {
    const itemName = newItems[category];
    if (!itemName?.trim()) return;

    const newId = Date.now();
    const updatedCategories = {
      ...categories,
      [category]: [
        ...categories[category],
        { id: newId, name: itemName.trim(), completed: false, completedBy: null }
      ]
    };

    setNewItems(prev => ({ ...prev, [category]: '' }));
    await syncWithFirebase(updatedCategories);
  };

  const toggleItem = async (category: string, itemId: number, personName: string | null) => {
    const updatedCategories = {
      ...categories,
      [category]: categories[category].map(item =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedBy: !item.completed ? personName : null
            }
          : item
      )
    };

    setShowNameInput(prev => ({ ...prev, [itemId]: false }));
    setNewPersonName('');
    await syncWithFirebase(updatedCategories);
  };

  const handleCheckboxClick = (category: string, item: Item) => {
    if (item.completed) {
      toggleItem(category, item.id, null);
    } else {
      setShowNameInput(prev => ({ ...prev, [item.id]: true }));
    }
  };

  const handleNameSubmit = (category: string, item: Item) => {
    if (newPersonName.trim()) {
      toggleItem(category, item.id, newPersonName.trim());
    }
  };

  return (
    <div className="app-container">
      <div className="app-card">
        {/* Header */}
        <div className="header">
          <div className="header-top">
            <div className="status-indicator">
              {isConnected ? (
                <Wifi className={`status-icon green`} />
              ) : (
                <WifiOff className={`status-icon red`} />
              )}
              <span className="status-text">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <p className="date-text">9 August 2025 at 13:15</p>
          <h1 className="main-title">Things to take on trip</h1>
          <p className="sync-text">
            Last synced: {lastSync.toLocaleTimeString()}
          </p>
        </div>

        {/* Categories */}
        <div className="categories-container">
          {Object.entries(categories).map(([categoryName, items]) => (
            <div key={categoryName} className="category">
              <h2 className="category-title">{categoryName}</h2>

              {/* Items */}
              <div className="items-list">
                {items.map((item) => (
                  <div key={item.id} className="item-row">
                    <button
                      onClick={() => handleCheckboxClick(categoryName, item)}
                      className={`checkbox ${item.completed ? 'completed' : ''}`}
                    >
                      {item.completed && <Check className="check-icon" />}
                    </button>
                    <span className={`item-text ${item.completed ? 'completed' : ''}`}>
                      {item.name}
                    </span>
                    {item.completedBy && (
                      <div className="completed-by">
                        <User className="user-icon" />
                        <span>{item.completedBy}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Name input for checking off items */}
              {Object.entries(showNameInput).map(([itemId, show]) => {
                const item = items.find(i => i.id === parseInt(itemId));
                return show && item ? (
                  <div key={itemId} className="name-input-container">
                    <p className="name-input-label">Who is taking "{item.name}"?</p>
                    <div className="name-input-form">
                      <input
                        type="text"
                        value={newPersonName}
                        onChange={(e) => setNewPersonName(e.target.value)}
                        placeholder="Enter your name"
                        className="name-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleNameSubmit(categoryName, item);
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleNameSubmit(categoryName, item)}
                        className="button button-primary"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setShowNameInput(prev => ({ ...prev, [itemId]: false }))}
                        className="button button-secondary"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : null;
              })}

              {/* Add new item */}
              <div className="add-item-form">
                <input
                  type="text"
                  value={newItems[categoryName] || ''}
                  onChange={(e) => setNewItems(prev => ({ ...prev, [categoryName]: e.target.value }))}
                  placeholder="Add new item..."
                  className="add-item-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem(categoryName);
                    }
                  }}
                />
                <button
                  onClick={() => addItem(categoryName)}
                  className="add-button"
                >
                  <Plus className="add-icon" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="footer">
          <p className="footer-text">
            🚀 Real-time collaborative packing list - share this link with your trip companions!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TripPackingList;
