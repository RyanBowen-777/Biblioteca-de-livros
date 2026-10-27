



// Initialize Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ COLE AQUI SUAS CONFIGURAÇÕES DO FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: "AIzaSyBjVogjaiMSF4xNu3brZ9lFXsXo5GtSLf8",
    authDomain: "nuvem2-ryan.firebaseapp.com",
    projectId: "nuvem2-ryan",
    storageBucket: "nuvem2-ryan.firebasestorage.app",
    messagingSenderId: "482440636469",
    appId: "1:482440636469:web:0f47d2382ffb2b7ea3697c"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const booksCollection = collection(db, "livros");

let localBooks = [];

// Evento de carregamento principal
document.addEventListener('DOMContentLoaded', () => {
    listenToFirestore();
    setupEventListeners();
    checkInitialTheme();
});

// Real-time listener para ler do Firestore (Read)
function listenToFirestore() {
    const loadingEl = document.getElementById('firestoreLoading');
    
    onSnapshot(booksCollection, (snapshot) => {
        localBooks = [];
        snapshot.forEach((docSnap) => {
            localBooks.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        
        if (loadingEl) loadingEl.classList.add('hidden');
        renderBooks();
        updateStats();
    }, (error) => {
        console.error("Erro ao buscar dados do Firestore: ", error);
        if (loadingEl) loadingEl.innerText = "Erro ao carregar do Firestore. Verifique suas regras do banco de dados.";
    });
}

// Event Listeners gerais
function setupEventListeners() {
    const tabMinhaBiblioteca = document.getElementById('tabMinhaBiblioteca');
    const tabCatalogo = document.getElementById('tabCatalogo');
    const sectionMinhaBiblioteca = document.getElementById('sectionMinhaBiblioteca');
    const sectionCatalogo = document.getElementById('sectionCatalogo');

    tabMinhaBiblioteca.addEventListener('click', () => {
        tabMinhaBiblioteca.className = "tab-btn pb-3 font-semibold text-indigo-600 border-b-2 border-indigo-600 transition";
        tabCatalogo.className = "tab-btn pb-3 font-semibold text-slate-500 hover:text-slate-800 transition";
        sectionMinhaBiblioteca.classList.remove('hidden');
        sectionCatalogo.classList.add('hidden');
    });

    tabCatalogo.addEventListener('click', () => {
        tabCatalogo.className = "tab-btn pb-3 font-semibold text-indigo-600 border-b-2 border-indigo-600 transition";
        tabMinhaBiblioteca.className = "tab-btn pb-3 font-semibold text-slate-500 hover:text-slate-800 transition";
        sectionCatalogo.classList.remove('hidden');
        sectionMinhaBiblioteca.classList.add('hidden');
    });

    document.getElementById('searchInput').addEventListener('input', renderBooks);
    document.getElementById('filterStatus').addEventListener('change', renderBooks);

    document.getElementById('btnSearchApi').addEventListener('click', searchOpenLibrary);
    document.getElementById('apiSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchOpenLibrary();
    });

    document.getElementById('btnOpenModal').addEventListener('click', () => openModal());
    document.getElementById('btnEmptyAdd').addEventListener('click', () => openModal());
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCloseModalHeader').addEventListener('click', closeModal);
    document.getElementById('bookForm').addEventListener('submit', saveBook);

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

// Renderizar livros na tela
function renderBooks() {
    const grid = document.getElementById('booksGrid');
    const emptyState = document.getElementById('emptyState');
    const search = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;

    const filtered = localBooks.filter(book => {
        const matchesSearch = (book.title || '').toLowerCase().includes(search) || (book.author || '').toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'todos' || book.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    grid.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    filtered.forEach(book => {
        const statusBadge = getStatusBadge(book.status);
        const stars = getStarsHTML(book.rating);
        const coverImg = book.cover ? book.cover : 'https://via.placeholder.com/150x200?text=Sem+Capa';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition';
        
        card.innerHTML = `
            <div class="p-5 flex gap-4">
                <img src="${coverImg}" alt="${book.title}" class="w-20 h-28 object-cover rounded-lg shadow-sm bg-slate-100 flex-shrink-0" onerror="this.src='https://via.placeholder.com/150x200?text=Capa+Indisponível'">
                <div class="flex-grow min-w-0">
                    <div class="flex items-start justify-between gap-2 mb-1">
                        <span class="text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge.class}">${statusBadge.text}</span>
                        <div class="flex gap-2 text-slate-400">
                            <button data-id="${book.id}" class="btn-edit hover:text-indigo-600 transition" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button data-id="${book.id}" class="btn-delete hover:text-rose-600 transition" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <h4 class="font-bold text-slate-800 text-base truncate" title="${book.title}">${book.title}</h4>
                    <p class="text-sm text-slate-500 truncate mb-1"><i class="fa-solid fa-user-pen mr-1 text-xs"></i> ${book.author}</p>
                    <p class="text-xs text-slate-400 mb-2"><i class="fa-solid fa-calendar mr-1"></i> ${book.year || 'N/I'}</p>
                    <div class="flex items-center text-xs text-amber-500">${stars}</div>
                </div>
            </div>
            ${book.notes ? `<div class="bg-slate-50 px-5 py-3 border-t border-slate-100 text-xs text-slate-600 italic"><i class="fa-solid fa-quote-left mr-1 text-slate-400"></i> ${book.notes}</div>` : ''}
        `;

        grid.appendChild(card);
    });

    // Eventos de clique para editar e deletar dinamicamente
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const bookToEdit = localBooks.find(b => b.id === id);
            if (bookToEdit) openModal(bookToEdit);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            deleteBook(id);
        });
    });
}

function getStatusBadge(status) {
    switch(status) {
        case 'lido': return { text: 'Lido', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
        case 'lendo': return { text: 'Lendo', class: 'bg-indigo-50 text-indigo-700 border border-indigo-200' };
        case 'desejado': return { text: 'Desejado', class: 'bg-amber-50 text-amber-700 border border-amber-200' };
        default: return { text: status || 'Desejado', class: 'bg-slate-100 text-slate-700 border border-slate-200' };
    }
}

function getStarsHTML(rating) {
    const num = parseInt(rating) || 0;
    if (num === 0) return '<span class="text-slate-400 text-xs">Sem nota</span>';
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<i class="fa-solid fa-star ${i <= num ? 'text-amber-400' : 'text-slate-200'}"></i>`;
    }
    return html;
}

function updateStats() {
    const total = localBooks.length;
    const lidos = localBooks.filter(b => b.status === 'lido').length;
    const desejados = localBooks.filter(b => b.status === 'desejado').length;

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statLidos').innerText = lidos;
    document.getElementById('statDesejados').innerText = desejados;
}

// Modal e Formulário (CRUD)
function openModal(bookToEdit = null) {
    const modal = document.getElementById('bookModal');
    const titleEl = document.getElementById('modalTitle');
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';

    if (bookToEdit) {
        titleEl.innerText = 'Editar Livro';
        document.getElementById('bookId').value = bookToEdit.id;
        document.getElementById('bookTitle').value = bookToEdit.title || '';
        document.getElementById('bookAuthor').value = bookToEdit.author || '';
        document.getElementById('bookYear').value = bookToEdit.year || '';
        document.getElementById('bookStatus').value = bookToEdit.status || 'desejado';
        document.getElementById('bookRating').value = bookToEdit.rating || '0';
        document.getElementById('bookCover').value = bookToEdit.cover || '';
        document.getElementById('bookNotes').value = bookToEdit.notes || '';
    } else {
        titleEl.innerText = 'Adicionar Novo Livro';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    const modal = document.getElementById('bookModal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

// Salvar / Cadastrar (Create & Update)
async function saveBook(e) {
    e.preventDefault();
    const id = document.getElementById('bookId').value;
    
    const bookData = {
        title: document.getElementById('bookTitle').value.trim(),
        author: document.getElementById('bookAuthor').value.trim(),
        year: document.getElementById('bookYear').value,
        status: document.getElementById('bookStatus').value,
        rating: document.getElementById('bookRating').value,
        cover: document.getElementById('bookCover').value.trim(),
        notes: document.getElementById('bookNotes').value.trim()
    };

    try {
        if (id) {
            // Update
            const bookRef = doc(db, "livros", id);
            await updateDoc(bookRef, bookData);
            showToast('Livro atualizado no Firestore!');
        } else {
            // Create
            await addDoc(booksCollection, bookData);
            showToast('Livro cadastrado no Firestore!');
        }
        closeModal();
    } catch (error) {
        console.error("Erro ao salvar no Firestore: ", error);
        showToast('Erro ao salvar os dados no Firestore.', 'error');
    }
}

// Excluir (Delete)
async function deleteBook(id) {
    if (confirm('Tem certeza que deseja remover este registro do Firestore?')) {
        try {
            await deleteDoc(doc(db, "livros", id));
            showToast('Livro removido do Firestore!', 'error');
        } catch (error) {
            console.error("Erro ao deletar do Firestore: ", error);
            showToast('Erro ao excluir registro.', 'error');
        }
    }
}

// Consumo da API Externa (Open Library API)
async function searchOpenLibrary() {
    const query = document.getElementById('apiSearchInput').value.trim();
    if (!query) {
        alert('Digite um termo para pesquisar.');
        return;
    }

    const loading = document.getElementById('apiLoading');
    const resultsGrid = document.getElementById('apiResultsGrid');
    loading.classList.remove('hidden');
    resultsGrid.innerHTML = '';

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`);
        const data = await response.json();
        loading.classList.add('hidden');

        if (!data.docs || data.docs.length === 0) {
            resultsGrid.innerHTML = '<p class="col-span-full text-center text-slate-500 py-8">Nenhum resultado retornado da Open Library API.</p>';
            return;
        }

        data.docs.forEach(docData => {
            const title = docData.title || 'Título desconhecido';
            const author = docData.author_name ? docData.author_name.join(', ') : 'Autor desconhecido';
            const year = docData.first_publish_year ? docData.first_publish_year.toString() : '';
            const coverId = docData.cover_i;
            const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : '';

            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between p-5';
            
            card.innerHTML = `
                <div class="flex gap-4 mb-4">
                    <img src="${coverUrl || 'https://via.placeholder.com/150x200?text=Sem+Capa'}" alt="${title}" class="w-20 h-28 object-cover rounded-lg shadow-sm bg-slate-100 flex-shrink-0" onerror="this.src='https://via.placeholder.com/150x200?text=Capa+Indisponível'">
                    <div class="flex-grow min-w-0">
                        <h4 class="font-bold text-slate-800 text-base truncate" title="${title}">${title}</h4>
                        <p class="text-sm text-slate-500 truncate mb-1"><i class="fa-solid fa-user-pen mr-1 text-xs"></i> ${author}</p>
                        <p class="text-xs text-slate-400 mb-2"><i class="fa-solid fa-calendar mr-1"></i> ${year || 'Ano não inf.'}</p>
                    </div>
                </div>
                <button class="btn-add-api w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-plus"></i> Salvar no Firestore
                </button>
            `;

            card.querySelector('.btn-add-api').addEventListener('click', () => {
                addBookFromApi({ title, author, year, cover: coverUrl });
            });

            resultsGrid.appendChild(card);
        });

    } catch (error) {
        loading.classList.add('hidden');
        resultsGrid.innerHTML = '<p class="col-span-full text-center text-rose-500 py-8">Erro ao se conectar à Open Library API.</p>';
        console.error(error);
    }
}

// Adiciona livro retornado da API diretamente no Firestore
async function addBookFromApi(bookData) {
    try {
        await addDoc(booksCollection, {
            title: bookData.title,
            author: bookData.author,
            year: bookData.year,
            status: 'desejado',
            rating: '0',
            cover: bookData.cover || '',
            notes: 'Importado via Open Library API'
        });
        showToast(`"${bookData.title}" salvo no Firestore!`);
        document.getElementById('tabMinhaBiblioteca').click();
    } catch (error) {
        console.error("Erro ao salvar da API no Firestore: ", error);
        showToast("Erro ao importar registro.", "error");
    }
}

// Funções Utilitárias (Toast e Tema)
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMessage.innerText = message;
    if (type === 'error') {
        toastIcon.className = 'fa-solid fa-circle-exclamation text-rose-400';
    } else {
        toastIcon.className = 'fa-solid fa-circle-check text-emerald-400';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    body.classList.toggle('dark-mode');

    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    if (isDark) {
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i> <span>Modo Claro</span>';
    } else {
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i> <span>Modo Escuro</span>';
    }
}

function checkInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('themeToggle');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i> <span>Modo Claro</span>';
    }
}   