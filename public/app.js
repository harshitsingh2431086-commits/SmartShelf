const API_BASE = '/api/books';

const bookForm = document.getElementById('book-form');
const bookIdInput = document.getElementById('book-id');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const categoryInput = document.getElementById('category');
const cancelEditBtn = document.getElementById('cancel-edit');
const searchInput = document.getElementById('search');
const booksTbody = document.getElementById('books-tbody');
const emptyMessage = document.getElementById('empty-message');
const toast = document.getElementById('toast');

let books = [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 150);
  }, 2200);
}

async function fetchBooks() {
  try {
    const res = await fetch(API_BASE);
    books = await res.json();
    renderBooks();
  } catch (err) {
    console.error(err);
    showToast('Failed to load books');
  }
}

function renderBooks() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = term
    ? books.filter((b) => {
        return (
          b.title.toLowerCase().includes(term) ||
          b.author.toLowerCase().includes(term) ||
          (b.category || '').toLowerCase().includes(term)
        );
      })
    : books;

  booksTbody.innerHTML = '';

  if (!filtered.length) {
    emptyMessage.classList.remove('hidden');
    return;
  }

  emptyMessage.classList.add('hidden');

  filtered.forEach((book) => {
    const tr = document.createElement('tr');

    const statusClass = book.isAvailable ? 'available' : 'borrowed';
    const statusText = book.isAvailable ? 'Available' : 'Borrowed';

    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.category || '-'}</td>
      <td>
        <span class="status-pill ${statusClass}">
          <span class="status-dot ${statusClass}"></span>
          ${statusText}
        </span>
      </td>
      <td>${book.borrower || '-'}</td>
      <td>
        <button class="btn small secondary" data-action="edit" data-id="${book._id}">Edit</button>
        ${
          book.isAvailable
            ? `<button class="btn small primary" data-action="borrow" data-id="${book._id}">Borrow</button>`
            : `<button class="btn small primary" data-action="return" data-id="${book._id}">Return</button>`
        }
        <button class="btn small danger" data-action="delete" data-id="${book._id}">Delete</button>
      </td>
    `;

    booksTbody.appendChild(tr);
  });
}

bookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = bookIdInput.value;
  const payload = {
    title: titleInput.value.trim(),
    author: authorInput.value.trim(),
    category: categoryInput.value.trim(),
  };

  if (!payload.title || !payload.author) {
    showToast('Title and author are required');
    return;
  }

  try {
    const res = await fetch(id ? `${API_BASE}/${id}` : API_BASE, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Request failed');

    if (id) {
      showToast('Book updated');
    } else {
      showToast('Book added');
    }

    resetForm();
    await fetchBooks();
  } catch (err) {
    console.error(err);
    showToast('Failed to save book');
  }
});

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

function resetForm() {
  bookIdInput.value = '';
  titleInput.value = '';
  authorInput.value = '';
  categoryInput.value = '';
  cancelEditBtn.classList.add('hidden');
}

booksTbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const book = books.find((b) => b._id === id);
  if (!book) return;

  if (action === 'edit') {
    bookIdInput.value = book._id;
    titleInput.value = book.title;
    authorInput.value = book.author;
    categoryInput.value = book.category || '';
    cancelEditBtn.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (action === 'delete') {
    if (!confirm('Delete this book?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Book deleted');
      await fetchBooks();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete book');
    }
    return;
  }

  if (action === 'borrow') {
    const borrower = prompt('Enter borrower name:') || 'Unknown';
    try {
      const res = await fetch(`${API_BASE}/${id}/borrow`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrower }),
      });
      if (!res.ok) throw new Error();
      showToast('Book borrowed');
      await fetchBooks();
    } catch (err) {
      console.error(err);
      showToast('Failed to borrow book');
    }
    return;
  }

  if (action === 'return') {
    try {
      const res = await fetch(`${API_BASE}/${id}/return`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      showToast('Book returned');
      await fetchBooks();
    } catch (err) {
      console.error(err);
      showToast('Failed to return book');
    }
  }
});

searchInput.addEventListener('input', () => {
  renderBooks();
});

fetchBooks();


