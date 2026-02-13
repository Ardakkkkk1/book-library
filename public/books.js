(() => {
  const API_BASE = '/api/books';
  const AUTH_BASE = '/api/auth';
  const REVIEWS_BASE = '/api/reviews';

  const state = {
    authUser: null,
    query: {
      page: 1,
      limit: 10,
      title: '',
      author: '',
      genre: '',
      mine: false
    },
    books: [],
    booksMeta: {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    },
    currentEditId: null,
    selectedBook: null,
    reviews: [],
    reviewsMeta: {
      page: 1,
      limit: 5,
      totalItems: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    },
    reviewEditId: null,
    users: [],
    usersMeta: {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    }
  };

  const ui = {
    alertBox: document.getElementById('alertBox'),
    authBadge: document.getElementById('authBadge'),
    loginSection: document.getElementById('loginSection'),
    sessionSection: document.getElementById('sessionSection'),
    currentUser: document.getElementById('currentUser'),
    writePanel: document.getElementById('writePanel'),
    writeLockLabel: document.getElementById('writeLockLabel'),
    booksLoading: document.getElementById('booksLoading'),
    booksContainer: document.getElementById('booksContainer'),
    editModal: document.getElementById('editModal'),
    reviewsModal: document.getElementById('reviewsModal'),
    reviewsTitle: document.getElementById('reviewsTitle'),
    reviewsLoading: document.getElementById('reviewsLoading'),
    reviewsContainer: document.getElementById('reviewsContainer'),
    reviewFormTitle: document.getElementById('reviewFormTitle'),
    reviewWriteLabel: document.getElementById('reviewWriteLabel'),
    adminPanel: document.getElementById('adminPanel'),
    usersLoading: document.getElementById('usersLoading'),
    usersContainer: document.getElementById('usersContainer')
  };

  function isAdmin() {
    return Boolean(state.authUser && state.authUser.role === 'admin');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showAlert(message, type = 'success') {
    ui.alertBox.className = `alert alert-${type} show`;
    ui.alertBox.textContent = message;
    window.clearTimeout(showAlert.timeoutId);
    showAlert.timeoutId = window.setTimeout(() => {
      ui.alertBox.classList.remove('show');
    }, 3500);
  }

  function normalizeMeta(meta, pageFallback, limitFallback) {
    return {
      page: Number(meta?.page) || pageFallback,
      limit: Number(meta?.limit) || limitFallback,
      totalItems: Number(meta?.totalItems) || 0,
      totalPages: Number(meta?.totalPages) || 1,
      hasPreviousPage: Boolean(meta?.hasPreviousPage),
      hasNextPage: Boolean(meta?.hasNextPage)
    };
  }

  function buildQueryString(params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      query.set(key, String(value));
    }
    return query.toString();
  }

  async function apiRequest(url, options = {}) {
    const init = {
      credentials: 'same-origin',
      ...options
    };

    if (init.body && !init.headers) {
      init.headers = { 'Content-Type': 'application/json' };
    }

    const response = await fetch(url, init);
    let result;

    try {
      result = await response.json();
    } catch {
      result = {
        success: false,
        message: 'Unexpected response from server'
      };
    }

    return { response, result };
  }

  function handleUnauthorized(message) {
    state.authUser = null;
    updateAuthUI();
    showAlert(message || 'Unauthorized. Please login again.', 'error');
  }

  function ensureAuth(message) {
    if (state.authUser) {
      return true;
    }
    showAlert(message || 'Please login first.', 'info');
    return false;
  }

  function setWriteLocked(locked) {
    ui.writePanel.querySelectorAll('input, textarea, button').forEach((el) => {
      el.disabled = locked;
    });
    ui.writeLockLabel.textContent = locked ? 'Read-only mode' : 'Write access enabled';

    document.getElementById('reviewRating').disabled = locked;
    document.getElementById('reviewComment').disabled = locked;
    document.getElementById('saveReviewBtn').disabled = locked;
    ui.reviewWriteLabel.textContent = locked
      ? 'Login required'
      : (isAdmin() ? 'Admin moderation enabled' : 'You can manage your own reviews');
  }

  function updateAuthUI() {
    const authenticated = Boolean(state.authUser);

    ui.authBadge.textContent = authenticated
      ? `Authenticated (${state.authUser.role})`
      : 'Not authenticated';
    ui.authBadge.className = authenticated ? 'badge badge-on' : 'badge badge-off';

    ui.loginSection.classList.toggle('hidden', authenticated);
    ui.sessionSection.classList.toggle('hidden', !authenticated);
    ui.currentUser.textContent = authenticated
      ? `${state.authUser.username} (${state.authUser.role})`
      : '-';

    const mineCheckbox = document.getElementById('mineOnly');
    mineCheckbox.disabled = !authenticated;
    if (!authenticated && mineCheckbox.checked) {
      mineCheckbox.checked = false;
      state.query.mine = false;
    }

    setWriteLocked(!authenticated);

    ui.adminPanel.classList.toggle('hidden', !isAdmin());
    if (!isAdmin()) {
      ui.usersContainer.innerHTML = '<div class="empty">Admin access required.</div>';
    }
  }

  async function checkAuth() {
    try {
      const { result } = await apiRequest(`${AUTH_BASE}/me`);
      if (result.success && result.data?.authenticated) {
        state.authUser = result.data.user;
      } else {
        state.authUser = null;
      }
    } catch {
      state.authUser = null;
    }
    updateAuthUI();
  }

  async function login(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
      showAlert('Username and password are required.', 'error');
      return;
    }

    const { response, result } = await apiRequest(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok || !result.success) {
      showAlert(result.message || 'Login failed', 'error');
      return;
    }

    state.authUser = result.data.user;
    document.getElementById('loginForm').reset();
    updateAuthUI();
    showAlert('Login successful.');
    await loadBooks();
    if (isAdmin()) {
      await loadUsers();
    }
  }

  async function register(event) {
    event.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!username || !password) {
      showAlert('Username and password are required.', 'error');
      return;
    }

    const { response, result } = await apiRequest(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok || !result.success) {
      showAlert(result.message || 'Registration failed', 'error');
      return;
    }

    state.authUser = result.data.user;
    document.getElementById('registerForm').reset();
    updateAuthUI();
    showAlert('Registration successful.');
    await loadBooks();
  }

  async function logout() {
    await apiRequest(`${AUTH_BASE}/logout`, { method: 'POST' });
    state.authUser = null;
    updateAuthUI();
    showAlert('Logged out.', 'info');
    await loadBooks();
  }

  function clearCreateForm() {
    ['title', 'author', 'genre', 'isbn', 'pages', 'published_year', 'rating', 'description'].forEach((id) => {
      document.getElementById(id).value = '';
    });
  }

  function collectCreatePayload() {
    return {
      title: document.getElementById('title').value.trim(),
      author: document.getElementById('author').value.trim(),
      genre: document.getElementById('genre').value.trim(),
      isbn: document.getElementById('isbn').value.trim(),
      pages: document.getElementById('pages').value
        ? Number.parseInt(document.getElementById('pages').value, 10)
        : null,
      published_year: document.getElementById('published_year').value
        ? Number.parseInt(document.getElementById('published_year').value, 10)
        : null,
      rating: document.getElementById('rating').value
        ? Number.parseFloat(document.getElementById('rating').value)
        : null,
      description: document.getElementById('description').value.trim()
    };
  }

  function collectEditPayload() {
    return {
      title: document.getElementById('editTitle').value.trim(),
      author: document.getElementById('editAuthor').value.trim(),
      genre: document.getElementById('editGenre').value.trim(),
      isbn: document.getElementById('editIsbn').value.trim(),
      pages: document.getElementById('editPages').value
        ? Number.parseInt(document.getElementById('editPages').value, 10)
        : null,
      published_year: document.getElementById('editPublishedYear').value
        ? Number.parseInt(document.getElementById('editPublishedYear').value, 10)
        : null,
      rating: document.getElementById('editRating').value
        ? Number.parseFloat(document.getElementById('editRating').value)
        : null,
      description: document.getElementById('editDescription').value.trim()
    };
  }

  function updateStats() {
    const total = state.booksMeta.totalItems;
    const booksOnPage = state.books.length;
    const ratingSum = state.books.reduce((sum, book) => sum + (Number(book.rating) || 0), 0);
    const avg = booksOnPage > 0 ? (ratingSum / booksOnPage).toFixed(1) : '0.0';

    document.getElementById('totalBooks').textContent = String(total);
    document.getElementById('pageBooksCount').textContent = String(booksOnPage);
    document.getElementById('avgRating').textContent = avg;
  }

  function updateBooksPager() {
    const meta = state.booksMeta;
    document.getElementById('bookPageInfo').textContent =
      `Page ${meta.page} / ${meta.totalPages} | Total ${meta.totalItems}`;
    document.getElementById('prevPageBtn').disabled = !meta.hasPreviousPage;
    document.getElementById('nextPageBtn').disabled = !meta.hasNextPage;
  }

  function renderBooks() {
    if (!state.books.length) {
      ui.booksContainer.innerHTML = '<div class="empty">No books found.</div>';
      return;
    }

    let html = '<table><thead><tr>';
    html += '<th>Title</th><th>Author</th><th>Genre</th><th>Owner</th><th>Rating</th><th>Actions</th>';
    html += '</tr></thead><tbody>';

    for (const book of state.books) {
      const canEdit = Boolean(book.permissions?.canEdit);
      const canDelete = Boolean(book.permissions?.canDelete);
      const ownerName = book.owner?.username || 'unknown';

      html += '<tr>';
      html += `<td><strong>${escapeHtml(book.title || '-')}</strong><div class="hint">${escapeHtml(book.isbn || '-')}</div></td>`;
      html += `<td>${escapeHtml(book.author || '-')}</td>`;
      html += `<td>${escapeHtml(book.genre || '-')}</td>`;
      html += `<td>${escapeHtml(ownerName)}</td>`;
      html += `<td><span class="rating">${escapeHtml(book.rating ?? 0)}</span></td>`;
      html += '<td><div class="actions">';
      html += `<button class="btn btn-secondary btn-small" type="button" onclick="openReviewsModal('${book._id}', '${encodeURIComponent(book.title || '')}')">Reviews</button>`;
      if (canEdit) {
        html += `<button class="btn btn-secondary btn-small" type="button" onclick="openEditModal('${book._id}')">Edit</button>`;
      }
      if (canDelete) {
        html += `<button class="btn btn-danger btn-small" type="button" onclick="deleteBook('${book._id}')">Delete</button>`;
      }
      if (!canEdit && !canDelete) {
        html += '<span class="hint">Owner/Admin only</span>';
      }
      html += '</div></td>';
      html += '</tr>';
    }

    html += '</tbody></table>';
    ui.booksContainer.innerHTML = html;
  }

  async function loadBooks() {
    ui.booksLoading.classList.remove('hidden');

    const params = {
      page: state.query.page,
      limit: state.query.limit,
      title: state.query.title,
      author: state.query.author,
      genre: state.query.genre,
      sortBy: 'created_at',
      sortOrder: 'desc'
    };
    if (state.query.mine && state.authUser) {
      params.mine = 'true';
    }

    try {
      const { response, result } = await apiRequest(`${API_BASE}?${buildQueryString(params)}`);
      if (response.status === 401) {
        handleUnauthorized('Login required for this request.');
        return;
      }
      if (!response.ok || !result.success) {
        showAlert(result.message || 'Failed to load books', 'error');
        return;
      }

      state.books = Array.isArray(result.data) ? result.data : [];
      state.booksMeta = normalizeMeta(result.meta, state.query.page, state.query.limit);
      state.query.page = state.booksMeta.page;

      renderBooks();
      updateBooksPager();
      updateStats();
    } catch {
      showAlert('Failed to load books', 'error');
    } finally {
      ui.booksLoading.classList.add('hidden');
    }
  }

  async function addBook() {
    if (!ensureAuth('Please login to add books.')) {
      return;
    }

    const payload = collectCreatePayload();
    if (!payload.title || !payload.author) {
      showAlert('Title and author are required.', 'error');
      return;
    }

    const { response, result } = await apiRequest(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!response.ok || !result.success) {
      showAlert(result.message || 'Failed to create book', 'error');
      return;
    }

    clearCreateForm();
    showAlert('Book created successfully.');
    state.query.page = 1;
    await loadBooks();
  }

  async function openEditModal(id) {
    if (!ensureAuth('Please login to edit books.')) {
      return;
    }

    const { response, result } = await apiRequest(`${API_BASE}/${id}`);
    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!response.ok || !result.success) {
      showAlert(result.message || 'Failed to load book', 'error');
      return;
    }

    const book = result.data || {};
    if (!book.permissions?.canEdit) {
      showAlert('You can edit only your own books.', 'error');
      return;
    }

    state.currentEditId = id;
    document.getElementById('editTitle').value = book.title || '';
    document.getElementById('editAuthor').value = book.author || '';
    document.getElementById('editGenre').value = book.genre || '';
    document.getElementById('editIsbn').value = book.isbn || '';
    document.getElementById('editPages').value = book.pages || '';
    document.getElementById('editPublishedYear').value = book.published_year || '';
    document.getElementById('editRating').value = book.rating || '';
    document.getElementById('editDescription').value = book.description || '';
    ui.editModal.classList.remove('hidden');
  }

  function closeEditModal() {
    state.currentEditId = null;
    ui.editModal.classList.add('hidden');
  }

  async function saveEdit() {
    if (!ensureAuth() || !state.currentEditId) {
      return;
    }

    const payload = collectEditPayload();
    if (!payload.title || !payload.author) {
      showAlert('Title and author are required.', 'error');
      return;
    }

    const { response, result } = await apiRequest(`${API_BASE}/${state.currentEditId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!response.ok || !result.success) {
      showAlert(result.message || 'Failed to update book', 'error');
      return;
    }

    closeEditModal();
    showAlert('Book updated successfully.');
    await loadBooks();
  }

  async function deleteBook(id) {
    if (!ensureAuth('Please login to delete books.')) {
      return;
    }
    if (!window.confirm('Delete this book and related reviews?')) {
      return;
    }

    const { response, result } = await apiRequest(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!response.ok || !result.success) {
      showAlert(result.message || 'Failed to delete book', 'error');
      return;
    }

    showAlert('Book deleted successfully.');
    if (state.selectedBook && state.selectedBook.id === id) {
      closeReviewsModal();
    }
    await loadBooks();
  }

  function readFilters() {
    state.query.title = document.getElementById('filterTitle').value.trim();
    state.query.author = document.getElementById('filterAuthor').value.trim();
    state.query.genre = document.getElementById('filterGenre').value.trim();
    state.query.limit = Number.parseInt(document.getElementById('pageSize').value, 10) || 10;
    state.query.mine = document.getElementById('mineOnly').checked;
  }

  async function applyFilters() {
    readFilters();
    state.query.page = 1;
    await loadBooks();
  }

  async function clearFilters() {
    document.getElementById('filtersForm').reset();
    document.getElementById('mineOnly').checked = false;
    state.query.title = '';
    state.query.author = '';
    state.query.genre = '';
    state.query.limit = Number.parseInt(document.getElementById('pageSize').value, 10) || 10;
    state.query.page = 1;
    state.query.mine = false;
    await loadBooks();
  }

  async function prevBooksPage() {
    if (!state.booksMeta.hasPreviousPage) {
      return;
    }
    state.query.page -= 1;
    await loadBooks();
  }

  async function nextBooksPage() {
    if (!state.booksMeta.hasNextPage) {
      return;
    }
    state.query.page += 1;
    await loadBooks();
  }

  function resetReviewForm() {
    state.reviewEditId = null;
    document.getElementById('reviewRating').value = '';
    document.getElementById('reviewComment').value = '';
    ui.reviewFormTitle.textContent = 'Add Review';
  }

  function updateReviewsPager() {
    const meta = state.reviewsMeta;
    document.getElementById('reviewsPageInfo').textContent =
      `Page ${meta.page} / ${meta.totalPages} | Total ${meta.totalItems}`;
    document.getElementById('prevReviewsBtn').disabled = !meta.hasPreviousPage;
    document.getElementById('nextReviewsBtn').disabled = !meta.hasNextPage;
  }

  function renderReviews() {
    if (!state.reviews.length) {
      ui.reviewsContainer.innerHTML = '<div class="empty">No reviews yet.</div>';
      return;
    }

    let html = '';
    for (const review of state.reviews) {
      const created = review.created_at ? new Date(review.created_at).toLocaleString() : '-';
      const canEdit = Boolean(review.permissions?.canEdit);
      const canDelete = Boolean(review.permissions?.canDelete);

      html += '<div class="review-item">';
      html += '<div class="review-top">';
      html += `<div><strong>${escapeHtml(review.owner?.username || 'unknown')}</strong> <span class="rating">${escapeHtml(review.rating)}</span></div>`;
      html += `<div class="hint">${escapeHtml(created)}</div>`;
      html += '</div>';
      html += `<div>${escapeHtml(review.comment || '')}</div>`;
      html += '<div class="actions" style="margin-top:8px;">';
      if (canEdit) {
        html += `<button class="btn btn-secondary btn-small" type="button" onclick="startEditReview('${review._id}')">Edit</button>`;
      }
      if (canDelete) {
        html += `<button class="btn btn-danger btn-small" type="button" onclick="deleteReview('${review._id}')">Delete</button>`;
      }
      if (!canEdit && !canDelete) {
        html += '<span class="hint">Owner/Admin only</span>';
      }
      html += '</div></div>';
    }

    ui.reviewsContainer.innerHTML = html;
  }

  async function loadReviews() {
    if (!state.selectedBook) {
      return;
    }

    ui.reviewsLoading.classList.remove('hidden');
    const params = buildQueryString({
      bookId: state.selectedBook.id,
      page: state.reviewsMeta.page,
      limit: state.reviewsMeta.limit
    });

    try {
      const { response, result } = await apiRequest(`${REVIEWS_BASE}?${params}`);
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !result.success) {
        showAlert(result.message || 'Failed to load reviews', 'error');
        return;
      }

      state.reviews = Array.isArray(result.data) ? result.data : [];
      state.reviewsMeta = normalizeMeta(result.meta, state.reviewsMeta.page, state.reviewsMeta.limit);
      renderReviews();
      updateReviewsPager();
    } catch {
      showAlert('Failed to load reviews', 'error');
    } finally {
      ui.reviewsLoading.classList.add('hidden');
    }
  }

  function openReviewsModal(bookId, encodedTitle) {
    const title = decodeURIComponent(encodedTitle || '');
    state.selectedBook = { id: bookId, title };
    state.reviewsMeta.page = 1;
    resetReviewForm();
    ui.reviewsTitle.textContent = `Reviews for: ${title || 'Book'}`;
    ui.reviewsModal.classList.remove('hidden');
    loadReviews();
  }

  function closeReviewsModal() {
    state.selectedBook = null;
    state.reviews = [];
    ui.reviewsModal.classList.add('hidden');
    resetReviewForm();
  }

  function startEditReview(id) {
    const review = state.reviews.find((item) => item._id === id);
    if (!review) {
      return;
    }
    if (!review.permissions?.canEdit) {
      showAlert('You can edit only your own reviews.', 'error');
      return;
    }

    state.reviewEditId = id;
    document.getElementById('reviewRating').value = review.rating;
    document.getElementById('reviewComment').value = review.comment || '';
    ui.reviewFormTitle.textContent = 'Edit Review';
  }

  async function saveReview() {
    if (!state.selectedBook) {
      return;
    }
    if (!ensureAuth('Please login to manage reviews.')) {
      return;
    }

    const rating = Number.parseFloat(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value.trim();

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      showAlert('Rating must be between 1 and 5.', 'error');
      return;
    }
    if (!comment) {
      showAlert('Comment is required.', 'error');
      return;
    }

    const editing = Boolean(state.reviewEditId);
    const url = editing ? `${REVIEWS_BASE}/${state.reviewEditId}` : REVIEWS_BASE;
    const payload = editing
      ? { rating, comment }
      : { bookId: state.selectedBook.id, rating, comment };

    const { response, result } = await apiRequest(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!response.ok || !result.success) {
      showAlert(result.message || 'Failed to save review', 'error');
      return;
    }

    showAlert(editing ? 'Review updated.' : 'Review created.');
    resetReviewForm();
    state.reviewsMeta.page = 1;
    await loadReviews();
  }

  async function deleteReview(id) {
    if (!ensureAuth('Please login to delete reviews.')) {
      return;
    }
    if (!window.confirm('Delete this review?')) {
      return;
    }

    const { response, result } = await apiRequest(`${REVIEWS_BASE}/${id}`, {
      method: 'DELETE'
    });

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!response.ok || !result.success) {
      showAlert(result.message || 'Failed to delete review', 'error');
      return;
    }

    showAlert('Review deleted.');
    await loadReviews();
  }

  async function prevReviewsPage() {
    if (!state.reviewsMeta.hasPreviousPage) {
      return;
    }
    state.reviewsMeta.page -= 1;
    await loadReviews();
  }

  async function nextReviewsPage() {
    if (!state.reviewsMeta.hasNextPage) {
      return;
    }
    state.reviewsMeta.page += 1;
    await loadReviews();
  }

  function updateUsersPager() {
    const meta = state.usersMeta;
    document.getElementById('usersPageInfo').textContent =
      `Users page ${meta.page} / ${meta.totalPages} | Total ${meta.totalItems}`;
    document.getElementById('prevUsersBtn').disabled = !meta.hasPreviousPage;
    document.getElementById('nextUsersBtn').disabled = !meta.hasNextPage;
  }

  function renderUsers() {
    if (!state.users.length) {
      ui.usersContainer.innerHTML = '<div class="empty">No users found.</div>';
      return;
    }

    let html = '<table><thead><tr><th>Username</th><th>Role</th><th>Created</th><th>Updated</th></tr></thead><tbody>';
    for (const user of state.users) {
      html += '<tr>';
      html += `<td>${escapeHtml(user.username)}</td>`;
      html += `<td>${escapeHtml(user.role)}</td>`;
      html += `<td>${escapeHtml(user.createdAt ? new Date(user.createdAt).toLocaleString() : '-')}</td>`;
      html += `<td>${escapeHtml(user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '-')}</td>`;
      html += '</tr>';
    }
    html += '</tbody></table>';
    ui.usersContainer.innerHTML = html;
  }

  async function loadUsers() {
    if (!isAdmin()) {
      return;
    }

    ui.usersLoading.classList.remove('hidden');
    const params = buildQueryString({
      page: state.usersMeta.page,
      limit: state.usersMeta.limit
    });

    try {
      const { response, result } = await apiRequest(`${AUTH_BASE}/users?${params}`);
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (response.status === 403) {
        showAlert('Admin access required.', 'error');
        return;
      }
      if (!response.ok || !result.success) {
        showAlert(result.message || 'Failed to load users', 'error');
        return;
      }

      state.users = Array.isArray(result.data) ? result.data : [];
      state.usersMeta = normalizeMeta(result.meta, state.usersMeta.page, state.usersMeta.limit);
      renderUsers();
      updateUsersPager();
    } catch {
      showAlert('Failed to load users', 'error');
    } finally {
      ui.usersLoading.classList.add('hidden');
    }
  }

  async function prevUsersPage() {
    if (!state.usersMeta.hasPreviousPage || !isAdmin()) {
      return;
    }
    state.usersMeta.page -= 1;
    await loadUsers();
  }

  async function nextUsersPage() {
    if (!state.usersMeta.hasNextPage || !isAdmin()) {
      return;
    }
    state.usersMeta.page += 1;
    await loadUsers();
  }

  window.openEditModal = openEditModal;
  window.deleteBook = deleteBook;
  window.openReviewsModal = openReviewsModal;
  window.startEditReview = startEditReview;
  window.deleteReview = deleteReview;

  document.getElementById('loginForm').addEventListener('submit', login);
  document.getElementById('registerForm').addEventListener('submit', register);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('addBookBtn').addEventListener('click', addBook);
  document.getElementById('clearFormBtn').addEventListener('click', clearCreateForm);
  document.getElementById('refreshBtn').addEventListener('click', loadBooks);
  document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
  document.getElementById('prevPageBtn').addEventListener('click', prevBooksPage);
  document.getElementById('nextPageBtn').addEventListener('click', nextBooksPage);
  document.getElementById('pageSize').addEventListener('change', applyFilters);
  document.getElementById('mineOnly').addEventListener('change', applyFilters);
  document.getElementById('filtersForm').addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });

  document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
  document.getElementById('closeEditBtn').addEventListener('click', closeEditModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);

  document.getElementById('closeReviewsBtn').addEventListener('click', closeReviewsModal);
  document.getElementById('saveReviewBtn').addEventListener('click', saveReview);
  document.getElementById('cancelReviewEditBtn').addEventListener('click', resetReviewForm);
  document.getElementById('refreshReviewsBtn').addEventListener('click', loadReviews);
  document.getElementById('prevReviewsBtn').addEventListener('click', prevReviewsPage);
  document.getElementById('nextReviewsBtn').addEventListener('click', nextReviewsPage);

  document.getElementById('refreshUsersBtn').addEventListener('click', loadUsers);
  document.getElementById('prevUsersBtn').addEventListener('click', prevUsersPage);
  document.getElementById('nextUsersBtn').addEventListener('click', nextUsersPage);

  ui.editModal.addEventListener('click', (event) => {
    if (event.target === ui.editModal) {
      closeEditModal();
    }
  });

  ui.reviewsModal.addEventListener('click', (event) => {
    if (event.target === ui.reviewsModal) {
      closeReviewsModal();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeEditModal();
      closeReviewsModal();
    }
  });

  window.addEventListener('load', async () => {
    await checkAuth();
    await loadBooks();
    if (isAdmin()) {
      await loadUsers();
    }
  });
})();
