let allPotholes = [];

document.addEventListener('DOMContentLoaded', () => {
    const reportsList = document.getElementById('reports-list');
    const reportCount = document.getElementById('report-count');
    const updateTime = document.getElementById('update-time');
    
    if (!reportsList || !reportCount) return;

    // Initialize with current data
    updateUI(allPotholes);

    // Setup real-time listener
    listenToPotholes((potholes) => {
        allPotholes = potholes;
        updateUI(potholes);
    });

    // Setup filters
    setupFilters();
    
    // Refresh button (now just updates timestamp)
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
        document.getElementById('update-time').textContent = 
            new Date().toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
    });
});

function updateUI(potholes) {
    const reportCount = document.getElementById('report-count');
    const updateTime = document.getElementById('update-time');
    const reportsList = document.getElementById('reports-list');
    
    if (!reportCount || !updateTime || !reportsList) return;

    // Update count and timestamp
    reportCount.textContent = potholes.length;
    updateTime.textContent = new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Render reports
    renderReports(potholes);
}

function renderReports(potholes) {
    const container = document.getElementById('reports-list');
    
    if (potholes.length === 0) {
        container.innerHTML = '<div class="no-reports">No damage reports match current filters</div>';
        return;
    }

    const sorted = potholes.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    container.innerHTML = sorted.map(p => `
        <div class="report-item" data-severity="${p.severity}">
            <div class="report-header">
                <span class="severity-badge ${p.severity}">${p.severity}</span>
                <span class="report-timestamp">${new Date(p.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="report-location">${p.location || 'Unnamed Location'}</div>
            <div class="report-coords">📍 ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</div>
        </div>
    `).join('');
}

function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => 
                btn.classList.remove('active')
            );
            button.classList.add('active');

            const filter = button.dataset.filter;
            const filtered = filter === 'all' 
                ? allPotholes 
                : allPotholes.filter(p => p.severity === filter);
            
            document.getElementById('report-count').textContent = filtered.length;
            renderReports(filtered);
        });
    });
}