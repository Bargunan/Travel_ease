// API Configuration
const API_BASE_URL = 'https://travel-ease-backend-l1wr.onrender.com';

// API Helper Functions
class TravelEaseAPI {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('authToken');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Authentication endpoints
    static async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    static async signup(userData) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Accommodation endpoints
    static async searchAccommodations(params) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/accommodations/search?${queryString}`);
    }

    static async getAccommodation(id) {
        return this.request(`/accommodations/${id}`);
    }

    // Health check
    static async healthCheck() {
        return this.request('/health');
    }
}

// Global state
let currentUser = null;
let accommodations = [];

// Sample fallback data
const sampleAccommodations = [
    {
        id: 1,
        name: "Cozy Central Hostel",
        city: "Bangalore",
        accommodation_type: "hostel",
        price_per_night: 2500,
        description: "Perfect for solo female travelers with excellent safety measures and a vibrant community atmosphere.",
        amenities: ["WiFi", "AC", "Breakfast", "24/7 Security"],
        safety_rating: 5,
        verified: true,
        is_active: true
    },
    {
        id: 2,
        name: "Backpacker's Paradise",
        city: "Pune",
        accommodation_type: "hostel",
        price_per_night: 1800,
        description: "Budget-friendly hostel with a great kitchen and social atmosphere for meeting fellow travelers.",
        amenities: ["WiFi", "Kitchen", "Common Room", "Lockers"],
        safety_rating: 4,
        verified: true,
        is_active: true
    }
];

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 TravelEase Frontend Starting...');
    
    // Check backend connection
    await checkBackendConnection();
    
    // Check for existing authentication
    await checkAuthStatus();
    
    // Set default dates
    setDefaultDates();
    
    // Load initial data
    await loadInitialData();
    
    console.log('✅ TravelEase Frontend Ready!');
});

async function checkBackendConnection() {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    try {
        await TravelEaseAPI.healthCheck();
        console.log('✅ Backend connection successful');
        statusText.textContent = 'Connected to backend server';
        statusIndicator.className = 'status-indicator connected';
    } catch (error) {
        console.warn('⚠️ Backend connection failed, using sample data');
        statusText.textContent = 'Demo mode (backend offline)';
        statusIndicator.className = 'status-indicator offline';
        accommodations = sampleAccommodations;
    }
}

async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        console.log('Found auth token, checking validity...');
        // For now, we'll skip the profile check if backend is offline
        updateAuthUI();
    }
}

function setDefaultDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('checkin').value = today.toISOString().split('T')[0];
    document.getElementById('checkout').value = tomorrow.toISOString().split('T')[0];
}

async function loadInitialData() {
    try {
        if (accommodations.length === 0) {
            const response = await TravelEaseAPI.searchAccommodations({});
            accommodations = response.accommodations || sampleAccommodations;
        }
    } catch (error) {
        console.warn('Using sample accommodations data');
        accommodations = sampleAccommodations;
    }
    
    displayAccommodations(accommodations);
}

// Authentication functions
function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
}

function showSignup() {
    document.getElementById('signupModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function login(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        showLoadingButton(event.target.querySelector('button[type="submit"]'), 'Logging in...');
        
        const response = await TravelEaseAPI.login(email, password);
        localStorage.setItem('authToken', response.token);
        currentUser = response.user;
        
        updateAuthUI();
        closeModal('loginModal');
        showSuccessMessage(`Welcome back, ${currentUser.full_name}!`);
        
    } catch (error) {
        console.error('Login failed:', error);
        showErrorMessage(error.message || 'Login failed. Please check your credentials.');
    } finally {
        hideLoadingButton(event.target.querySelector('button[type="submit"]'), 'Login');
    }
}

async function signup(event) {
    event.preventDefault();
    
    const formData = {
        full_name: document.getElementById('signupName').value,
        age: parseInt(document.getElementById('signupAge').value),
        email: document.getElementById('signupEmail').value,
        gender: document.getElementById('signupGender').value,
        password: document.getElementById('signupPassword').value,
        interests: document.getElementById('signupInterests').value.split(',').map(i => i.trim()).filter(i => i)
    };
    
    try {
        showLoadingButton(event.target.querySelector('button[type="submit"]'), 'Creating account...');
        
        const response = await TravelEaseAPI.signup(formData);
        localStorage.setItem('authToken', response.token);
        currentUser = response.user;
        
        updateAuthUI();
        closeModal('signupModal');
        showSuccessMessage(`Welcome to TravelEase, ${currentUser.full_name}!`);
        
    } catch (error) {
        console.error('Signup failed:', error);
        showErrorMessage(error.message || 'Signup failed. Please try again.');
    } finally {
        hideLoadingButton(event.target.querySelector('button[type="submit"]'), 'Create Account');
    }
}

function updateAuthUI() {
    const userMenu = document.querySelector('.user-menu');
    if (currentUser) {
        const firstName = currentUser.full_name?.split(' ')[0] || 'User';
        userMenu.innerHTML = `
            <span>Hi, ${firstName}!</span>
            <button class="btn btn-secondary" onclick="logout()">Logout</button>
        `;
    } else {
        userMenu.innerHTML = `
            <button class="btn btn-secondary" onclick="showLogin()">Login</button>
            <button class="btn btn-primary" onclick="showSignup()">Sign Up</button>
        `;
    }
}

function logout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    updateAuthUI();
    showSuccessMessage('Logged out successfully!');
}

// Search functions
// Update your searchAccommodations function in script.js

async function searchAccommodations(event) {
  event.preventDefault();
  const destination = document.getElementById('destination').value;
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  
  showLoading('loadingAccommodations');
  
  try {
      // Build search parameters - only include non-empty values
      const searchParams = {};
      
      if (destination && destination.trim() !== '') {
          searchParams.city = destination.trim();
      }
      
      // Only include dates if they are valid
      if (checkin && checkin !== '') {
          searchParams.checkin = checkin;
      }
      
      if (checkout && checkout !== '') {
          searchParams.checkout = checkout;
      }
      
      console.log('🔍 Search parameters:', searchParams);
      
      const response = await TravelEaseAPI.searchAccommodations(searchParams);
      accommodations = response.accommodations || [];
      
      hideLoading('loadingAccommodations');
      displayAccommodations(accommodations);
      
      // Scroll to results
      document.getElementById('accommodations').scrollIntoView({ behavior: 'smooth' });
      
      console.log(`✅ Found ${accommodations.length} accommodations`);
      
  } catch (error) {
      console.error('❌ Search failed:', error);
      hideLoading('loadingAccommodations');
      
      // Fallback to sample data
      let filtered = sampleAccommodations;
      if (destination && destination.trim() !== '') {
          filtered = filtered.filter(acc => 
              acc.city.toLowerCase().includes(destination.toLowerCase()) || 
              acc.name.toLowerCase().includes(destination.toLowerCase())
          );
      }
      accommodations = filtered;
      displayAccommodations(accommodations);
      
      showErrorMessage('Search temporarily unavailable. Showing sample results.');
  }
}

// Alternative: Search without dates for now
async function searchAccommodationsSimple(event) {
  event.preventDefault();
  const destination = document.getElementById('destination').value;
  
  showLoading('loadingAccommodations');
  
  try {
      // Simple search with just city parameter
      const searchParams = {};
      
      if (destination && destination.trim() !== '') {
          searchParams.city = destination.trim();
      }
      
      console.log('🔍 Simple search parameters:', searchParams);
      
      const response = await TravelEaseAPI.searchAccommodations(searchParams);
      accommodations = response.accommodations || [];
      
      hideLoading('loadingAccommodations');
      displayAccommodations(accommodations);
      
      document.getElementById('accommodations').scrollIntoView({ behavior: 'smooth' });
      
      if (accommodations.length > 0) {
          showSuccessMessage(`Found ${accommodations.length} accommodations!`);
      } else {
          showErrorMessage('No accommodations found. Try a different city.');
      }
      
  } catch (error) {
      console.error('❌ Search failed:', error);
      hideLoading('loadingAccommodations');
      
      // Show sample data as fallback
      accommodations = sampleAccommodations;
      displayAccommodations(accommodations);
      
      showErrorMessage('Using sample data. Backend search temporarily unavailable.');
  }
}

// Add this enhanced displayAccommodations function to your script.js

// Replace your displayAccommodations function with this fixed version

function displayAccommodations(accs) {
  console.log('🎨 displayAccommodations called with:', accs);
  console.log('🎨 Number of accommodations:', accs ? accs.length : 0);
  
  const grid = document.getElementById('accommodationGrid');
  
  if (!grid) {
      console.error('❌ accommodationGrid element not found!');
      return;
  }
  
  if (!accs || accs.length === 0) {
      console.log('📭 No accommodations to display');
      grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
              <h3>No accommodations found</h3>
              <p>Try adjusting your search criteria or check back later.</p>
          </div>
      `;
      return;
  }
  
  console.log('🏨 Processing accommodations for display...');
  
  const cardsHTML = accs.map((acc, index) => {
      console.log(`🏨 Processing accommodation ${index + 1}:`, acc);
      
      // Calculate advance payment
      const advance = calculateAdvancePayment(acc.price_per_night || 2000);
      
      // Handle amenities - provide defaults if empty
      let amenities = [];
      if (Array.isArray(acc.amenities) && acc.amenities.length > 0) {
          amenities = acc.amenities;
      } else {
          // Default amenities based on type
          switch(acc.accommodation_type) {
              case 'hostel':
                  amenities = ['WiFi', 'Shared Kitchen', '24/7 Security'];
                  break;
              case 'hotel':
                  amenities = ['WiFi', 'Room Service', 'Reception'];
                  break;
              case 'guesthouse':
                  amenities = ['WiFi', 'Breakfast', 'Common Area'];
                  break;
              default:
                  amenities = ['WiFi', 'Clean Rooms'];
          }
      }
      
      // Create the card HTML
      const cardHTML = `
          <div class="accommodation-card" data-type="${acc.accommodation_type || 'hostel'}">
              <div class="card-image">
                  <span>${getAccommodationIcon(acc.accommodation_type || 'hostel')} ${acc.name || 'Unnamed Accommodation'}</span>
              </div>
              <div class="card-content">
                  <h3 class="card-title">${acc.name || 'Unnamed Accommodation'}</h3>
                  <div class="card-location">
                      <span>📍</span>
                      <span>${acc.city || 'Unknown City'}, India</span>
                  </div>
                  <div class="card-features">
                      ${amenities.slice(0, 2).map(amenity => `<span class="feature-badge">${amenity}</span>`).join('')}
                      <span class="safety-badge">👩‍💼 Female Safe ${'⭐'.repeat(acc.safety_rating || 4)}</span>
                      ${acc.verified ? '<span class="verified-badge">✅ Verified Clean</span>' : ''}
                  </div>
                  <div class="card-price">
                      <div>
                          <div class="price">₹${(acc.price_per_night || 2000).toLocaleString()}/night</div>
                          <small style="color: #32cd32;">Pay ₹${advance} now, ₹${((acc.price_per_night || 2000) - advance).toLocaleString()} on arrival</small>
                      </div>
                      <button class="btn btn-primary" onclick="viewAccommodation(${acc.id || 1})">View Details</button>
                  </div>
              </div>
          </div>
      `;
      
      console.log(`✅ Card HTML generated for ${acc.name}`);
      return cardHTML;
  });
  
  console.log('🎨 Setting innerHTML with', cardsHTML.length, 'cards');
  grid.innerHTML = cardsHTML.join('');
  
  console.log('✅ Display complete. Grid innerHTML length:', grid.innerHTML.length);
  
  // Force a repaint to ensure visibility
  grid.style.display = 'none';
  grid.offsetHeight; // Trigger reflow
  grid.style.display = 'grid';
}

// Also make sure calculateAdvancePayment function exists
function calculateAdvancePayment(pricePerNight) {
  if (!pricePerNight) return 500;
  
  // Calculate 20% advance payment, minimum ₹300, maximum ₹500
  const advance = Math.round(pricePerNight * 0.2);
  return Math.min(Math.max(advance, 300), 500);
}

// Make sure getAccommodationIcon function exists
function getAccommodationIcon(type) {
  const icons = {
      hostel: '🏠',
      hotel: '🏨',
      guesthouse: '🏡',
      homestay: '🏘️'
  };
  return icons[type] || '🏠';
}

// Test function to verify display works
function testDisplay() {
  const testData = [{
      id: 1,
      name: "Cozy Central Hostel",
      description: "A safe and clean hostel in the heart of the city",
      city: "Bangalore",
      price_per_night: 2500,
      accommodation_type: "hostel",
      amenities: [], // Empty like your real data
      photos: [],
      is_active: 1,
      safety_rating: 4,
      verified: true,
      average_rating: 4.2
  }];
  
  console.log('🧪 Testing display with sample data...');
  displayAccommodations(testData);
}

// Enhanced search function with better debugging
async function searchAccommodations(event) {
  event.preventDefault();
  const destination = document.getElementById('destination').value;
  
  console.log('🔍 Starting search for:', destination);
  
  showLoading('loadingAccommodations');
  
  try {
      const searchParams = {};
      
      if (destination && destination.trim() !== '') {
          searchParams.city = destination.trim();
      }
      
      console.log('📡 Sending API request with params:', searchParams);
      
      const response = await TravelEaseAPI.searchAccommodations(searchParams);
      
      console.log('📡 API Response received:', response);
      
      // Check response structure
      if (response && response.accommodations) {
          accommodations = response.accommodations;
          console.log('✅ Accommodations extracted:', accommodations);
      } else if (response && Array.isArray(response)) {
          accommodations = response;
          console.log('✅ Response is array of accommodations:', accommodations);
      } else {
          console.warn('⚠️ Unexpected response structure:', response);
          accommodations = [];
      }
      
      hideLoading('loadingAccommodations');
      
      console.log('🎨 About to display accommodations:', accommodations);
      displayAccommodations(accommodations);
      
      // Scroll to results
      document.getElementById('accommodations').scrollIntoView({ behavior: 'smooth' });
      
      if (accommodations.length > 0) {
          showSuccessMessage(`Found ${accommodations.length} accommodations!`);
      } else {
          showErrorMessage('No accommodations found for your search.');
      }
      
  } catch (error) {
      console.error('❌ Search failed:', error);
      hideLoading('loadingAccommodations');
      
      // Show sample data as fallback
      console.log('🔄 Using fallback sample data');
      accommodations = sampleAccommodations;
      displayAccommodations(accommodations);
      
      showErrorMessage('Using sample data. Search temporarily unavailable.');
  }
}

// Debug helper function
function debugAccommodationData() {
  console.log('🐛 Current accommodations array:', accommodations);
  console.log('🐛 Grid element:', document.getElementById('accommodationGrid'));
  console.log('🐛 Grid innerHTML length:', document.getElementById('accommodationGrid')?.innerHTML.length);
}

// Add debug button to test (temporary)
function addDebugButton() {
  const debugBtn = document.createElement('button');
  debugBtn.textContent = 'Debug Display';
  debugBtn.onclick = debugAccommodationData;
  debugBtn.style.cssText = 'position: fixed; top: 200px; right: 20px; z-index: 9999; background: red; color: white; padding: 10px;';
  document.body.appendChild(debugBtn);
}

        // Add these functions to your script.js file

// Mobile Navigation Enhancement
function initializeMobileNavigation() {
  // Add mobile menu button to header
  const nav = document.querySelector('nav');
  const navLinks = document.querySelector('.nav-links');
  
  // Create mobile menu button
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.className = 'mobile-menu-btn';
  mobileMenuBtn.innerHTML = '☰';
  mobileMenuBtn.setAttribute('aria-label', 'Toggle mobile menu');
  
  // Insert mobile menu button before user menu
  const userMenu = document.querySelector('.user-menu');
  nav.insertBefore(mobileMenuBtn, userMenu);
  
  // Toggle mobile menu
  mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-active');
      mobileMenuBtn.innerHTML = navLinks.classList.contains('mobile-active') ? '✕' : '☰';
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (event) => {
      if (!nav.contains(event.target)) {
          navLinks.classList.remove('mobile-active');
          mobileMenuBtn.innerHTML = '☰';
      }
  });
  
  // Close mobile menu when window is resized to desktop
  window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
          navLinks.classList.remove('mobile-active');
          mobileMenuBtn.innerHTML = '☰';
      }
  });
}

// Responsive Modal Handling
function enhanceModalResponsiveness() {
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
      const modalContent = modal.querySelector('.modal-content');
      
      // Adjust modal size based on screen size
      function adjustModalSize() {
          const isMobile = window.innerWidth <= 768;
          
          if (isMobile) {
              modalContent.style.maxHeight = '85vh';
              modalContent.style.width = '95%';
              modalContent.style.margin = '1rem';
          } else {
              modalContent.style.maxHeight = '90vh';
              modalContent.style.width = '90%';
              modalContent.style.margin = 'auto';
          }
      }
      
      // Adjust on modal open
      const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                  if (modal.style.display === 'block') {
                      adjustModalSize();
                  }
              }
          });
      });
      
      observer.observe(modal, { attributes: true });
      
      // Adjust on window resize
      window.addEventListener('resize', adjustModalSize);
  });
}

// Touch-friendly interactions
function enhanceTouchInteractions() {
  // Add touch feedback to buttons
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
      button.addEventListener('touchstart', () => {
          button.style.transform = 'scale(0.95)';
      });
      
      button.addEventListener('touchend', () => {
          setTimeout(() => {
              button.style.transform = '';
          }, 150);
      });
  });
  
  // Add touch feedback to cards
  const cards = document.querySelectorAll('.accommodation-card, .traveler-card');
  
  cards.forEach(card => {
      card.addEventListener('touchstart', () => {
          card.style.transform = 'translateY(-2px)';
      });
      
      card.addEventListener('touchend', () => {
          setTimeout(() => {
              card.style.transform = '';
          }, 150);
      });
  });
}

// Viewport height fix for mobile browsers
function fixMobileViewportHeight() {
  // Fix for mobile browsers that change viewport height when scrolling
  function setVH() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 100); // Delay to ensure orientation change is complete
  });
}

// Smooth scroll enhancement for mobile
function enhanceSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          
          if (target) {
              const headerHeight = document.querySelector('header').offsetHeight;
              const targetPosition = target.offsetTop - headerHeight - 20;
              
              window.scrollTo({
                  top: targetPosition,
                  behavior: 'smooth'
              });
              
              // Close mobile menu if open
              const navLinks = document.querySelector('.nav-links');
              const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
              if (navLinks && navLinks.classList.contains('mobile-active')) {
                  navLinks.classList.remove('mobile-active');
                  if (mobileMenuBtn) mobileMenuBtn.innerHTML = '☰';
              }
          }
      });
  });
}

// Initialize all mobile enhancements
function initializeMobileEnhancements() {
  initializeMobileNavigation();
  enhanceModalResponsiveness();
  enhanceTouchInteractions();
  fixMobileViewportHeight();
  enhanceSmoothScrolling();
  
  console.log('📱 Mobile enhancements initialized');
}

// Update the existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 TravelEase Frontend Starting...');
  
  // Initialize mobile enhancements first
  initializeMobileEnhancements();
  
  // Check backend connection
  await checkBackendConnection();
  
  // Check for existing authentication
  await checkAuthStatus();
  
  // Set default dates
  setDefaultDates();
  
  // Load initial data
  await loadInitialData();
  
  console.log('✅ TravelEase Frontend Ready!');
});

// Add these missing functions to your script.js file

// Loading button utility functions
function showLoadingButton(button, text) {
  if (button) {
      button.disabled = true;
      button.dataset.originalText = button.textContent; // Store original text
      button.textContent = text;
      button.style.opacity = '0.7';
      button.style.cursor = 'not-allowed';
  }
}

function hideLoadingButton(button, originalText) {
  if (button) {
      button.disabled = false;
      button.textContent = originalText || button.dataset.originalText || 'Submit';
      button.style.opacity = '';
      button.style.cursor = '';
      delete button.dataset.originalText;
  }
}

// Enhanced toast notification functions
function showSuccessMessage(message) {
  showToast(message, 'success');
}

function showErrorMessage(message) {
  showToast(message, 'error');
}

function showToast(message, type = 'info') {
  // Remove any existing toasts
  const existingToasts = document.querySelectorAll('.toast-notification');
  existingToasts.forEach(toast => toast.remove());
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  
  let bgColor, icon;
  switch(type) {
      case 'success':
          bgColor = 'linear-gradient(45deg, #32cd32, #228b22)';
          icon = '✅';
          break;
      case 'error':
          bgColor = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
          icon = '❌';
          break;
      case 'warning':
          bgColor = 'linear-gradient(45deg, #ffa500, #ff8c00)';
          icon = '⚠️';
          break;
      default:
          bgColor = 'linear-gradient(45deg, #667eea, #764ba2)';
          icon = 'ℹ️';
  }
  
  toast.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      z-index: 3000;
      transform: translateX(400px);
      transition: transform 0.3s ease;
      max-width: 400px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
  `;
  
  toast.innerHTML = `
      <span>${icon}</span>
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="
          background: none;
          border: none;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          margin-left: auto;
          opacity: 0.8;
      ">&times;</button>
  `;
  
  document.body.appendChild(toast);
  
  // Slide in
  setTimeout(() => toast.style.transform = 'translateX(0)', 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
      if (document.body.contains(toast)) {
          toast.style.transform = 'translateX(400px)';
          setTimeout(() => {
              if (document.body.contains(toast)) {
                  toast.remove();
              }
          }, 300);
      }
  }, 5000);
}

// Enhanced loading utility functions
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
      element.style.display = 'block';
  }
}

function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
      element.style.display = 'none';
  }
}

// Form validation helpers
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // At least 6 characters
  return password && password.length >= 6;
}

function validateAge(age) {
  const ageNum = parseInt(age);
  return ageNum >= 18 && ageNum <= 100;
}

// Enhanced signup function with better error handling
async function signup(event) {
  event.preventDefault();
  
  const submitButton = event.target.querySelector('button[type="submit"]');
  
  // Get form data
  const formData = {
      full_name: document.getElementById('signupName').value.trim(),
      age: parseInt(document.getElementById('signupAge').value),
      email: document.getElementById('signupEmail').value.trim().toLowerCase(),
      gender: document.getElementById('signupGender').value,
      password: document.getElementById('signupPassword').value,
      interests: document.getElementById('signupInterests').value
          .split(',')
          .map(i => i.trim())
          .filter(i => i.length > 0)
  };
  
  // Frontend validation
  if (!formData.full_name) {
      showErrorMessage('Please enter your full name');
      return;
  }
  
  if (!validateEmail(formData.email)) {
      showErrorMessage('Please enter a valid email address');
      return;
  }
  
  if (!validatePassword(formData.password)) {
      showErrorMessage('Password must be at least 6 characters long');
      return;
  }
  
  if (!validateAge(formData.age)) {
      showErrorMessage('Age must be between 18 and 100');
      return;
  }
  
  if (!formData.gender) {
      showErrorMessage('Please select your gender');
      return;
  }
  
  try {
      showLoadingButton(submitButton, 'Creating account...');
      
      console.log('📝 Sending signup request:', { ...formData, password: '[HIDDEN]' });
      
      const response = await TravelEaseAPI.signup(formData);
      
      // Store auth token
      localStorage.setItem('authToken', response.token);
      currentUser = response.user;
      
      updateAuthUI();
      closeModal('signupModal');
      showSuccessMessage(`Welcome to TravelEase, ${currentUser.full_name}! 🎉`);
      
      // Clear form
      event.target.reset();
      
      console.log('✅ Signup successful:', currentUser.email);
      
  } catch (error) {
      console.error('❌ Signup failed:', error);
      
      // Show specific error message
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.message.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Try logging in instead.';
      } else if (error.message.includes('validation')) {
          errorMessage = 'Please check your information and try again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
          errorMessage = error.message;
      }
      
      showErrorMessage(errorMessage);
      
  } finally {
      hideLoadingButton(submitButton, 'Create Account');
  }
}

// Enhanced login function with better error handling
async function login(event) {
  event.preventDefault();
  
  const submitButton = event.target.querySelector('button[type="submit"]');
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  
  // Frontend validation
  if (!validateEmail(email)) {
      showErrorMessage('Please enter a valid email address');
      return;
  }
  
  if (!password) {
      showErrorMessage('Please enter your password');
      return;
  }
  
  try {
      showLoadingButton(submitButton, 'Logging in...');
      
      console.log('🔐 Sending login request for:', email);
      
      const response = await TravelEaseAPI.login(email, password);
      
      // Store auth token
      localStorage.setItem('authToken', response.token);
      currentUser = response.user;
      
      updateAuthUI();
      closeModal('loginModal');
      showSuccessMessage(`Welcome back, ${currentUser.full_name}! 👋`);
      
      // Clear form
      event.target.reset();
      
      console.log('✅ Login successful:', currentUser.email);
      
  } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Show specific error message
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.message.includes('Invalid') || error.message.includes('unauthorized')) {
          errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
          errorMessage = error.message;
      }
      
      showErrorMessage(errorMessage);
      
  } finally {
      hideLoadingButton(submitButton, 'Login');
  }
}

// Debug helper function
function debugFormData(formData) {
  console.log('Form data being sent:', {
      ...formData,
      password: formData.password ? '[HIDDEN]' : 'MISSING'
  });
}

// Add/Replace these functions in your script.js

// View accommodation details function
async function viewAccommodation(id) {
  console.log('🏨 Opening details for accommodation ID:', id);
  
  try {
      // Show loading state
      showSuccessMessage('Loading accommodation details...');
      
      let acc;
      
      // Try to get details from backend first
      try {
          const response = await TravelEaseAPI.getAccommodation(id);
          acc = response.accommodation;
          console.log('✅ Got accommodation from backend:', acc);
      } catch (error) {
          console.warn('⚠️ Backend failed, using cached data:', error);
          // Fallback to cached data
          acc = accommodations.find(a => a.id == id);
          if (!acc) {
              // Last resort - use sample data
              acc = sampleAccommodations.find(a => a.id == id);
          }
      }
      
      if (!acc) {
          showErrorMessage('Accommodation not found');
          return;
      }
      
      // Load reviews (for now, use sample reviews)
      const reviews = getSampleReviews(id);
      
      const modal = document.getElementById('accommodationModal');
      const title = document.getElementById('accommodationTitle');
      const details = document.getElementById('accommodationDetails');
      
      if (!modal || !title || !details) {
          console.error('❌ Modal elements not found');
          showErrorMessage('Modal not available');
          return;
      }
      
      title.textContent = acc.name;
      const advance = calculateAdvancePayment(acc.price_per_night);
      
      // Handle amenities safely
      let amenities = [];
      if (Array.isArray(acc.amenities) && acc.amenities.length > 0) {
          amenities = acc.amenities;
      } else {
          // Default amenities
          amenities = ['WiFi', '24/7 Security', 'Clean Rooms', 'Common Area'];
      }
      
      details.innerHTML = `
          <div class="accommodation-details">
              <div class="detail-section">
                  <h3>About This Place</h3>
                  <p>${acc.description || 'A comfortable and safe accommodation perfect for solo travelers.'}</p>
              </div>
              
              <div class="detail-section">
                  <h3>Location</h3>
                  <p>📍 ${acc.address || acc.city + ', India'}</p>
              </div>
              
              <div class="detail-section">
                  <h3>Amenities</h3>
                  <div class="amenities-list">
                      ${amenities.map(amenity => `<span class="feature-badge">${amenity}</span>`).join('')}
                  </div>
              </div>
              
              <div class="detail-section">
                  <h3>Safety & Verification</h3>
                  <div class="safety-info">
                      <div class="safety-badge">👩‍💼 Female Safety Rating: ${'⭐'.repeat(acc.safety_rating || 4)}</div>
                      ${acc.verified ? '<div class="verified-badge">✅ Cleanliness Verified by TravelEase</div>' : ''}
                  </div>
              </div>
              
              <div class="detail-section">
                  <h3>Recent Reviews</h3>
                  <div class="reviews-list">
                      ${reviews.length > 0 ? reviews.map(review => `
                          <div class="review-item" style="border-bottom: 1px solid #f0f0f0; padding: 1rem 0;">
                              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                  <strong>${review.user_name || 'Anonymous'}</strong>
                                  <span>${'⭐'.repeat(review.rating || 4)}</span>
                              </div>
                              <p>${review.review_text || review.text}</p>
                          </div>
                      `).join('') : '<p>No reviews yet. Be the first to review!</p>'}
                  </div>
              </div>
              
              <div class="booking-summary">
                  <h3>Booking Summary</h3>
                  <div class="summary-row">
                      <span>Price per night:</span>
                      <span>₹${acc.price_per_night.toLocaleString()}</span>
                  </div>
                  <div class="summary-row">
                      <span>Advance payment:</span>
                      <span>₹${advance}</span>
                  </div>
                  <div class="summary-row">
                      <span>Pay on arrival:</span>
                      <span>₹${(acc.price_per_night - advance).toLocaleString()}</span>
                  </div>
                  
                  <div class="payment-info">
                      <strong>💳 Pay-on-Arrival Policy</strong><br>
                      Pay only ₹${advance} to secure your booking. Rest amount due at check-in.
                  </div>
              </div>
              
              <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                  <button class="btn btn-primary" onclick="startBooking(${acc.id})" style="flex: 1;">
                      Book Now - Pay ₹${advance}
                  </button>
                  <button class="btn btn-secondary" onclick="addToWishlist(${acc.id})">
                      Save for Later
                  </button>
              </div>
          </div>
      `;
      
      modal.style.display = 'block';
      console.log('✅ Modal opened successfully');
      
  } catch (error) {
      console.error('❌ Error loading accommodation details:', error);
      showErrorMessage('Could not load accommodation details. Please try again.');
  }
}

// Sample reviews function
function getSampleReviews(accommodationId) {
  const sampleReviews = {
      1: [
          { user_name: "Sweta R.", rating: 5, review_text: "Felt completely safe here. Great community of travelers!" },
          { user_name: "Priya M.", rating: 5, review_text: "Clean, affordable, and the staff is super helpful." }
      ],
      2: [
          { user_name: "Arjun S.", rating: 4, review_text: "Great value for money. Kitchen facilities are excellent!" },
          { user_name: "Meera K.", rating: 4, review_text: "Safe and clean. Met some amazing people here." }
      ],
      3: [
          { user_name: "Rohit P.", rating: 5, review_text: "Perfect for workations. Fast WiFi and quiet workspace." },
          { user_name: "Anita D.", rating: 5, review_text: "Excellent service and very safe for solo female travelers." }
      ]
  };
  
  return sampleReviews[accommodationId] || [
      { user_name: "TravelEase User", rating: 4, review_text: "Good accommodation, would recommend!" }
  ];
}

// Booking functions
function startBooking(accommodationId) {
  if (!currentUser) {
      showLogin();
      showSuccessMessage('Please login to book accommodations');
      return;
  }
  
  const acc = accommodations.find(a => a.id == accommodationId);
  if (!acc) {
      showErrorMessage('Accommodation not found');
      return;
  }
  
  closeModal('accommodationModal');
  
  // For now, show a success message (Sprint 2 will have full booking)
  showSuccessMessage(`🎉 Booking feature coming soon! You selected "${acc.name}" for ₹${acc.price_per_night}/night`);
}

function addToWishlist(accommodationId) {
  if (!currentUser) {
      showLogin();
      showSuccessMessage('Please login to save accommodations');
      return;
  }
  
  const acc = accommodations.find(a => a.id == accommodationId);
  showSuccessMessage(`💖 "${acc ? acc.name : 'Accommodation'}" added to your wishlist!`);
}

// Make sure accommodation modal exists in HTML
function ensureAccommodationModal() {
  let modal = document.getElementById('accommodationModal');
  
  if (!modal) {
      console.log('🔧 Creating accommodation modal...');
      
      modal = document.createElement('div');
      modal.id = 'accommodationModal';
      modal.className = 'modal';
      modal.innerHTML = `
          <div class="modal-content" style="max-width: 700px;">
              <div class="modal-header">
                  <h2 id="accommodationTitle">Accommodation Details</h2>
                  <button class="close" onclick="closeModal('accommodationModal')">&times;</button>
              </div>
              <div id="accommodationDetails">
                  <!-- Details will be populated by JavaScript -->
              </div>
          </div>
      `;
      
      document.body.appendChild(modal);
      console.log('✅ Accommodation modal created');
  }
  
  return modal;
}

// Initialize modal on page load
document.addEventListener('DOMContentLoaded', function() {
  ensureAccommodationModal();
});

// CSS for the modal if it doesn't exist
function addModalStyles() {
  const style = document.createElement('style');
  style.textContent = `
      .detail-section {
          margin-bottom: 2rem;
      }
      
      .detail-section h3 {
          color: #667eea;
          margin-bottom: 1rem;
          font-size: 1.2rem;
      }
      
      .amenities-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
      }
      
      .safety-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
      }
      
      .booking-summary {
          background: #f8f9ff;
          padding: 1.5rem;
          border-radius: 10px;
          margin: 2rem 0;
      }
      
      .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
      }
      
      .payment-info {
          background: #e8f5e8;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
          border-left: 4px solid #32cd32;
      }
      
      .review-item {
          margin-bottom: 1rem;
      }
  `;
  document.head.appendChild(style);
}

// Add styles on page load
document.addEventListener('DOMContentLoaded', function() {
  addModalStyles();
});
