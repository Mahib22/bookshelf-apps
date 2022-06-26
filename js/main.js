const books = [];
const RENDER_EVENT = 'render-book';

document.addEventListener('DOMContentLoaded', function () {
  const submitForm = document.getElementById('formAddBook');

  submitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    addBook();
    submitForm.reset();
  });

  if (isStorageExist()) {
    loadDataFromStorage();
  }
});

function showAlert(text, icon){
  Swal.fire({
    text: text,
    icon: icon,
  });
}

function confirmDeleteBook(bookData){
  Swal.fire({
    text: `Apakah Anda yakin ingin menghapus buku ${bookData.title}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, hapus buku'
  }).then((result) => {
    if (result.isConfirmed) {
      removeBookFromCompleted(bookData.id);
      showAlert('Buku berhasil dihapus', 'success');
    }
  })
}

function addBook() {
  const titleBook = document.getElementById('inputTitle').value;
  const authorBook = document.getElementById('inputAuthor').value;
  const yearBook = document.getElementById('inputYear').value;
  
  const generatedID = generateId();
  const bookObject = generateBookObject(generatedID, titleBook, authorBook, yearBook, false);
  books.push(bookObject);

  showAlert('Buku berhasil ditambahkan', 'success');
  
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function generateId() {
  return +new Date();
}

function generateBookObject(id, title, author, year, isCompleted) {
  return {
    id,
    title,
    author,
    year,
    isCompleted
  }
}

document.addEventListener(RENDER_EVENT, function () {
  const unreadBookList = document.getElementById('unreadBooks');
  unreadBookList.innerHTML = '';

  const finishedReadList = document.getElementById('finishedReading');
  finishedReadList.innerHTML = '';
  
  for (const bookItem of books) {
    const bookElement = makeBookList(bookItem);
    if (!bookItem.isCompleted) {
      unreadBookList.append(bookElement);
    } else{
      finishedReadList.append(bookElement);
    }
  }
});

function makeBookList(bookObject){
  const bookTitle = document.createElement('p');
  bookTitle.classList.add('mb-0', 'fw-bold', 'fs-5');
  bookTitle.innerText = bookObject.title;

  const bookAuthor = document.createElement('p');
  bookAuthor.classList.add('mb-0');
  bookAuthor.innerText = bookObject.author;

  const bookYear = document.createElement('p');
  bookYear.classList.add('mb-0', 'text-muted');
  bookYear.innerText = bookObject.year;

  const bookInfoSection = document.createElement('div');
  bookInfoSection.append(bookTitle, bookAuthor, bookYear);

  const card = document.createElement('div');
  card.classList.add('bg-white', 'p-3', 'border', 'rounded', 'mb-2', 'd-flex', 'justify-content-between', 'align-items-center', 'book-item');
  card.append(bookInfoSection);
  card.setAttribute('id', `book-${bookObject.id}`);

  const buttonSection = document.createElement('div');

  if (bookObject.isCompleted) {
    const undoButton = document.createElement('button');
    undoButton.classList.add('btn', 'fs-2');
    undoButton.innerHTML = '<i class="bi bi-arrow-counterclockwise text-warning"></i>';
  
    undoButton.addEventListener('click', function () {
      undoBookFromCompleted(bookObject.id);
    });

    buttonSection.append(undoButton);
  } else {
    const checkButton = document.createElement('button');
    checkButton.classList.add('btn', 'fs-2');
    checkButton.innerHTML = '<i class="bi bi-check-circle text-success"></i>';
    
    checkButton.addEventListener('click', function () {
      addBookToCompleted(bookObject.id);
    });

    buttonSection.append(checkButton);
  }

  const penButton = document.createElement('button');
  penButton.classList.add('btn', 'fs-2');
  penButton.innerHTML = '<i class="bi bi-pencil text-info"></i>';

  penButton.addEventListener('click', function () {
    detailBook(bookObject);
  });

  buttonSection.append(penButton);

  const trashButton = document.createElement('button');
  trashButton.classList.add('btn', 'fs-2');
  trashButton.innerHTML = '<i class="bi bi-trash text-danger"></i>';

  trashButton.addEventListener('click', function () {
    confirmDeleteBook(bookObject);
  });

  buttonSection.append(trashButton);

  card.append(buttonSection);

  return card;
}

function addBookToCompleted (bookId) {
  const bookTarget = findBook(bookId);
  
  if (bookTarget == null) return;
  
  bookTarget.isCompleted = true;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function findBook(bookId) {
  for (const bookItem of books) {
    if (bookItem.id === bookId) {
      return bookItem;
    }
  }
  return null;
}

function removeBookFromCompleted(bookId) {
  const bookTarget = findBookIndex(bookId);
 
  if (bookTarget === -1) return;
 
  books.splice(bookTarget, 1);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function undoBookFromCompleted(bookId) {
  const bookTarget = findBook(bookId);
 
  if (bookTarget == null) return;
 
  bookTarget.isCompleted = false;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function findBookIndex(bookId) {
  for (const index in books) {
    if (books[index].id === bookId) {
      return index;
    }
  }
 
  return -1;
}

const newTitle = document.getElementById('editTitle');
const newAuthor = document.getElementById('editAuthor');
const newYear = document.getElementById('editYear');
const editForm = document.getElementById('formEditBook');
const editModal = new bootstrap.Modal(document.getElementById('editModal'), {
  keyboard: false
});

function detailBook(bookObject){
  editModal.show();

  newTitle.value = bookObject.title;
  newAuthor.value = bookObject.author;
  newYear.value = bookObject.year;

  editForm.addEventListener('submit', function (event) {
    event.preventDefault();
    editBook(bookObject.id);
  });
}

function editBook(bookId){
  const bookIndex = books.findIndex((item => item.id === bookId));
  
  books[bookIndex].title = newTitle.value;
  books[bookIndex].author = newAuthor.value;
  books[bookIndex].year = newYear.value;

  editModal.hide();
  showAlert('Buku berhasil diedit', 'success');
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

const searchTitle = document.getElementById('searchTitle');
searchTitle.addEventListener('keyup', searchBook);

function searchBook() {
  const findTitle = searchTitle.value.toLowerCase();
  const bookItem = document.querySelectorAll('.book-item');

  bookItem.forEach((item) => {
    const textItem = item.firstChild.textContent.toLowerCase();

    if(textItem.indexOf(findTitle) != -1) {
      item.setAttribute('style', 'display: block;');
    } else {
      item.setAttribute('style', 'display: none !important;');
    }
  });
}