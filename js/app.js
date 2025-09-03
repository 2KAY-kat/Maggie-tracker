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

        // Toast Notification System
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            
            // Set toast styles based on type
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

        // Simulate syncing data to the cloud
        function syncData() {
            const syncStatus = document.getElementById('syncStatus');
            syncStatus.classList.remove('hidden');
            
            // Simulate network delay
            setTimeout(() => {
                syncStatus.classList.add('hidden');
                showToast('Data synced to cloud', 'success');
            }, 1500);
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
            updateUI();
            showToast('Weight entry saved successfully', 'success');
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
        }

        // Update the weight history list
        function updateHistoryList() {
            const historyList = document.getElementById('historyList');
            const noEntriesMessage = document.getElementById('noEntriesMessage');
            
            // Clear the list
            historyList.innerHTML = '';
            
            if (weightData.length === 0) {
                historyList.appendChild(noEntriesMessage);
                return;
            }
            
            noEntriesMessage.remove();
            
            // Add each entry to the list
            weightData.forEach(entry => {
                const entryElement = document.createElement('div');
                entryElement.className = 'bg-gray-50 rounded-lg p-4 flex items-center justify-between group hover:bg-gray-100 transition';
                
                // Calculate weight change from previous entry
                let changeText = '';
                const index = weightData.indexOf(entry);
                if (index < weightData.length - 1) {
                    const change = entry.weight - weightData[index + 1].weight;
                    const changeSymbol = change >= 0 ? '+' : '';
                    changeText = `<span class="${change >= 0 ? 'text-red-500' : 'text-green-500'} text-sm font-medium">${changeSymbol}${change.toFixed(1)} kg</span>`;
                }
                
                entryElement.innerHTML = `
                    <div>
                        <div class="flex items-center">
                            <span class="font-bold text-lg">${entry.weight.toFixed(1)} kg</span>
                            <span class="mx-2">•</span>
                            <span class="text-gray-600">${formatDate(entry.date)}</span>
                        </div>
                        ${entry.notes ? `<p class="text-gray-500 text-sm mt-1">${entry.notes}</p>` : ''}
                        ${changeText ? `<p class="mt-1">${changeText} since previous entry</p>` : ''}
                    </div>
                    <button class="delete-entry text-red-500 opacity-0 group-hover:opacity-100 transition p-1" data-id="${entry.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                `;
                
                historyList.appendChild(entryElement);
                
                // Add delete event listener
                entryElement.querySelector('.delete-entry').addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    deleteEntry(id);
                });
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
                                    label: function(context) {
                                        return `Weight: ${context.raw} kg`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        // Initialize the app
        function init() {
            // Set the current date as default
            document.getElementById('date').valueAsDate = today;
            
            // Set the current year in the footer
            document.getElementById('currentYear').textContent = today.getFullYear();
            
            // Load data from localStorage
            loadData();
            
            // Register service worker
            registerServiceWorker();
            
            // Set up event listeners
            document.getElementById('weightForm').addEventListener('submit', function(e) {
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
            
            document.getElementById('clearData').addEventListener('click', function() {
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
        }

        // Update online status indicator
        function updateOnlineStatus() {
            const connectionStatus = document.getElementById('connectionStatus');
            if (navigator.onLine) {
                connectionStatus.textContent = 'Connected';
                connectionStatus.classList.add('text-green-600');
                connectionStatus.classList.remove('text-red-600');
            } else {
                connectionStatus.textContent = 'Offline - Changes will sync when you reconnect';
                connectionStatus.classList.add('text-red-600');
                connectionStatus.classList.remove('text-green-600');
                showToast('You are currently offline. Changes will be saved locally.', 'info');
            }
        }

        // Initialize the app when the DOM is loaded
        document.addEventListener('DOMContentLoaded', init);