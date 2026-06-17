// ==========================================
// APP STATE & CONSTANTS
// ==========================================
const STATE = {
    allNotes: [],
    filteredNotes: [],
    categories: {},
    activeCategory: 'All',
    searchQuery: '',
    sortOrder: 'newest',
    currentPage: 1,
    pageSize: 8 // Items per page
};

// Map categories to CSS custom property namespaces for dynamic coloring
const CATEGORY_STYLE_MAP = {
    'all': { color: 'var(--gcp-blue)', bg: 'var(--gcp-blue-glow)' },
    'feature': { color: 'var(--color-feature)', bg: 'var(--color-feature-bg)' },
    'issue': { color: 'var(--color-issue)', bg: 'var(--color-issue-bg)' },
    'change': { color: 'var(--color-change)', bg: 'var(--color-change-bg)' },
    'deprecated': { color: 'var(--color-deprecation)', bg: 'var(--color-deprecation-bg)' },
    'deprecation': { color: 'var(--color-deprecation)', bg: 'var(--color-deprecation-bg)' },
    'beta': { color: 'var(--color-general)', bg: 'var(--color-general-bg)' },
    'general': { color: 'var(--color-general)', bg: 'var(--color-general-bg)' }
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Cache DOM Elements
    STATE.dom = {
        notesList: document.getElementById('notes-list'),
        loadingState: document.getElementById('loading-state'),
        categoryFilters: document.getElementById('category-filters'),
        searchInput: document.getElementById('search-input'),
        clearSearchBtn: document.getElementById('clear-search-btn'),
        sortSelect: document.getElementById('sort-select'),
        refreshBtn: document.getElementById('refresh-btn'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        totalCount: document.getElementById('total-count'),
        lastUpdatedDate: document.getElementById('last-updated-date'),
        activeFiltersBar: document.getElementById('active-filters-bar'),
        resetFiltersBtn: document.getElementById('reset-all-filters-btn'),
        paginationContainer: document.getElementById('pagination-container'),
        prevPageBtn: document.getElementById('prev-page-btn'),
        nextPageBtn: document.getElementById('next-page-btn'),
        pageInfo: document.getElementById('page-info')
    };

    // Attach Event Listeners
    STATE.dom.searchInput.addEventListener('input', handleSearchInput);
    STATE.dom.clearSearchBtn.addEventListener('click', handleClearSearch);
    STATE.dom.sortSelect.addEventListener('change', handleSortChange);
    STATE.dom.refreshBtn.addEventListener('click', handleRefresh);
    STATE.dom.exportCsvBtn.addEventListener('click', handleExportCSV);
    STATE.dom.resetFiltersBtn.addEventListener('click', handleResetFilters);
    STATE.dom.prevPageBtn.addEventListener('click', () => changePage(-1));
    STATE.dom.nextPageBtn.addEventListener('click', () => changePage(1));

    // Fetch Initial Data
    fetchReleaseNotes();
}

// ==========================================
// API SERVICE CALLS
// ==========================================
async function fetchReleaseNotes(forceRefresh = false) {
    try {
        showLoading(true);
        let url = '/api/release-notes';
        if (forceRefresh) {
            url += '?refresh=true';
            STATE.dom.refreshBtn.classList.add('spinning');
            STATE.dom.refreshBtn.disabled = true;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch release notes.');
        const data = await response.json();

        if (data.status === 'success') {
            STATE.allNotes = data.notes;
            STATE.categories = data.categories;
            
            updateStats();
            renderCategoryFilters();
            applyFiltersAndRender();
        } else {
            showError('API responded with an unsuccessful status.');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        showError('Could not load BigQuery release notes. Please check the backend connection.');
    } finally {
        showLoading(false);
        if (forceRefresh) {
            STATE.dom.refreshBtn.classList.remove('spinning');
            STATE.dom.refreshBtn.disabled = false;
        }
        // Initialize Lucide icons on newly rendered items
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// ==========================================
// RENDER METHODS
// ==========================================
function showLoading(isLoading) {
    if (isLoading) {
        STATE.dom.notesList.innerHTML = '';
        STATE.dom.loadingState.style.display = 'flex';
        STATE.dom.paginationContainer.style.display = 'none';
        STATE.dom.activeFiltersBar.style.display = 'none';
    } else {
        STATE.dom.loadingState.style.display = 'none';
    }
}

function showError(message) {
    STATE.dom.notesList.innerHTML = `
        <div class="empty-state">
            <i data-lucide="alert-circle"></i>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button class="btn btn-secondary" onclick="fetchReleaseNotes()"><i data-lucide="rotate-ccw"></i> Retry Connection</button>
        </div>
    `;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function updateStats() {
    STATE.dom.totalCount.textContent = STATE.allNotes.length;
    
    if (STATE.allNotes.length > 0) {
        // Find latest date (since it's pre-sorted, first item's date is newest)
        STATE.dom.lastUpdatedDate.textContent = STATE.allNotes[0].date;
    } else {
        STATE.dom.lastUpdatedDate.textContent = 'N/A';
    }
}

function renderCategoryFilters() {
    const list = STATE.dom.categoryFilters;
    list.innerHTML = '';

    // Create 'All' pill
    const allCount = STATE.allNotes.length;
    const allPill = createPill('All', allCount, STATE.activeCategory === 'All');
    list.appendChild(allPill);

    // Sorted categories
    const sortedCategories = Object.keys(STATE.categories).sort();
    sortedCategories.forEach(cat => {
        const count = STATE.categories[cat];
        const pill = createPill(cat, count, STATE.activeCategory === cat);
        list.appendChild(pill);
    });
}

function createPill(name, count, isActive) {
    const pill = document.createElement('div');
    pill.className = `category-pill ${isActive ? 'active' : ''}`;
    
    // Set custom styling properties for the active states based on category type
    const normalName = name.toLowerCase();
    const styles = CATEGORY_STYLE_MAP[normalName] || CATEGORY_STYLE_MAP['general'];
    
    if (isActive) {
        pill.style.setProperty('--active-color', styles.color);
        pill.style.setProperty('--active-bg', styles.bg);
    }
    
    pill.innerHTML = `
        <span>${name}</span>
        <span class="category-badge">${count}</span>
    `;

    pill.addEventListener('click', () => handleCategoryChange(name));
    return pill;
}

function renderNotes() {
    const notesContainer = STATE.dom.notesList;
    notesContainer.innerHTML = '';

    const start = (STATE.currentPage - 1) * STATE.pageSize;
    const end = start + STATE.pageSize;
    const pageItems = STATE.filteredNotes.slice(start, end);

    if (pageItems.length === 0) {
        notesContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="search-code"></i>
                <h3>No release notes match your criteria</h3>
                <p>Try checking your spelling, using different keywords, or resetting category filters.</p>
            </div>
        `;
        STATE.dom.paginationContainer.style.display = 'none';
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }

    pageItems.forEach((note, index) => {
        const card = document.createElement('article');
        card.className = 'glass-card note-card animate-fade-in';
        card.style.animationDelay = `${index * 0.05}s`;
        
        // Resolve theme colors for category tags
        const categoryKey = note.category.toLowerCase();
        const styles = CATEGORY_STYLE_MAP[categoryKey] || CATEGORY_STYLE_MAP['general'];
        card.style.setProperty('--tag-color', styles.color);
        card.style.setProperty('--tag-bg-color', styles.bg);

        // Highlight matching text in the content body and title if search query is active
        const highlightedContent = highlightText(note.content, STATE.searchQuery);
        
        // Format a neat tweet summary (truncate to fit under 280 chars)
        const rawText = note.plaintext;
        const maxTweetLen = 170; // Leave room for date, hashtags, and branding
        const truncatedText = rawText.length > maxTweetLen ? rawText.substring(0, maxTweetLen) + '...' : rawText;
        const tweetMessage = `BigQuery Update (${note.date}): ${truncatedText} #GoogleCloud #BigQuery`;
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetMessage)}`;

        card.innerHTML = `
            <div class="note-header">
                <div class="note-title-area">
                    <h3 class="note-date">${note.date}</h3>
                    <span class="note-badge">${note.category}</span>
                </div>
                <div class="note-actions">
                    <button class="action-btn copy-btn" onclick="copyCardText('${note.id}')" title="Copy text to clipboard">
                        <i data-lucide="copy"></i> Copy
                    </button>
                    <a href="${twitterIntentUrl}" target="_blank" rel="noopener noreferrer" class="action-btn tweet-btn" title="Tweet about this update">
                        <i data-lucide="twitter"></i> Tweet
                    </a>
                </div>
            </div>
            <div class="note-body">${highlightedContent}</div>
        `;
        
        notesContainer.appendChild(card);
    });

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(STATE.filteredNotes.length / STATE.pageSize);
    
    if (totalPages <= 1) {
        STATE.dom.paginationContainer.style.display = 'none';
        return;
    }

    STATE.dom.paginationContainer.style.display = 'flex';
    STATE.dom.pageInfo.textContent = `Page ${STATE.currentPage} of ${totalPages}`;
    STATE.dom.prevPageBtn.disabled = STATE.currentPage === 1;
    STATE.dom.nextPageBtn.disabled = STATE.currentPage === totalPages;
}

// ==========================================
// FILTER, SORT & SEARCH LOGIC
// ==========================================
function applyFiltersAndRender() {
    // 1. Filter by category
    let result = STATE.allNotes;
    if (STATE.activeCategory !== 'All') {
        result = result.filter(note => note.category === STATE.activeCategory);
    }

    // 2. Filter by search query
    if (STATE.searchQuery.trim() !== '') {
        const query = STATE.searchQuery.toLowerCase().trim();
        result = result.filter(note => {
            return note.plaintext.toLowerCase().includes(query) || 
                   note.category.toLowerCase().includes(query) ||
                   note.date.toLowerCase().includes(query);
        });
        
        // Show active filters bar
        STATE.dom.activeFiltersBar.style.display = 'flex';
        STATE.dom.activeFiltersBar.querySelector('.filter-status-text').textContent = 
            `Found ${result.length} matches for "${STATE.searchQuery}" in ${STATE.activeCategory} category`;
    } else if (STATE.activeCategory !== 'All') {
        STATE.dom.activeFiltersBar.style.display = 'flex';
        STATE.dom.activeFiltersBar.querySelector('.filter-status-text').textContent = 
            `Showing only ${STATE.activeCategory} releases (${result.length} items)`;
    } else {
        STATE.dom.activeFiltersBar.style.display = 'none';
    }

    // 3. Sort notes
    if (STATE.sortOrder === 'newest') {
        // Notes from API are already newest-first, but handle it explicitly
        result.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    } else if (STATE.sortOrder === 'oldest') {
        result.sort((a, b) => new Date(a.updated) - new Date(b.updated));
    }

    STATE.filteredNotes = result;
    STATE.currentPage = 1; // Reset to page 1 on filter/search change
    renderNotes();
}

// ==========================================
// INTERACTIVE DOM HELPERS
// ==========================================

// Highlight matching search strings inside HTML text content safely (using temporary DOM parsing)
function highlightText(htmlString, keyword) {
    if (!keyword || keyword.trim() === '') return htmlString;
    
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${htmlString}</div>`, 'text/html');
        const root = doc.body.firstChild;
        
        const escapedKeyword = escapeRegExp(keyword);
        const regex = new RegExp(`(${escapedKeyword})`, 'gi');
        
        function traverse(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue;
                if (regex.test(text)) {
                    const tempSpan = document.createElement('span');
                    // Replace matching text with highlight HTML tags
                    tempSpan.innerHTML = text.replace(regex, '<span class="search-highlight">$1</span>');
                    // Replace text node with the span's children elements
                    const parent = node.parentNode;
                    while (tempSpan.firstChild) {
                        parent.insertBefore(tempSpan.firstChild, node);
                    }
                    parent.removeChild(node);
                }
            } else {
                // Node list snapshot to avoid dynamic list mutation issues during loops
                const children = Array.from(node.childNodes);
                children.forEach(traverse);
            }
        }
        
        traverse(root);
        return root.innerHTML;
    } catch (e) {
        console.error('Highlighting error:', e);
        return htmlString; // Fallback to raw string if parsing fails
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==========================================
// EVENT HANDLERS
// ==========================================
function handleSearchInput(e) {
    STATE.searchQuery = e.target.value;
    
    if (STATE.searchQuery.length > 0) {
        STATE.dom.clearSearchBtn.style.display = 'flex';
    } else {
        STATE.dom.clearSearchBtn.style.display = 'none';
    }
    
    applyFiltersAndRender();
}

function handleClearSearch() {
    STATE.dom.searchInput.value = '';
    STATE.searchQuery = '';
    STATE.dom.clearSearchBtn.style.display = 'none';
    applyFiltersAndRender();
    STATE.dom.searchInput.focus();
}

function handleCategoryChange(categoryName) {
    STATE.activeCategory = categoryName;
    renderCategoryFilters();
    applyFiltersAndRender();
}

function handleSortChange(e) {
    STATE.sortOrder = e.target.value;
    applyFiltersAndRender();
}

function handleRefresh() {
    fetchReleaseNotes(true);
}

function handleResetFilters() {
    STATE.dom.searchInput.value = '';
    STATE.searchQuery = '';
    STATE.dom.clearSearchBtn.style.display = 'none';
    STATE.activeCategory = 'All';
    STATE.sortOrder = 'newest';
    STATE.dom.sortSelect.value = 'newest';
    
    renderCategoryFilters();
    applyFiltersAndRender();
}

function changePage(direction) {
    const totalPages = Math.ceil(STATE.filteredNotes.length / STATE.pageSize);
    const targetPage = STATE.currentPage + direction;

    if (targetPage >= 1 && targetPage <= totalPages) {
        STATE.currentPage = targetPage;
        renderNotes();
        // Scroll to notes list top smoothly
        STATE.dom.notesList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==========================================
// UTILITY FUNCTIONS (CLIPBOARD & EXPORT)
// ==========================================
function copyCardText(id) {
    const note = STATE.allNotes.find(n => n.id === id);
    if (!note) return;
    
    navigator.clipboard.writeText(note.plaintext).then(() => {
        // Visual feedback
        const btn = document.querySelector(`[onclick="copyCardText('${id}')"]`);
        if (btn) {
            const originalContent = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="check"></i> Copied!`;
            btn.style.borderColor = '#10b981';
            btn.style.color = '#10b981';
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.style.borderColor = '';
                btn.style.color = '';
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

window.copyCardText = copyCardText;

function handleExportCSV() {
    if (STATE.filteredNotes.length === 0) {
        alert("No notes available to export.");
        return;
    }
    
    const headers = ["Date", "Category", "Plaintext Content"];
    const rows = STATE.filteredNotes.map(note => [
        note.date,
        note.category,
        note.plaintext
    ]);
    
    // Helper to escape CSV cell contents
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bigquery_release_notes_${STATE.activeCategory.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
