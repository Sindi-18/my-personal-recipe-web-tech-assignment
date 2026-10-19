// ========================================================
// ICT251 Activity 4 - Question 2: Personal Recipe Card
// Frontend JavaScript (CRUD Operations via Fetch API)
// ========================================================

// Determine API base URL dynamically
const API_BASE_URL = window.location.origin.includes('http') && !window.location.origin.includes('5500')
    ? `${window.location.origin}/api`
    : 'http://localhost:3000/api';

const RESOURCE_URL = `${API_BASE_URL}/recipes`;

// State
let allRecipes = [];
let isEditing = false;
let currentEditId = null;

// DOM Elements
const recipeForm = document.getElementById('recipeForm');
const formTitle = document.getElementById('formTitle');
const submitBtnText = document.getElementById('submitBtnText');
const cancelBtn = document.getElementById('cancelBtn');
const editModeIndicator = document.getElementById('editModeIndicator');
const editingIdSpan = document.getElementById('editingId');
const recipeIdInput = document.getElementById('recipeId');

const titleInput = document.getElementById('title');
const cuisineInput = document.getElementById('cuisine');
const categorySelect = document.getElementById('category');
const prepTimeInput = document.getElementById('prepTime');
const cookTimeInput = document.getElementById('cookTime');
const servingsInput = document.getElementById('servings');
const difficultySelect = document.getElementById('difficulty');
const ingredientsInput = document.getElementById('ingredients');
const instructionsInput = document.getElementById('instructions');

const recipesTableBody = document.getElementById('recipesTableBody');
const recordCountBadge = document.getElementById('recordCountBadge');
const searchInput = document.getElementById('searchInput');
const cuisineFilter = document.getElementById('cuisineFilter');
const refreshBtn = document.getElementById('refreshBtn');
const apiStatusBadge = document.getElementById('apiStatusBadge');
const toastContainer = document.getElementById('toastContainer');

// Modal Elements
const recipeModal = document.getElementById('recipeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const modalCuisineBadge = document.getElementById('modalCuisineBadge');
const modalCategory = document.getElementById('modalCategory');
const modalPrepTime = document.getElementById('modalPrepTime');
const modalCookTime = document.getElementById('modalCookTime');
const modalServings = document.getElementById('modalServings');
const modalDifficulty = document.getElementById('modalDifficulty');
const modalIngredients = document.getElementById('modalIngredients');
const modalInstructions = document.getElementById('modalInstructions');
const modalCreatedAt = document.getElementById('modalCreatedAt');
const modalUpdatedAt = document.getElementById('modalUpdatedAt');

// ========================================================
// Initialization
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    checkApiHealth();
    fetchRecipes();
    setupEventListeners();
});

function setupEventListeners() {
    // Form submission (Create or Update)
    recipeForm.addEventListener('submit', handleFormSubmit);

    // Cancel edit button
    cancelBtn.addEventListener('click', resetFormToCreateMode);

    // Search and filter
    searchInput.addEventListener('input', applyFilters);
    cuisineFilter.addEventListener('change', applyFilters);
    refreshBtn.addEventListener('click', fetchRecipes);

    // Modal controls
    closeModalBtn.addEventListener('click', closeModal);
    recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !recipeModal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

// ========================================================
// API Health Check
// ========================================================

async function checkApiHealth() {
    try {
        const res = await fetch(`${API_BASE_URL}/health`);
        if (!res.ok) throw new Error('API offline');
        const data = await res.json();
        apiStatusBadge.className = 'status-badge status-connected';
        apiStatusBadge.innerHTML = `<span class="status-dot"></span> API Online (${data.driver.toUpperCase()})`;
    } catch (err) {
        apiStatusBadge.className = 'status-badge status-disconnected';
        apiStatusBadge.innerHTML = `<span class="status-dot"></span> API Disconnected`;
    }
}

// ========================================================
// 1. GET ALL: Fetch Recipes from API
// ========================================================

async function fetchRecipes() {
    showTableLoading();
    try {
        const response = await fetch(RESOURCE_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        allRecipes = result.data || [];
        populateCuisineFilter(allRecipes);
        renderTable(allRecipes);
        checkApiHealth();
    } catch (error) {
        console.error('Error fetching recipes:', error);
        recipesTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center empty-cell" style="color: var(--danger);">
                    ⚠️ Failed to load recipes from backend API (${error.message}).<br>
                    Ensure your Node.js server is running at <code>http://localhost:3000</code>.
                </td>
            </tr>
        `;
        showToast('Failed to connect to backend server', 'error');
    }
}

// ========================================================
// Render Table Rows
// ========================================================

function renderTable(recipes) {
    recordCountBadge.textContent = `${recipes.length} recipe${recipes.length === 1 ? '' : 's'}`;

    if (recipes.length === 0) {
        recipesTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center empty-cell">
                    🍽️ No recipes found. Use the form on the left to add one!
                </td>
            </tr>
        `;
        return;
    }

    recipesTableBody.innerHTML = recipes.map(recipe => {
        const diffClass = (recipe.difficulty || 'medium').toLowerCase();
        const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

        return `
            <tr data-id="${recipe.id}">
                <td><strong>#${recipe.id}</strong></td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(recipe.title)}</div>
                    <small style="color: var(--text-secondary);">${escapeHtml(recipe.category || 'General')}</small>
                </td>
                <td><span class="badge badge-info">${escapeHtml(recipe.cuisine)}</span></td>
                <td>${escapeHtml(recipe.category || '-')}</td>
                <td>
                    <span title="Prep: ${recipe.prep_time_minutes}m | Cook: ${recipe.cook_time_minutes}m">
                        ⏱️ ${totalTime}m
                    </span>
                </td>
                <td>👥 ${recipe.servings}</td>
                <td><span class="badge badge-${diffClass}">${escapeHtml(recipe.difficulty)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-view" onclick="viewRecipeDetails(${recipe.id})" title="View Details">
                            👁️
                        </button>
                        <button class="btn-sm btn-edit" onclick="startEditRecipe(${recipe.id})" title="Edit Recipe">
                            ✏️
                        </button>
                        <button class="btn-sm btn-delete" onclick="deleteRecipe(${recipe.id}, '${escapeHtml(recipe.title.replace(/'/g, "\\'"))}')" title="Delete Recipe">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function showTableLoading() {
    recipesTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center loading-cell">
                <span class="status-dot"></span> Fetching latest recipes...
            </td>
        </tr>
    `;
}

// ========================================================
// 2. GET ONE: View Recipe Details (Modal)
// ========================================================

async function viewRecipeDetails(id) {
    try {
        const res = await fetch(`${RESOURCE_URL}/${id}`);
        if (!res.ok) throw new Error('Recipe not found');
        const json = await res.json();
        const recipe = json.data;

        modalTitle.textContent = recipe.title;
        modalCuisineBadge.textContent = recipe.cuisine;
        modalCategory.textContent = recipe.category || '-';
        modalPrepTime.textContent = `${recipe.prep_time_minutes} mins`;
        modalCookTime.textContent = `${recipe.cook_time_minutes} mins`;
        modalServings.textContent = `${recipe.servings} people`;
        modalDifficulty.textContent = recipe.difficulty;
        modalIngredients.textContent = recipe.ingredients;
        modalInstructions.textContent = recipe.instructions;
        modalCreatedAt.textContent = recipe.created_at || 'N/A';
        modalUpdatedAt.textContent = recipe.updated_at || 'N/A';

        recipeModal.classList.remove('hidden');
    } catch (err) {
        showToast(`Could not load recipe #${id}: ${err.message}`, 'error');
    }
}

function closeModal() {
    recipeModal.classList.add('hidden');
}

// ========================================================
// 3. POST / PUT: Create or Update Recipe
// ========================================================

async function handleFormSubmit(e) {
    e.preventDefault();

    // Client-side validation
    const title = titleInput.value.trim();
    const cuisine = cuisineInput.value.trim();
    const category = categorySelect.value;
    const prep_time_minutes = parseInt(prepTimeInput.value, 10);
    const cook_time_minutes = parseInt(cookTimeInput.value, 10);
    const servings = parseInt(servingsInput.value, 10);
    const difficulty = difficultySelect.value;
    const ingredients = ingredientsInput.value.trim();
    const instructions = instructionsInput.value.trim();

    if (!title || !cuisine || !ingredients || !instructions) {
        showToast('Please fill out all required fields marked with *', 'error');
        return;
    }

    const payload = {
        title,
        cuisine,
        category,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        difficulty,
        ingredients,
        instructions
    };

    try {
        if (isEditing) {
            // PUT /api/recipes/:id
            const res = await fetch(`${RESOURCE_URL}/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update recipe');

            showToast(`Recipe #${currentEditId} updated successfully!`, 'success');
            resetFormToCreateMode();
            fetchRecipes();
        } else {
            // POST /api/recipes
            const res = await fetch(RESOURCE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create recipe');

            showToast(`Recipe "${data.data.title}" created successfully!`, 'success');
            recipeForm.reset();
            // Restore defaults
            prepTimeInput.value = 15;
            cookTimeInput.value = 30;
            servingsInput.value = 4;
            fetchRecipes();
        }
    } catch (err) {
        console.error('Save error:', err);
        showToast(err.message, 'error');
    }
}

// ========================================================
// Edit Mode Logic
// ========================================================

async function startEditRecipe(id) {
    try {
        const res = await fetch(`${RESOURCE_URL}/${id}`);
        if (!res.ok) throw new Error('Could not load recipe for editing');
        const json = await res.json();
        const recipe = json.data;

        isEditing = true;
        currentEditId = id;

        // Populate form
        recipeIdInput.value = recipe.id;
        titleInput.value = recipe.title;
        cuisineInput.value = recipe.cuisine;
        categorySelect.value = recipe.category;
        prepTimeInput.value = recipe.prep_time_minutes;
        cookTimeInput.value = recipe.cook_time_minutes;
        servingsInput.value = recipe.servings;
        difficultySelect.value = recipe.difficulty;
        ingredientsInput.value = recipe.ingredients;
        instructionsInput.value = recipe.instructions;

        // Update UI elements for edit mode
        formTitle.textContent = 'Edit Recipe';
        submitBtnText.textContent = 'Update Recipe';
        editingIdSpan.textContent = id;
        editModeIndicator.classList.remove('hidden');
        cancelBtn.classList.remove('hidden');

        // Scroll to form smoothly
        recipeForm.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function resetFormToCreateMode() {
    isEditing = false;
    currentEditId = null;
    recipeForm.reset();

    prepTimeInput.value = 15;
    cookTimeInput.value = 30;
    servingsInput.value = 4;
    difficultySelect.value = 'Medium';

    formTitle.textContent = 'Add New Recipe';
    submitBtnText.textContent = 'Save Recipe';
    editModeIndicator.classList.add('hidden');
    cancelBtn.classList.add('hidden');
}

// ========================================================
// 4. DELETE: Delete Recipe
// ========================================================

async function deleteRecipe(id, title) {
    const confirmed = confirm(`Are you sure you want to delete recipe #${id} ("${title}")? This action cannot be undone.`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${RESOURCE_URL}/${id}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete recipe');

        showToast(`Recipe #${id} deleted successfully.`, 'info');

        // If currently editing the deleted item, cancel edit
        if (isEditing && currentEditId === id) {
            resetFormToCreateMode();
        }

        fetchRecipes();
    } catch (err) {
        console.error('Delete error:', err);
        showToast(err.message, 'error');
    }
}

// ========================================================
// Filtering & Search
// ========================================================

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCuisine = cuisineFilter.value;

    const filtered = allRecipes.filter(recipe => {
        const matchesSearch = !searchTerm ||
            (recipe.title && recipe.title.toLowerCase().includes(searchTerm)) ||
            (recipe.ingredients && recipe.ingredients.toLowerCase().includes(searchTerm)) ||
            (recipe.category && recipe.category.toLowerCase().includes(searchTerm));

        const matchesCuisine = !selectedCuisine || recipe.cuisine === selectedCuisine;

        return matchesSearch && matchesCuisine;
    });

    renderTable(filtered);
}

function populateCuisineFilter(recipes) {
    const cuisines = [...new Set(recipes.map(r => r.cuisine).filter(Boolean))].sort();
    const currentValue = cuisineFilter.value;

    cuisineFilter.innerHTML = '<option value="">All Cuisines</option>' +
        cuisines.map(c => `<option value="${escapeHtml(c)}" ${c === currentValue ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
}

// ========================================================
// UI Utilities: Toast Notifications & HTML Escaping
// ========================================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Make functions accessible from HTML inline handlers
window.viewRecipeDetails = viewRecipeDetails;
window.startEditRecipe = startEditRecipe;
window.deleteRecipe = deleteRecipe;
