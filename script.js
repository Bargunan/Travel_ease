// =============================================================================
// TRAVELEASE FRONTEND - CLEAN VERSION
// Solo Travel Booking Platform
// =============================================================================

// =============================================================================
// CONFIGURATION
// =============================================================================

// API Configuration - Updated for Render deployment
const API_BASE_URL = 'https://travel-ease-backend-l1wr.onrender.com/api';

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
    },
    {
        id: 3,
        name: "Urban Nomad Hub",
        city: "Mumbai",
        accommodation_type: "hotel",
        price_per_night: 3200,
        description: "Premium accommodation perfect for digital nomads and business travelers seeking comfort and connectivity.",
        amenities: ["High-Speed WiFi", "Workspace", "Gym", "Restaurant"],
        safety_rating: 5,
        verified: true,
        is_active: true
    }
];

// =============================================================================
// API CLASS
// =============================================================================

class TravelEaseAPI {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('authToken');
        
        console.log(`🌐 API Request: ${url}`);
        
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
            
            // Handle Render cold start (503 Service Unavailable)
            if (response.status === 503) {
                console.log('⏳ Backend starting up (Render cold start)...');
                showToast('Backend is starting up, please wait...', 'warning');
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.request(endpoint, options);
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            console.log(`✅ API Success: ${endpoint}`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ API Error: ${endpoint}`, error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            }
            
            throw error;
        }
    }

    // Health check
    static async healthCheck() {
        return this.request('/health');
    }

    // Authentication
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

    // Accommodations
    static async searchAccommodations(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/accommodations/search?${queryString}` : '/accommodations/search';
        return this.request(endpoint);
    }

    static async getAccommodation(id) {
        return this.request(`/accommodations/${id}`);
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Toast notifications
function showToast(message, type = 'info') {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const colors = {
        success: 'linear-gradient(135deg, #32cd32, #228b22)',
        error: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
        warning: 'linear-gradient(135deg, #ffa500, #ff8c00)',
        info: 'linear-gradient(135deg, #667eea, #764ba2)'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type] || colors.info};
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
        <span>${icons[type] || icons.info}</span>
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
    
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function showSuccessMessage(message) {
    showToast(message, 'success');
}

function showErrorMessage(message) {
    showToast(message, 'error');
}

// Loading states
function showLoadingButton(button, text) {
    if (button) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = text;
        button.style.opacity = '0.7';
    }
}

function hideLoadingButton(button, originalText) {
    if (button) {
        button.disabled = false;
        button.textContent = originalText || button.dataset.originalText || 'Submit';
        button.style.opacity = '';
        delete button.dataset.originalText;
    }
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'block';
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'none';
}

// Validation helpers
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

function validateAge(age) {
    const ageNum = parseInt(age);
    return ageNum >= 18 && ageNum <= 100;
}

// Calculation helpers
function calculateAdvancePayment(pricePerNight) {
    if (!pricePerNight) return 500;
    const advance = Math.round(pricePerNight * 0.2);
    return Math.min(Math.max(advance, 300), 500);
}

function getAccommodationIcon(type) {
    const icons = {
        hostel: '🏠',
        hotel: '🏨',
        guesthouse: '🏡',
        homestay: '🏘️'
    };
    return icons[type] || '🏠';
}

// =============================================================================
// MODAL FUNCTIONS
// =============================================================================

function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
}

function showSignup() {
    document.getElementById('signupModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

async function login(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
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
        
        const response = await TravelEaseAPI.login(email, password);
        
        localStorage.setItem('authToken', response.token);
        currentUser = response.user;
        
        updateAuthUI();
        closeModal('loginModal');
        showSuccessMessage(`Welcome back, ${currentUser.full_name}! 👋`);
        
        event.target.reset();
        
    } catch (error) {
        console.error('❌ Login failed:', error);
        
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

async function signup(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    
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
        
        const response = await TravelEaseAPI.signup(formData);
        
        localStorage.setItem('authToken', response.token);
        currentUser = response.user;
        
        updateAuthUI();
        closeModal('signupModal');
        showSuccessMessage(`Welcome to TravelEase, ${currentUser.full_name}! 🎉`);
        
        event.target.reset();
        
    } catch (error) {
        console.error('❌ Signup failed:', error);
        
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

function updateAuthUI() {
    const userMenu = document.querySelector('.user-menu');
    if (currentUser) {
        const firstName = currentUser.full_name?.split(' ')[0] || 'User';
        userMenu.innerHTML = `
            <span style="color: white; margin-right: 1rem;">Hi, ${firstName}!</span>
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

// =============================================================================
// SEARCH FUNCTIONS
// =============================================================================

async function searchAccommodations(event) {
    event.preventDefault();
    
    const destination = document.getElementById('destination').value;
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    
    console.log('🔍 Starting search for:', destination);
    
    showLoading('loadingAccommodations');
    
    try {
        const searchParams = {};
        
        if (destination && destination.trim() !== '') {
            searchParams.city = destination.trim();
        }
        
        if (checkin && checkin !== '') {
            searchParams.checkin = checkin;
        }
        
        if (checkout && checkout !== '') {
            searchParams.checkout = checkout;
        }
        
        console.log('📡 Search parameters:', searchParams);
        
        const response = await TravelEaseAPI.searchAccommodations(searchParams);
        
        if (response && response.accommodations) {
            accommodations = response.accommodations;
        } else if (response && Array.isArray(response)) {
            accommodations = response;
        } else {
            accommodations = [];
        }
        
        hideLoading('loadingAccommodations');
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
        
        showErrorMessage('Using sample data. Search temporarily unavailable.');
    }
}

// =============================================================================
// DISPLAY FUNCTIONS
// =============================================================================

function displayAccommodations(accs) {
    console.log('🎨 Displaying accommodations:', accs?.length || 0);
    
    const grid = document.getElementById('accommodationGrid');
    
    if (!grid) {
        console.error('❌ accommodationGrid element not found!');
        return;
    }
    
    if (!accs || accs.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h3 style="margin-bottom: 1rem; color: #2d3748;">No accommodations found</h3>
                <p style="color: #718096;">Try adjusting your search criteria or check back later.</p>
                <button class="btn btn-primary" onclick="loadSampleData()" style="margin-top: 1rem;">
                    View Sample Accommodations
                </button>
            </div>
        `;
        return;
    }
    
    const cardsHTML = accs.map((acc, index) => {
        const advance = calculateAdvancePayment(acc.price_per_night || 2000);
        
        // Handle amenities safely
        let amenities = [];
        if (Array.isArray(acc.amenities) && acc.amenities.length > 0) {
            amenities = acc.amenities;
        } else {
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
        
        return `
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
    });
    
    grid.innerHTML = cardsHTML.join('');
    
    // Force repaint
    grid.style.display = 'none';
    grid.offsetHeight;
    grid.style.display = 'grid';
    
    console.log('✅ Display complete');
}

function loadSampleData() {
    console.log('📦 Loading sample data...');
    accommodations = sampleAccommodations;
    displayAccommodations(accommodations);
    showSuccessMessage('Sample accommodations loaded!');
}

// =============================================================================
// ACCOMMODATION DETAILS
// =============================================================================

async function viewAccommodation(id) {
    console.log('🏨 Opening details for accommodation ID:', id);
    
    try {
        showToast('Loading accommodation details...', 'info');
        
        let acc;
        
        try {
            const response = await TravelEaseAPI.getAccommodation(id);
            acc = response.accommodation;
        } catch (error) {
            console.warn('⚠️ Backend failed, using cached data:', error);
            acc = accommodations.find(a => a.id == id) || sampleAccommodations.find(a => a.id == id);
        }
        
        if (!acc) {
            showErrorMessage('Accommodation not found');
            return;
        }
        
        const reviews = getSampleReviews(id);
        const modal = document.getElementById('accommodationModal');
        const title = document.getElementById('accommodationTitle');
        const details = document.getElementById('accommodationDetails');
        
        title.textContent = acc.name;
        const advance = calculateAdvancePayment(acc.price_per_night);
        
        let amenities = [];
        if (Array.isArray(acc.amenities) && acc.amenities.length > 0) {
            amenities = acc.amenities;
        } else {
            amenities = ['WiFi', '24/7 Security', 'Clean Rooms', 'Common Area'];
        }
        
        details.innerHTML = `
            <div class="accommodation-details" style="padding: 2rem;">
                <div class="detail-section" style="margin-bottom: 2rem;">
                    <h3 style="color: #667eea; margin-bottom: 1rem;">About This Place</h3>
                    <p>${acc.description || 'A comfortable and safe accommodation perfect for solo travelers.'}</p>
                </div>
                
                <div class="detail-section" style="margin-bottom: 2rem;">
                    <h3 style="color: #667eea; margin-bottom: 1rem;">Location</h3>
                    <p>📍 ${acc.address || acc.city + ', India'}</p>
                </div>
                
                <div class="detail-section" style="margin-bottom: 2rem;">
                    <h3 style="color: #667eea; margin-bottom: 1rem;">Amenities</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${amenities.map(amenity => `<span class="feature-badge">${amenity}</span>`).join('')}
                    </div>
                </div>
                
                <div class="detail-section" style="margin-bottom: 2rem;">
                    <h3 style="color: #667eea; margin-bottom: 1rem;">Safety & Verification</h3>
                    <div>
                        <div class="safety-badge" style="display: inline-block; margin-bottom: 0.5rem;">👩‍💼 Female Safety Rating: ${'⭐'.repeat(acc.safety_rating || 4)}</div>
                        ${acc.verified ? '<div class="verified-badge" style="display: inline-block;">✅ Cleanliness Verified by TravelEase</div>' : ''}
                    </div>
                </div>
                
                <div class="detail-section" style="margin-bottom: 2rem;">
                    <h3 style="color: #667eea; margin-bottom: 1rem;">Recent Reviews</h3>
                    <div>
                        ${reviews.length > 0 ? reviews.map(review => `
                            <div style="border-bottom: 1px solid #f0f0f0; padding: 1rem 0;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <strong>${review.user_name || 'Anonymous'}</strong>
                                    <span>${'⭐'.repeat(review.rating || 4)}</span>
                                </div>
                                <p>${review.review_text || review.text}</p>
                            </div>
                        `).join('') : '<p>No reviews yet. Be the first to review!</p>'}
                    </div>
                </div>
                
                <div style="background: #f8f9ff; padding: 1.5rem; border-radius: 10px; margin: 2rem 0;">
                    <h3 style="color: #667eea; margin-bottom: 1rem;">Booking Summary</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Price per night:</span>
                        <span>₹${acc.price_per_night.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Advance payment:</span>
                        <span>₹${advance}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Pay on arrival:</span>
                        <span>₹${(acc.price_per_night - advance).toLocaleString()}</span>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 1rem; border-radius: 8px; margin-top: 1rem; border-left: 4px solid #32cd32;">
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
        
    } catch (error) {
        console.error('❌ Error loading accommodation details:', error);
        showErrorMessage('Could not load accommodation details. Please try again.');
    }
}

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

function startBooking(accommodationId) {
    if (!currentUser) {
        showLogin();
        showToast('Please login to book accommodations', 'warning');
        return;
    }
    
    const acc = accommodations.find(a => a.id == accommodationId) || sampleAccommodations.find(a => a.id == accommodationId);
    if (!acc) {
        showErrorMessage('Accommodation not found');
        return;
    }
    
    closeModal('accommodationModal');
    showSuccessMessage(`🎉 Booking feature coming in Sprint 2! You selected "${acc.name}" for ₹${acc.price_per_night}/night`);
}

function addToWishlist(accommodationId) {
    if (!currentUser) {
        showLogin();
        showToast('Please login to save accommodations', 'warning');
        return;
    }
    
    const acc = accommodations.find(a => a.id == accommodationId) || sampleAccommodations.find(a => a.id == accommodationId);
    showSuccessMessage(`💖 "${acc ? acc.name : 'Accommodation'}" added to your wishlist!`);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

async function checkBackendConnection() {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    try {
        console.log('🔍 Testing backend connection...');
        showToast('Connecting to backend...', 'info');
        
        const healthResponse = await TravelEaseAPI.healthCheck();
        console.log('✅ Backend connection successful:', healthResponse);
        
        if (statusText && statusIndicator) {
            statusText.textContent = 'Connected to live backend server ✅';
            statusIndicator.className = 'status-indicator connected';
        }
        
        showSuccessMessage('🎉 Connected to TravelEase backend!');
        return true;
        
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        
        if (statusText && statusIndicator) {
            statusText.textContent = 'Demo mode (backend offline)';
            statusIndicator.className = 'status-indicator offline';
        }
        
        if (error.message.includes('Network error')) {
            showToast('Backend is starting up (Render cold start). This may take 1-2 minutes...', 'warning');
        } else {
            showToast('Backend temporarily unavailable. Using demo data.', 'warning');
        }
        
        accommodations = sampleAccommodations;
        return false;
    }
}

async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        console.log('🔑 Found existing auth token');
        // In production, you'd validate the token with backend
        // For now, we'll skip validation if backend is offline
        updateAuthUI();
    }
}

function setDefaultDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    
    if (checkinInput) {
        checkinInput.value = today.toISOString().split('T')[0];
    }
    if (checkoutInput) {
        checkoutInput.value = tomorrow.toISOString().split('T')[0];
    }
}

async function loadInitialData() {
    try {
        if (accommodations.length === 0) {
            console.log('📦 Loading initial accommodation data...');
            const response = await TravelEaseAPI.searchAccommodations({});
            accommodations = response.accommodations || response || sampleAccommodations;
        }
    } catch (error) {
        console.warn('⚠️ Using sample accommodations data');
        accommodations = sampleAccommodations;
    }
    
    displayAccommodations(accommodations);
}

// =============================================================================
// MOBILE NAVIGATION
// =============================================================================

function initializeMobileNavigation() {
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');
    
    if (!nav || !navLinks) return;
    
    // Create mobile menu button if it doesn't exist
    let mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (!mobileMenuBtn) {
        mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '☰';
        mobileMenuBtn.setAttribute('aria-label', 'Toggle mobile menu');
        
        const userMenu = document.querySelector('.user-menu');
        nav.insertBefore(mobileMenuBtn, userMenu);
    }
    
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
    
    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('mobile-active');
            mobileMenuBtn.innerHTML = '☰';
        }
    });
}

// =============================================================================
// SMOOTH SCROLLING
// =============================================================================

function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#' || href.length <= 1) {
                return;
            }
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const headerHeight = document.querySelector('header').offsetHeight || 80;
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

// =============================================================================
// DEBUG FUNCTIONS
// =============================================================================

async function testBackendConnection() {
    console.log('🧪 Manual Backend Test Starting...');
    
    const tests = [
        {
            name: 'Health Check',
            test: () => TravelEaseAPI.healthCheck()
        },
        {
            name: 'Accommodation Search',
            test: () => TravelEaseAPI.searchAccommodations({})
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`Testing ${test.name}...`);
            const result = await test.test();
            console.log(`✅ ${test.name} SUCCESS:`, result);
        } catch (error) {
            console.error(`❌ ${test.name} FAILED:`, error);
        }
    }
    
    console.log('🧪 Manual Backend Test Complete');
}

function debugAccommodationData() {
    console.log('🐛 Current accommodations array:', accommodations);
    console.log('🐛 Grid element:', document.getElementById('accommodationGrid'));
    console.log('🐛 Grid innerHTML length:', document.getElementById('accommodationGrid')?.innerHTML.length);
}

// Add to global scope for manual testing
window.testBackend = testBackendConnection;
window.debugAccommodations = debugAccommodationData;
window.loadSampleData = loadSampleData;

// =============================================================================
// EVENT LISTENERS & INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 TravelEase Frontend Starting...');
    
    // Initialize mobile enhancements
    initializeMobileNavigation();
    initializeSmoothScrolling();
    
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

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Global error handlers
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (event.reason.message && event.reason.message.includes('fetch')) {
        showErrorMessage('Connection error. Please check your internet connection.');
    } else {
        showErrorMessage('Something went wrong. Please try again.');
    }
    
    event.preventDefault();
});

window.addEventListener('error', function(event) {
    console.error('Unhandled error:', event.error);
    showErrorMessage('An unexpected error occurred. Please refresh the page.');
});

// =============================================================================
// KEYBOARD NAVIGATION
// =============================================================================

document.addEventListener('keydown', function(event) {
    // Close modals with Escape key
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="display: block"]');
        openModals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    // Quick search with Ctrl/Cmd + K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const destinationInput = document.getElementById('destination');
        if (destinationInput) {
            destinationInput.focus();
            destinationInput.select();
        }
    }
});

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

// Track page load performance
window.addEventListener('load', function() {
    if ('performance' in window) {
        const loadTime = performance.now();
        console.log(`📊 Page loaded in ${Math.round(loadTime)}ms`);
        
        if (loadTime > 3000) {
            console.warn('⚠️ Slow page load detected');
        }
    }
});

// =============================================================================
// CONSOLE WELCOME MESSAGE
// =============================================================================

console.log(`
🎉 Welcome to TravelEase!
📱 Solo Travel Platform for India

🔧 Debug Commands:
- testBackend() - Test backend connectivity
- debugAccommodations() - Debug accommodation display
- loadSampleData() - Load sample accommodations

🌐 Backend: ${API_BASE_URL}
📅 Version: 1.0 (Sprint 1 MVP)
👩‍💻 Built for solo travelers, especially women

Happy debugging! 🚀
`);
