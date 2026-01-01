// Run this in the browser console to clear dashboard cache
// Or navigate to: chrome://settings/siteData and clear site data

console.log('Clearing dashboard cache...');

// Clear localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('dashboard') || key.includes('react-query') || key.includes('REACT_QUERY'))) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => localStorage.removeItem(key));
console.log('Removed from localStorage:', keysToRemove);

// Clear sessionStorage
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (key.includes('dashboard') || key.includes('react-query') || key.includes('REACT_QUERY'))) {
    sessionKeysToRemove.push(key);
  }
}
sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
console.log('Removed from sessionStorage:', sessionKeysToRemove);

console.log('Cache cleared! Please refresh the page.');
