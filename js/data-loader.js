// js/data-loader.js
async function loadPotholeData() {
  return new Promise((resolve) => {
    const db = firebase.database();
    db.ref('potholes').once('value')
      .then(snapshot => {
        const rawPotholes = [];
        snapshot.forEach(child => {
          const data = child.val();
          if (typeof data.timestamp === 'number') {
            data.timestamp = new Date(data.timestamp).toISOString();
          }
          rawPotholes.push(data);
        });

        // Group by locationId (or create one from lat/lng)
        const grouped = {};
        rawPotholes.forEach(p => {
          // Create locationId if missing (backward compatibility)
          const id = p.locationId || `${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`;
          
          if (!grouped[id]) {
            grouped[id] = { ...p, frequency: 1, timestamps: [p.timestamp] };
          } else {
            grouped[id].frequency++;
            grouped[id].timestamps.push(p.timestamp);
            // Keep highest severity
            const severityOrder = { minor: 1, moderate: 2, severe: 3 };
            if (severityOrder[p.severity] > severityOrder[grouped[id].severity]) {
              grouped[id].severity = p.severity;
            }
            // Keep latest timestamp
            const latest = new Date(Math.max(...grouped[id].timestamps.map(t => new Date(t))));
            grouped[id].timestamp = latest.toISOString();
          }
        });

        resolve(Object.values(grouped));
      })
      .catch(error => {
        console.error('Firebase read error:', error);
        resolve([]);
      });
  });
}

function calculatePriority(pothole) {
  // Base score from severity (non-negotiable foundation)
  let baseScore = 0;
  if (pothole.severity === 'severe') baseScore = 4;
  else if (pothole.severity === 'moderate') baseScore = 2;
  else baseScore = 1; // minor

  // Recurrence boost (max +1 to avoid overriding severity)
  const recurrenceBoost = Math.min((pothole.frequency || 1) - 1, 1); // 0 for 1 detection, 1 for 2+ detections

  // Total score (max 5)
  return Math.min(baseScore + recurrenceBoost, 5);
}

// Add this to js/data-loader.js
function listenToPotholes(callback) {
  const db = firebase.database();
  return db.ref('potholes').on('value', (snapshot) => {
    const potholes = [];
    snapshot.forEach(child => {
      const data = child.val();
      if (typeof data.timestamp === 'number') {
        data.timestamp = new Date(data.timestamp).toISOString();
      }
      potholes.push(data);
    });
    
    // Group by locationId (same logic as loadPotholeData)
    const grouped = {};
    potholes.forEach(p => {
      const id = p.locationId || `${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`;
      if (!grouped[id]) {
        grouped[id] = { ...p, frequency: 1 };
      } else {
        grouped[id].frequency++;
      }
    });
    
    callback(Object.values(grouped));
  });
}