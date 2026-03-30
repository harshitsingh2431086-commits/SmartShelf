require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_db';

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Book model
const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    isAvailable: { type: Boolean, default: true },
    borrower: { type: String, default: '' },
  },
  { timestamps: true }
);

const Book = mongoose.model('Book', bookSchema);

// Routes
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch books' });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, author, category } = req.body;
    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }
    const book = await Book.create({ title, author, category });
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create book' });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const { title, author, category } = req.body;
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, category },
      { new: true }
    );
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update book' });
  }
});

app.patch('/api/books/:id/borrow', async (req, res) => {
  try {
    const { borrower } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (!book.isAvailable) {
      return res.status(400).json({ message: 'Book is already borrowed' });
    }
    book.isAvailable = false;
    book.borrower = borrower || 'Unknown';
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Failed to borrow book' });
  }
});

app.patch('/api/books/:id/return', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    book.isAvailable = true;
    book.borrower = '';
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Failed to return book' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete book' });
  }
});

// Fallback to frontend
app.use((req, res) => {
  res.status(404).send("Page not found");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});