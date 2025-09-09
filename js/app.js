function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered', registration);

                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            window.location.reload();
                        }
                    };
                };
            })
            .catch(err => console.error('Service Worker registration failed:', err));
    }
}

// Initialize variables
let weightData = [];
let chart = null;
const today = new Date();
today.setHours(0, 0, 0, 0);

// user profile variables 
let userProfile = {
    height: 0,
    gender: '',
    age: 0,
    activityLevel: 'moderate'
};

// Toast Notification System
function showToast(message, type = 'info') {
    const toast = document.createElement('div');

    // Seting toast styles based on type
    let bgColor, iconSvg;

    switch (type) {
        case 'success':
            bgColor = 'bg-green-600';
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>`;
            break;
        case 'error':
            bgColor = 'bg-red-600';
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>`;
            break;
        case 'info':
        default:
            bgColor = 'bg-indigo-600';
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>`;
            break;
    }

    toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center mb-3 animate-fade-in max-w-xs transition-all duration-300 ease-in-out transform translate-y-0 opacity-100`;
    toast.innerHTML = `
        ${iconSvg}
        <span>${message}</span>
        <button class="ml-auto text-white focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    `;

    // Add close button functionality
    toast.querySelector('button').addEventListener('click', () => {
        removeToast(toast);
    });

    // Add to container
    document.getElementById('toastContainer').appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 5000);
}

function removeToast(toast) {
    // Add fade out animation
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';

    // Remove from DOM after animation
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Format date for display
function formatDate(dateString) {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Save weight data to localStorage
function saveData() {
    localStorage.setItem('weightData', JSON.stringify(weightData));
    syncData();
}

// Load weight data from localStorage
function loadData() {
    const savedData = localStorage.getItem('weightData');
    if (savedData) {
        weightData = JSON.parse(savedData);
        showToast('Data loaded successfully', 'success');
        updateUI();
    }
}

// Add a new weight entry
function addWeightEntry(weight, date, notes) {
    weightData.push({
        id: Date.now(),
        weight: parseFloat(weight),
        date: date,
        notes: notes
    });

    // Sort by date (newest first)
    weightData.sort((a, b) => new Date(b.date) - new Date(a.date));

    saveData();
    updateUI(); // This will call updateTrendsChart
    showToast('Weight entry saved successfully', 'success');
    
    // Explicitly update trends after new data
    updateTrendsChart();
}

// Delete a weight entry
function deleteEntry(id) {
    weightData = weightData.filter(entry => entry.id !== id);
    saveData();
    updateUI();
    showToast('Entry deleted successfully', 'info');
}

// Clear all data
function clearAllData() {
    weightData = [];
    saveData();
    updateUI();
    showToast('All data cleared successfully', 'info');
}

// Update the UI with current data
function updateUI() {
    updateHistoryList();
    updateStats();
    updateChart();
    updateTrendsChart(); 
    const report = generateWeeklyReport();
    if (report) showWeeklyReport(report);
    updatePredictions();
}

// Update the weight history list
function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;  

    // Clear the list
    historyList.innerHTML = '';

    const noEntriesMessage = document.getElementById('noEntriesMessage');

    if (weightData.length === 0) {
        // Create and append the no entries message if it doesn't exist
        if (!noEntriesMessage) {
            const message = document.createElement('p');
            message.id = 'noEntriesMessage';
            message.className = 'text-gray-500 text-center py-6';
            message.textContent = 'No entries yet. Start by adding your weight above.';
            historyList.appendChild(message);
        }
        return;
    }

    // Remove no entries message if it exists
    if (noEntriesMessage) {
        noEntriesMessage.remove();
    }

    // Add each entry to the list
    weightData.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'bg-gray-50 p-4 rounded-lg flex items-center justify-between';
        
        const date = new Date(entry.date);
        
        entryElement.innerHTML = `
            <div>
                <p class="font-medium">${entry.weight.toFixed(1)} kg</p>
                <p class="text-sm text-gray-600">${formatDate(date)}</p>
                ${entry.notes ? `<p class="text-sm text-gray-500 mt-1">${entry.notes}</p>` : ''}
            </div>
            <button onclick="deleteEntry(${entry.id})" class="text-red-600 hover:text-red-800 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        `;
        
        historyList.appendChild(entryElement);
    });
}

// Update the statistics
function updateStats() {
    if (weightData.length === 0) {
        document.getElementById('currentWeightBig').textContent = '--';
        document.getElementById('totalChangeBig').textContent = '--';
        document.getElementById('startWeight').textContent = '--';
        document.getElementById('currentWeight').textContent = '--';
        document.getElementById('totalChange').textContent = '--';
        document.getElementById('weeklyChange').textContent = '--';
        document.getElementById('weightTrend').innerHTML = '';
        return;
    }

    // Get the current and starting weight
    const currentWeight = weightData[0].weight;
    const startingWeight = weightData[weightData.length - 1].weight;
    const totalChange = currentWeight - startingWeight;

    // Calculate weekly change
    let weeklyChange = 0;
    if (weightData.length > 1) {
        const firstDate = new Date(weightData[weightData.length - 1].date);
        const lastDate = new Date(weightData[0].date);
        const weeksDiff = Math.max(1, Math.round((lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000)));
        weeklyChange = totalChange / weeksDiff;
    }

    // Update the UI
    document.getElementById('currentWeightBig').textContent = `${currentWeight.toFixed(1)} kg`;
    document.getElementById('totalChangeBig').textContent = `${Math.abs(totalChange).toFixed(1)} kg`;
    document.getElementById('startWeight').textContent = `${startingWeight.toFixed(1)} kg`;
    document.getElementById('currentWeight').textContent = `${currentWeight.toFixed(1)} kg`;
    document.getElementById('totalChange').textContent = `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(1)} kg`;
    document.getElementById('weeklyChange').textContent = `${weeklyChange >= 0 ? '+' : ''}${weeklyChange.toFixed(1)} kg`;

    // Update trend indicator
    const weightTrend = document.getElementById('weightTrend');
    if (weightData.length > 1) {
        const prevWeight = weightData[1].weight;
        const diff = currentWeight - prevWeight;

        if (diff > 0) {
            weightTrend.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
                </svg>
                <span class="text-red-300">+${diff.toFixed(1)} kg from last entry</span>
            `;
        } else if (diff < 0) {
            weightTrend.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-green-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clip-rule="evenodd" />
                </svg>
                <span class="text-green-300">${diff.toFixed(1)} kg from last entry</span>
            `;
        } else {
            weightTrend.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7 8a1 1 0 011-1h8a1 1 0 110 2H9.414l-1.293 1.293a1 1 0 01-1.414 0L5.414 9H3a1 1 0 010-2h2.586l1.707-1.707a1 1 0 011.414 0L10.414 7H15z" clip-rule="evenodd" />
                </svg>
                <span class="text-blue-300">No change from last entry</span>
            `;
        }
    }
}

// Update the weight chart
function updateChart() {
    const chartCanvas = document.getElementById('weightChart');
    const noDataMessage = document.getElementById('noDataMessage');
    const timeRange = document.getElementById('timeRange').value;

    // Filter data based on selected time range
    let filteredData = [...weightData];
    if (timeRange !== 'all' && weightData.length > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
        filteredData = weightData.filter(entry => new Date(entry.date) >= cutoffDate);
    }

    // Reverse for chronological display
    filteredData = filteredData.slice().reverse();

    if (filteredData.length === 0) {
        chartCanvas.classList.add('hidden');
        noDataMessage.classList.remove('hidden');
        return;
    }

    chartCanvas.classList.remove('hidden');
    noDataMessage.classList.add('hidden');

    // Prepare data for the chart
    const labels = filteredData.map(entry => formatDate(entry.date));
    const weights = filteredData.map(entry => entry.weight);

    // Create or update the chart
    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = weights;
        chart.update();
    } else {
        chart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weight (kg)',
                    data: weights,
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            precision: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `Weight: ${context.raw} kg`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// BMI and trend calculation functions
function calculateBMI(weight, height) {
    if (!height) return 0;
    return weight / ((height / 100) * (height / 100));
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-500' };
    if (bmi < 25) return { category: 'Normal weight', color: 'text-green-500' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-500' };
    return { category: 'Obese', color: 'text-red-500' };
}

function calculateTrends() {
    if (weightData.length < 2) return null;

    const weeklyData = {};
    const monthlyData = {};

    weightData.forEach(entry => {
        const date = new Date(entry.date);
        const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (!weeklyData[weekKey]) weeklyData[weekKey] = [];
        if (!monthlyData[monthKey]) monthlyData[monthKey] = [];

        weeklyData[weekKey].push(entry.weight);
        monthlyData[monthKey].push(entry.weight);
    });

    return {
        weekly: calculateAverages(weeklyData),
        monthly: calculateAverages(monthlyData)
    };
}

function calculateAverages(data) {
    return Object.keys(data).map(key => ({
        period: key,
        average: data[key].reduce((a, b) => a + b) / data[key].length
    }));
}

function getWeekNumber(date) { // i figgured the d variable was a sus move why not give it something solid like dated
    const dated = new Date(date);
    dated.setHours(0, 0, 0, 0);
    dated.setDate(dated.getDate() + 4 - (dated.getDay() || 7));
    const yearStart = new Date(dated.getFullYear(), 0, 1);
    return Math.ceil((((dated - yearStart) / 86400000) + 1) / 7);
}

function getWeekKey(date) {
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// Weight prediction system
function predictWeight(days = 30) {
    if (weightData.length < 7) return null;

    const recentEntries = weightData.slice(0, 7);
    const weightChanges = [];

    for (let i = 0; i < recentEntries.length - 1; i++) {
        weightChanges.push(recentEntries[i].weight - recentEntries[i + 1].weight);
    }

    const avgDailyChange = weightChanges.reduce((a, b) => a + b) / weightChanges.length;
    const currentWeight = weightData[0].weight;

    return currentWeight + (avgDailyChange * days);
}

// Reminder system
const NOTIFICATION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const NOTIFICATION_MESSAGES = [
    "Time to check your weight!",
    "Keep up with your weight goals!",
    "Don't forget to log your progress!",
    "Quick weight check?"
];

function setupReminders() {
    if (!('Notification' in window)) {
        showToast('Notifications are not supported in this browser', 'error');
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            // Initial check
            scheduleReminders();
            
            // Set up recurring check every 6 hours
            setInterval(scheduleReminders, NOTIFICATION_INTERVAL);
            
            // Store the last notification time if not exists
            if (!localStorage.getItem('lastNotificationTime')) {
                localStorage.setItem('lastNotificationTime', Date.now().toString());
            }
        }
    });
}

function scheduleReminders() {
    const lastEntry = weightData[0];
    const now = Date.now();
    const lastNotificationTime = parseInt(localStorage.getItem('lastNotificationTime') || '0');
    const timeSinceLastNotification = now - lastNotificationTime;

    // Only send notification if:
    // 1. It's been at least 6 hours since the last notification
    // 2. User is not actively using the app (check last entry within 1 hour)
    if (timeSinceLastNotification >= NOTIFICATION_INTERVAL && 
        (!lastEntry || now - new Date(lastEntry.date).getTime() > 3600000)) {
        
        // Get random message from array
        const message = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
        
        new Notification('WeightLess', {
            body: message,
            icon: './icons/scale-ico.png',
            badge: './icons/love-ico-weight.png',
            tag: 'weight-reminder', // Prevents multiple notifications from stacking
            renotify: true // Allows new notifications to replace old ones
        });
        
        // Update the last notification time
        localStorage.setItem('lastNotificationTime', now.toString());
    }
}
/** startting of copied code incase am lost **/
// Initialize the app after all 
function init() {
    // Set the current date as default
    document.getElementById('date').valueAsDate = today;

    // Set the current year in the footer
    document.getElementById('currentYear').textContent = today.getFullYear();

    // Load data from localStorage
    loadData();

    // Register service worker
    registerServiceWorker();

    // Load user profile
    loadUserProfile();

    // Setup notifications
    setupReminders();

    // Schedule weekly report generation
    setInterval(() => {
        const report = generateWeeklyReport();
        if (report) {
            showWeeklyReport(report);
        }
    }, 86400000); // Check daily

    // Update predictions and BMI when weight is added
    document.addEventListener('weightAdded', () => {
        updateBMIDisplay();
        updatePredictions();
        updateTrendsChart();
    });

    // Set up event listeners
    document.getElementById('weightForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const weight = document.getElementById('weight').value;
        const date = document.getElementById('date').value;
        const notes = document.getElementById('notes').value;

        if (!weight || !date) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        addWeightEntry(weight, date, notes);

        // Reset form
        document.getElementById('weight').value = '';
        document.getElementById('notes').value = '';
        document.getElementById('date').valueAsDate = today;
    });

    document.getElementById('clearData').addEventListener('click', function () {
        if (confirm('Are you sure you want to clear all your weight data? This cannot be undone.')) {
            clearAllData();
        }
    });

    document.getElementById('timeRange').addEventListener('change', updateChart);

    // Setup install button for PWA
    let deferredPrompt;
    const installButton = document.getElementById('installButton');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.classList.remove('hidden');
    });

    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            showToast('App installed successfully!', 'success');
        }
        deferredPrompt = null;
        installButton.classList.add('hidden');
    });

    // Check online status
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // document.getElementById('startActivity').addEventListener('click', startActivityTracking);

    document.getElementById('editProfile').addEventListener('click', () => {
        // Pre-fill form with existing data
        if (userProfile.height) {
            document.getElementById('profileHeight').value = userProfile.height;
            document.getElementById('profileAge').value = userProfile.age;
            document.getElementById('profileGender').value = userProfile.gender;
            document.getElementById('profileActivityLevel').value = userProfile.activityLevel;
        }
        document.getElementById('profileModal').classList.remove('hidden');
    });

    // Add profile modal event listeners
    const editProfileButton = document.getElementById('editProfile');
    const profileModal = document.getElementById('profileModal');

    if (editProfileButton) {
        editProfileButton.addEventListener('click', () => {
            profileModal.classList.remove('hidden');
            // Load existing profile data
            const profileData = loadUserProfile();
            if (profileData) {
                document.getElementById('profileHeight').value = profileData.height || '';
                document.getElementById('profileAge').value = profileData.age || '';
                document.getElementById('profileGender').value = profileData.gender || '';
                document.getElementById('profileActivityLevel').value = profileData.activityLevel || 'moderate';
            }
        });
    }

    // Close modal when clicking outside
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.classList.add('hidden');
            }
        });
    }

    // Add tailwind.config
    tailwind.config = {
        theme: {
            extend: {
                animation: {
                    'fade-in': 'fadeIn 0.3s ease-in-out',
                    'fade-out': 'fadeOut 0.3s ease-in-out'
                },
                keyframes: {
                    fadeIn: {
                        '0%': { opacity: '0', transform: 'translateY(10px)' },
                        '100%': { opacity: '1', transform: 'translateY(0)' }
                    },
                    fadeOut: {
                        '0%': { opacity: '1', transform: 'translateY(0)' },
                        '100%': { opacity: '0', transform: 'translateY(10px)' }
                    }
                }
            }
        }
    }

    // Cleanup any existing timers
    if (activityTimer) {
        clearInterval(activityTimer);
        activityTimer = null;
    }

    // Cleanup any existing GPS watch
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

// Update online status indicator
function updateOnlineStatus() {
    const connectionStatus = document.getElementById('connectionStatus');
    if (navigator.onLine) {
        connectionStatus.textContent = 'Connected';
        connectionStatus.classList.add('text-green-600');
        connectionStatus.classList.remove('text-red-600');
    } else {
        connectionStatus.textContent = 'Offline - Using local data';
        connectionStatus.classList.add('text-red-600');
        connectionStatus.classList.remove('text-green-600');
        showToast('You are offline. All activity is stored locally.', 'info');
    }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// the activity tracker variables for distance, number of steps ....
let isTracking = false;
let isPaused = false;
let activityTimer = null;
let startTime = null;
let pausedTime = 0;
let pauseStart = null;
let watchId = null;
let totalDistance = 0;
let totalSteps = 0;
let lastLocation = null;


// Accelerometer step detection
let accelStepCount = 0;
let lastAccel = { x: 0, y: 0, z: 0 }; // added z init to avoid undefined in calculations
const stepThreshold = 1.2;

// Idle detection
let isIdle = false;
const IDLE_SPEED_THRESHOLD = 1.0; // km/h
const IDLE_ACCEL_THRESHOLD = 0.5; // m/s² minimal movement

// Debounce / step timing
let lastStepTime = 0;
const MIN_STEP_INTERVAL_MS = 300; // debounce between steps

// GPS smoothing
let lastUpdateTime = Date.now();
let gpsBuffer = [];
const MAX_BUFFER_SIZE = 5;
const MIN_GPS_ACCURACY = 20; // meters
const MAX_SPEED_KMH = 60; // safety cap for GPS speed (define a sensible max)

// Device motion handler to get accurate steps onnstep counter

window.addEventListener('devicemotion', (event) => {
    if (!isTracking) return;

    // prefer accelerationIncludingGravity, fallback to acceleration, fallback to zeros
    const srcAcc = event.accelerationIncludingGravity || event.acceleration || { x: 0, y: 0, z: 0 };
    const acc = {
        x: (srcAcc.x ?? 0),
        y: (srcAcc.y ?? 0),
        z: (srcAcc.z ?? 0)
    };

    const dx = acc.x - (lastAccel.x ?? 0);
    const dy = acc.y - (lastAccel.y ?? 0);
    const dz = acc.z - (lastAccel.z ?? 0);

    const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);

    lastAccel = acc;

    // Idle detection
    isIdle = delta < IDLE_ACCEL_THRESHOLD;

    // Debounced step detection
    const now = Date.now();
    if (
        !isIdle &&
        delta > stepThreshold &&
        delta < 5.0 &&
        (now - lastStepTime) > MIN_STEP_INTERVAL_MS
    ) {
        accelStepCount++;
        totalSteps = accelStepCount;
        lastStepTime = now;
    }
});

// Start / Stop activity

function startActivityTracking() {
    toggleStartPause();
}

function stopActivityTracking() {
    stopTracking();
}

function pauseTracking() {
    if (!isTracking || isPaused) return;
    isPaused = true;
    pauseStart = Date.now();
    clearInterval(activityTimer);
    if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);

    const startPauseBtn = document.getElementById('startPauseBtn');
    if (startPauseBtn) {
        startPauseBtn.textContent = 'Resume Tracking';
        startPauseBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
        startPauseBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    }

    showToast('Tracking paused', 'info');
}

function resumeTracking() {
    if (!isTracking || !isPaused) return;
    isPaused = false;
    pausedTime += (Date.now() - (pauseStart || Date.now()));
    pauseStart = null;

    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            updatePosition,
            (error) => showToast(`Location error: ${error.message}`, 'error'),
            { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
        );
    }

    const startPauseBtn = document.getElementById('startPauseBtn');
    if (startPauseBtn) {
        startPauseBtn.textContent = 'Pause Tracking';
        startPauseBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        startPauseBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
    }

    activityTimer = setInterval(updateActivityDuration, 1000);
    showToast('Tracking resumed', 'success');
}

function toggleStartPause() {
    const startPauseBtn = document.getElementById('startPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const activityStatus = document.getElementById('activityStatus');

    if (!isTracking) {
        // --- START ---
        isTracking = true;
        isPaused = false;
        startTime = Date.now();
        pausedTime = 0;

        if (startPauseBtn) {
            startPauseBtn.textContent = 'Pause Tracking';
            startPauseBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
            startPauseBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        }
        if (stopBtn) stopBtn.classList.remove('hidden');
        if (activityStatus) activityStatus.classList.remove('hidden');

        // Start location tracking
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                updatePosition,
                (error) => showToast(`Location error: ${error.message}`, 'error'),
                { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
            );
        }

        // Start timer
        activityTimer = setInterval(updateActivityDuration, 1000);

    } else if (!isPaused) {
        // --- PAUSE ---
        pauseTracking();
        if (startPauseBtn) {
            startPauseBtn.textContent = 'Resume Tracking';
            startPauseBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            startPauseBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }

    } else {
        // --- RESUME ---
        resumeTracking();
        if (startPauseBtn) {
            startPauseBtn.textContent = 'Pause Tracking';
            startPauseBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            startPauseBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        }
    }
}

function stopTracking() {
    isTracking = false;
    isPaused = false;
    clearInterval(activityTimer);
    if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);

    const startPauseBtn = document.getElementById('startPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const activityStatus = document.getElementById('activityStatus');

    // Reset buttons safely
    if (startPauseBtn) {
        startPauseBtn.textContent = 'Start Tracking';
        startPauseBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700', 'bg-green-600', 'hover:bg-green-700');
        startPauseBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
    }
    if (stopBtn) stopBtn.classList.add('hidden');
    if (activityStatus) activityStatus.classList.add('hidden');

    // Update weight from calories burned (optional)
    if (totalDistance > 0) {
        updateWeightFromActivity();
        queueActivityUpdate();
    }

    // Reset state
    totalDistance = 0;
    totalSteps = 0;
    lastLocation = null;
    startTime = null;
    pausedTime = 0;
    pauseStart = null;

    showToast('Tracking stopped', 'info');
}


function stopActivityTracking() {
    isTracking = false;
    clearInterval(activityTimer);
    navigator.geolocation.clearWatch(watchId);

    const startButton = document.getElementById('startActivity');
    const activityStatus = document.getElementById('activityStatus');

    startButton.textContent = 'Start Tracking Activity';
    startButton.classList.remove('bg-red-600', 'hover:bg-red-700');
    startButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
    activityStatus.classList.add('hidden');

    if (totalDistance > 0) updateWeightFromActivity();

    totalDistance = 0;
    totalSteps = 0;
    lastLocation = null;
}

function updatePosition(position) {
    if (!isTracking || isPaused) return;

    const accuracy = position.coords.accuracy;
    if (accuracy > MIN_GPS_ACCURACY) {
        showToast('Waiting for better GPS signal...', 'info');
        return;
    }

    const currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    const now = Date.now();

    if (lastLocation) {
        const distance = smoothGPS(currentLocation);
        const durationHrs = (now - lastUpdateTime) / 3600000;
        const speed = distance / durationHrs;

        if (!isIdle && speed <= MAX_SPEED_KMH) {
            totalDistance += distance;
            updateActivityStats(speed);
        }
    }

    lastLocation = currentLocation;
    lastUpdateTime = now;
}
document.getElementById('startPauseBtn').addEventListener('click', toggleStartPause);
document.getElementById('stopBtn').addEventListener('click', stopTracking);


// ---------------------
// MET calories
// ---------------------
function getMET(speed) {
    if (speed < 3) return 2.0;
    if (speed < 5) return 3.5;
    if (speed < 7) return 5.0;
    if (speed < 9) return 8.0;
    if (speed < 12) return 11.0;
    return 14.0;
}

function updateActivityStats(speed) {
    document.getElementById('distanceToday').textContent = `${totalDistance.toFixed(2)} km`;
    document.getElementById('stepsToday').textContent = totalSteps.toString();
    document.getElementById('currentSpeed').textContent = `${speed.toFixed(1)} km/h`;

    const met = getMET(speed);
    const weight = parseFloat(weightData[0]?.weight) || 70;

    const durationHrs = Math.max((Date.now() - (startTime || Date.now()) - (pausedTime || 0)) / 3600000, 0);

    const calories = met * weight * durationHrs;
    document.getElementById('caloriesBurned').textContent = `${Math.round(calories)} kcal`;
}


function updateActivityDuration() {
    const duration = Date.now() - startTime - pausedTime; 
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    document.getElementById('activityDuration').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


function updateWeightFromActivity() {
    const calories = parseInt(document.getElementById('caloriesBurned').textContent);
    const weightLoss = calories / 7700;

    if (weightData.length > 0) {
        const currentWeight = weightData[0].weight;
        const newWeight = currentWeight - weightLoss;

        function getMalawiTimeString() {
            return new Date().toLocaleString('en-MW', {
                timeZone: 'Africa/Blantyre',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        // add new weight entry
        addWeightEntry(
            newWeight,
            getMalawiTimeString(),
            `Automatic update after burning ${calories} kcal during activity`
        );
    }
}

// ---------------------
// Distance helper
// ---------------------
function calculateDistance(p1, p2) {
    const R = 6371;
    const dLat = toRad(p2.lat - p1.lat);
    const dLon = toRad(p2.lng - p1.lng);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) { 
    return degrees * (Math.PI / 180); 
}

function queueActivityUpdate() {
    const queue = JSON.parse(localStorage.getItem('activityQueue') || '[]');
    const caloriesText = document.getElementById('caloriesBurned')?.textContent || '0';
    const caloriesValue = parseFloat((caloriesText+'').replace(/[^\d.-]/g, ''))

    queue.push({
        timestamp: Date.now(),
        distance: totalDistance,
        steps: totalSteps,
        calories: caloriesValue
    });
    localStorage.setItem('activityQueue', JSON.stringify(queue));
}

// Load activity queue and restore stats on app startup
function loadActivityQueue() {
    const queue = JSON.parse(localStorage.getItem('activityQueue') || '[]');
    if (!queue.length) return;

    // Calculate totals from stored activity updates
    let totalDist = 0, totalStepsCount = 0, totalCalories = 0;
    queue.forEach(update => {
        totalDist += update.distance;
        totalStepsCount += update.steps;
        totalCalories += update.calories;
    });

    // Restore global variables
    totalDistance = totalDist;
    totalSteps = totalStepsCount;

    // Update UI
    document.getElementById('distanceToday').textContent = `${totalDistance.toFixed(2)} km`;
    document.getElementById('stepsToday').textContent = totalSteps.toString();
    document.getElementById('caloriesBurned').textContent = `${Math.round(totalCalories)} kcal`;
}

// Initialize
loadActivityQueue();
updateOnlineStatus();

// Weekly report generation
function generateWeeklyReport() {
    if (weightData.length === 0) return null;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekData = weightData.filter(entry => new Date(entry.date) >= oneWeekAgo);
    if (weekData.length === 0) return null;

    const startWeight = weekData[weekData.length - 1].weight;
    const endWeight = weekData[0].weight;
    const weightChange = endWeight - startWeight;
    const avgWeight = weekData.reduce((sum, entry) => sum + entry.weight, 0) / weekData.length;

    const activities = weekData
        .filter(entry => entry.notes?.includes('Automatic update'))
        .length;

    return {
        startWeight,
        endWeight,
        weightChange,
        avgWeight,
        activities,
        trend: weightChange < 0 ? 'decreasing' : 'increasing',
        bmi: calculateBMI(endWeight, userProfile.height)
    };
}

function showWeeklyReport(report) {
    const weeklyReport = document.getElementById('weeklyReport');
    if (!weeklyReport || !report) return;

    const weeklyStats = calculateWeeklyStats();
    if (!weeklyStats) {
        weeklyReport.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                Not enough data for weekly report
            </div>
        `;
        return;
    }

    weeklyReport.innerHTML = `
        <div class="space-y-3">
            <h3 class="font-medium text-gray-700">Weekly Progress Summary</h3>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-3 rounded-lg shadow-sm">
                    <p class="text-sm text-gray-600">Weekly Change</p>
                    <p class="text-lg font-semibold ${weeklyStats.change < 0 ? 'text-green-600' : 'text-red-600'}">
                        ${weeklyStats.change.toFixed(2)} kg/week
                    </p>
                </div>
                <div class="bg-white p-3 rounded-lg shadow-sm">
                    <p class="text-sm text-gray-600">Trend</p>
                    <p class="text-lg font-semibold ${weeklyStats.trend < 0 ? 'text-green-600' : 'text-red-600'}">
                        ${weeklyStats.trend < 0 ? '↓ Decreasing' : '↑ Increasing'}
                    </p>
                </div>
            </div>
        </div>
    `;
}

function calculateWeeklyStats() {
    const recentEntries = weightData.slice(0, Math.min(7, weightData.length));
    const weeklyChange = recentEntries.length > 1 
        ? (recentEntries[0].weight - recentEntries[recentEntries.length - 1].weight) 
        : 0;

    const weeklyData = calculateWeeklyAverages();
    const trendLine = calculateTrendLine(weeklyData.averages);
    const trend = trendLine.length > 1 
        ? trendLine[trendLine.length - 1] - trendLine[0]
        : 0;

    return {
        change: weeklyChange,
        trend: trend
    };
}

// User profile functions
function loadUserProfile() {
    try {
        const savedProfile = localStorage.getItem('userProfile');
        if (!savedProfile) return false;

        const parsed = JSON.parse(savedProfile);

        // Validate profile data
        if (!parsed.height || parsed.height <= 0) {
            throw new Error('Invalid height value');
        }
        if (!parsed.age || parsed.age <= 0) {
            throw new Error('Invalid age value');
        }
        if (!parsed.gender) {
            throw new Error('Missing gender value');
        }

        userProfile = parsed;
        updateHealthMetrics();
        return true;
    } catch (error) {
        console.error('Error loading profile:', error);
        localStorage.removeItem('userProfile');
        showToast('Error loading profile data', 'error');
        return false;
    }
}

function saveUserProfile(profileData) {
    userProfile = {
        height: parseFloat(profileData.height),
        age: parseInt(profileData.age),
        gender: profileData.gender,
        activityLevel: profileData.activityLevel
    };
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    updateHealthMetrics();
}

function updateHealthMetrics() {
    if (!userProfile.height || weightData.length === 0) {
        resetHealthMetrics();
        return;
    }

    try {
        const currentWeight = weightData[0].weight;
        const bmi = calculateBMI(currentWeight, userProfile.height);
        if (isNaN(bmi) || !isFinite(bmi)) {
            throw new Error('Invalid BMI calculation');
        }

        const bmiCategory = getBMICategory(bmi);
        const tdee = calculateTDEE(currentWeight);

        // Update UI with health metrics
        document.getElementById('bmiValue').textContent = bmi.toFixed(1);
        document.getElementById('bmiCategory').textContent = bmiCategory.category;
        document.getElementById('bmiCategory').className = bmiCategory.color;
        document.getElementById('tdeeValue').textContent = `${tdee.toFixed(0)} kcal`;
    } catch (error) {
        console.error('Error updating health metrics:', error);
        resetHealthMetrics();
        showToast('Error calculating health metrics', 'error');
    }
}

function resetHealthMetrics() {
    document.getElementById('bmiValue').textContent = '--';
    document.getElementById('bmiCategory').textContent = '--';
    document.getElementById('bmiCategory').className = '';
    document.getElementById('tdeeValue').textContent = '--';
}

function calculateTDEE(weight) {
    // Basic Metabolic Rate (BMR) using Mifflin-St Jeor Equation
    let bmr;
    if (userProfile.gender === 'male') {
        bmr = (10 * weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * userProfile.height) - (5 * userProfile.age) - 161;
    }

    // Activity Multiplier
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very: 1.725,
        extra: 1.9
    };

    return bmr * activityMultipliers[userProfile.activityLevel];
}

// BMI display update function
function updateBMIDisplay() {
    if (!userProfile.height || weightData.length === 0) {
        document.getElementById('bmiValue').textContent = '--';
        document.getElementById('bmiCategory').textContent = '--';
        return;
    }

    const currentWeight = weightData[0].weight;
    const bmi = calculateBMI(currentWeight, userProfile.height);
    const bmiCategory = getBMICategory(bmi);

    document.getElementById('bmiValue').textContent = bmi.toFixed(1);
    document.getElementById('bmiCategory').textContent = bmiCategory.category;
    document.getElementById('bmiCategory').className = bmiCategory.color;
}

// Add after profile modal event listener
document.getElementById('profileForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const profileData = {
        height: document.getElementById('profileHeight').value,
        age: document.getElementById('profileAge').value,
        gender: document.getElementById('profileGender').value,
        activityLevel: document.getElementById('profileActivityLevel').value
    };

    // Validate height
    if (profileData.height <= 0) {
        showToast('Height must be greater than 0', 'error');
        return;
    }

    saveUserProfile(profileData);
    document.getElementById('profileModal').classList.add('hidden');
    showToast('Profile updated successfully', 'success');
});

// Add close button handler
document.getElementById('profileModal').addEventListener('click', function (e) {
    if (e.target === this) {
        this.classList.add('hidden');
    }
});

function validateProfileData(profile) {
    const errors = [];
    
    if (!profile.height || profile.height <= 0 || profile.height > 300) {
        errors.push('Height must be between 1 and 300 cm');
    }
    
    if (!profile.age || profile.age <= 0 || profile.age > 150) {
        errors.push('Age must be between 1 and 150 years');
    }
    
    if (!profile.gender || !['male', 'female', 'other'].includes(profile.gender)) {
        errors.push('Please select a valid gender');
    }
    
    if (!profile.activityLevel || !['sedentary', 'light', 'moderate', 'very', 'extra'].includes(profile.activityLevel)) {
        errors.push('Please select a valid activity level');
    }

    if (errors.length > 0) {
        throw new Error(errors.join('\n'));
    }
    
    return true;
}

// Trends chart update function
function updateTrendsChart() {
    const trendsChart = document.getElementById('trendsChart');
    if (!trendsChart || weightData.length < 2) {
        if (trendsChart) {
            trendsChart.style.display = 'none';
        }
        return;
    }

    trendsChart.style.display = 'block';

    // Destroy existing chart if it exists
    if (window.trendsChartInstance) {
        window.trendsChartInstance.destroy();
    }

    const weeklyData = calculateWeeklyAverages();
    
    // Calculate trend line
    const trendLineData = calculateTrendLine(weeklyData.averages);
    
    window.trendsChartInstance = new Chart(trendsChart, {
        type: 'line',
        data: {
            labels: weeklyData.labels,
            datasets: [
                {
                    label: 'Weekly Average',
                    data: weeklyData.averages,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Trend Line',
                    data: trendLineData,
                    borderColor: 'rgba(255, 99, 132, 0.8)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Weight: ${context.raw.toFixed(1)} kg`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                }
            }
        }
    });
}

// Add trend line calculation
function calculateTrendLine(averages) {
    if (averages.length < 2) return [];

    const n = averages.length;
    const xs = Array.from({length: n}, (_, i) => i);
    const sum_x = xs.reduce((a, b) => a + b, 0);
    const sum_y = averages.reduce((a, b) => a + b, 0);
    const sum_xy = xs.map((x, i) => x * averages[i]).reduce((a, b) => a + b, 0);
    const sum_xx = xs.map(x => x * x).reduce((a, b) => a + b, 0);

    const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    const intercept = (sum_y - slope * sum_x) / n;

    return xs.map(x => slope * x + intercept);
}

function calculateWeeklyAverages() {
    if (weightData.length < 2) {
        return {
            labels: [],
            averages: []
        };
    }

    // Sort data chronologically first
    const sortedData = [...weightData].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    // Group by weeks
    const weeklyWeights = {};
    sortedData.forEach(entry => {
        const date = new Date(entry.date);
        const weekKey = getWeekKey(date);
        
        if (!weeklyWeights[weekKey]) {
            weeklyWeights[weekKey] = {
                weights: [],
                dates: []
            };
        }
        weeklyWeights[weekKey].weights.push(entry.weight);
        weeklyWeights[weekKey].dates.push(date);
    });

    // Sort weeks chronologically
    const sortedWeeks = Object.keys(weeklyWeights).sort();

    return {
        labels: sortedWeeks.map(week => {
            const firstDate = weeklyWeights[week].dates[0];
            return firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        averages: sortedWeeks.map(week => {
            const weights = weeklyWeights[week].weights;
            const average = weights.reduce((sum, weight) => sum + weight, 0) / weights.length;
            return Number(average.toFixed(1));
        })
    };
}

function updatePredictions() {
    const predictions = {
        oneMonth: predictWeight(30),
        twoMonths: predictWeight(60),
        threeMonths: predictWeight(90)
    };

    if (!predictions.oneMonth) {
        // Reset predictions if not enough data
        document.getElementById('oneMonthPrediction').textContent = '--';
        document.getElementById('twoMonthPrediction').textContent = '--';
        document.getElementById('threeMonthPrediction').textContent = '--';
        document.getElementById('oneMonthChange').textContent = '--';
        document.getElementById('twoMonthChange').textContent = '--';
        document.getElementById('threeMonthChange').textContent = '--';
        return;
    }

    const currentWeight = weightData[0].weight;

    // Update UI for each prediction period
    updatePredictionUI('oneMonth', predictions.oneMonth, currentWeight);
    updatePredictionUI('twoMonth', predictions.twoMonths, currentWeight);
    updatePredictionUI('threeMonth', predictions.threeMonths, currentWeight);
}

function updatePredictionUI(period, predictedWeight, currentWeight) {
    const change = predictedWeight - currentWeight;
    const changeText = change >= 0 ? `+${change.toFixed(1)}` : `${change.toFixed(1)}`;
    const element = period.charAt(0).toLowerCase() + period.slice(1);
    
    document.getElementById(`${element}Prediction`).textContent = `${predictedWeight.toFixed(1)} kg`;
    document.getElementById(`${element}Change`).textContent = `${changeText} kg`;
    document.getElementById(`${element}Change`).className = 
        `text-sm ${change < 0 ? 'text-green-600' : 'text-red-600'}`;
}

function syncData() {
    try {
        // Save latest data to localStorage (weightData & activityQueue already maintained)
        localStorage.setItem('weightData', JSON.stringify(weightData));
        localStorage.setItem('activityQueue', JSON.stringify(
            JSON.parse(localStorage.getItem('activityQueue') || '[]')
        ));

        // Refresh UI elements so user sees everything up to date
        updateTrendsChart();
        loadData();
        updateTrendsChart();

        showToast('All progress saved locally', 'success');
    } catch (e) {
        console.error('Error syncing data:', e);
        showToast('Failed to save data locally', 'error');
    }
}

window.addEventListener('beforeunload', syncData);

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        syncData();
    }
});

document.addEventListener('DOMContentLoaded', init);

function smoothGPS(currentLocation) {
    if (!lastLocation) return 0;

    const distance = calculateDistance(lastLocation, currentLocation);
    // Add to buffer
    gpsBuffer.push(distance);
    if (gpsBuffer.length > MAX_BUFFER_SIZE) {
        gpsBuffer.shift();
    }

    // Calculate smoothed distance
    const smoothedDistance = gpsBuffer.reduce((a, b) => a + b, 0) / gpsBuffer.length;

    // Compute allowed max distance for the elapsed interval (km)
    const now = Date.now();
    const deltaSeconds = Math.max(1, (now - lastUpdateTime) / 1000); // avoid zero
    const maxDistanceForInterval = (MAX_SPEED_KMH * deltaSeconds) / 3600; // km

    return Math.min(smoothedDistance, maxDistanceForInterval);
}

const spBtn = document.getElementById('startPauseBtn');
if (spBtn) spBtn.addEventListener('click', toggleStartPause);

const sBtn = document.getElementById('stopBtn');
if (sBtn) sBtn.addEventListener('click', stopTracking);