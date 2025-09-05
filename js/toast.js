// // Toast Notification System
// export  function showToast(message, type = 'info') {
//     const toast = document.createElement('div');

//     // Seting toast styles based on type
//     let bgColor, iconSvg;

//     switch (type) {
//         case 'success':
//             bgColor = 'bg-green-600';
//             iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                         <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
//                     </svg>`;
//             break;
//         case 'error':
//             bgColor = 'bg-red-600';
//             iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                         <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
//                     </svg>`;
//             break;
//         case 'info':
//         default:
//             bgColor = 'bg-indigo-600';
//             iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                         <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
//                     </svg>`;
//             break;
//     }

//     toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center mb-3 animate-fade-in max-w-xs transition-all duration-300 ease-in-out transform translate-y-0 opacity-100`;
//     toast.innerHTML = `
//         ${iconSvg}
//         <span>${message}</span>
//         <button class="ml-auto text-white focus:outline-none">
//             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//         </button>
//     `;

//     // Add close button functionality
//     toast.querySelector('button').addEventListener('click', () => {
//         removeToast(toast);
//     });

//     // Add to container
//     document.getElementById('toastContainer').appendChild(toast);

//     // Auto remove after 5 seconds
//     setTimeout(() => {
//         removeToast(toast);
//     }, 5000);
// }

// export function removeToast(toast) {
//     // Add fade out animation
//     toast.style.opacity = '0';
//     toast.style.transform = 'translateY(10px)';

//     // Remove from DOM after animation
//     setTimeout(() => {
//         toast.remove();
//     }, 300);
// }

// // Delete a weight entry
// export function deleteEntry(id) {
//     weightData = weightData.filter(entry => entry.id !== id);
//     saveData();
//     updateUI();
//     showToast('Entry deleted successfully', 'info');
// }