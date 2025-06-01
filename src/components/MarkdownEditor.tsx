import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
  getAuth,
} from "firebase/auth";

import { auth, db } from "../firebase";

interface Note {
  id?: string;
  uid: string;
  title: string;
  content: string;
  createdAt: Timestamp;
}

export default function MarkdownEditor() {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("# Digite seu markdown aqui...\n\n> Pré-visualização à direita.");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState<boolean>(false);

  const notesRef = collection(db, "notes");

  // Listener de autenticação
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchNotes(u.uid);
      } else {
        setNotes([]);
        // Limpar editor quando usuário sai
        clearEditor();
      }
    });
    return unsub;
  }, []);

  // Listener em tempo real para notas do usuário
  const fetchNotes = (uid: string) => {
    setLoadingNotes(true);
    const q = query(notesRef, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      const arr: Note[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Note;
        if (data.uid === uid) {
          arr.push({ ...data, id: docSnap.id });
        }
      });
      setNotes(arr);
      setLoadingNotes(false);
    });
  };

  // Login Google
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Erro no login:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  // Salvar ou atualizar nota
  const handleSave = async () => {
    if (!user) return alert("É necessário estar logado para salvar.");
    if (!title.trim()) return alert("Defina um título para a nota.");
    try {
      if (selectedId) {
        // Atualizando nota existente
        await setDoc(doc(db, "notes", selectedId), {
          uid: user.uid,
          title,
          content,
          createdAt: Timestamp.now(),
        });
        // Não remove a seleção - mantém a nota selecionada
      } else {
        // Criando nova nota
        const docRef = await addDoc(notesRef, {
          uid: user.uid,
          title,
          content,
          createdAt: Timestamp.now(),
        });
        // Para nova nota, define como selecionada após criação
        setSelectedId(docRef.id);
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  };

  // Excluir nota
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Tem certeza que deseja excluir esta nota?")) return;
    try {
      await deleteDoc(doc(db, "notes", id));
      if (selectedId === id) clearEditor();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  // Selecionar nota para edição
  const handleSelect = (note: Note) => {
    setSelectedId(note.id!);
    setTitle(note.title);
    setContent(note.content);
  };

  // Nova função para limpar apenas quando necessário
  const clearEditor = () => {
    setSelectedId(null);
    setTitle("");
    setContent("# Digite seu markdown aqui...\n\n> Pré-visualização à direita.");
  };

  // Nova função para criar nova nota
  const handleNewNote = () => {
    clearEditor();
  };

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-gray-900 to-gray-800 p-4 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">Markdown Notebook</h1>
        <div className="flex gap-2">
          {user ? (
            <>
              <span className="text-sm opacity-75">Olá, {user.displayName?.split(" ")[0]}</span>
              <button
                onClick={handleLogout}
                className="border border-red-400 px-3 py-1 rounded hover:bg-red-500/20 transition"
              >
                Sair
              </button>
            </>
          ) : (
            <button
              className="border border-sky-400 px-3 py-1 rounded hover:bg-sky-500/20 transition"
              onClick={handleLogin}
            >
              Entrar com Google
            </button>
          )}
        </div>
      </header>

      {/* Editor / Preview */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da nota"
              className="flex-1 bg-transparent border border-gray-700 rounded p-2 outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={handleNewNote}
              className="border border-gray-500 px-3 py-1 rounded hover:bg-gray-500/20 transition"
              title="Nova nota"
            >
              Nova
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 bg-transparent border border-gray-700 rounded p-2 font-mono resize-none outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="# Digite seu markdown aqui..."
          />
          <button
            onClick={handleSave}
            className="disabled:opacity-50 border border-emerald-500 rounded p-2 hover:bg-emerald-500/20 transition"
            disabled={!user}
          >
            {selectedId ? "Atualizar nota" : "Salvar nota"}
          </button>
        </section>

        {/* Preview - Markdown básico funcional */}
        <section className="border border-gray-700 rounded p-4 overflow-y-auto">
          <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // CABEÇALHOS
              h1: ({children}) => <h1 className="text-3xl font-bold text-white mb-4">{children}</h1>,
              h2: ({children}) => <h2 className="text-2xl font-semibold text-white mb-3">{children}</h2>,
              h3: ({children}) => <h3 className="text-xl font-medium text-white mb-2">{children}</h3>,
              h4: ({children}) => <h4 className="text-lg font-medium text-white mb-2">{children}</h4>,
              h5: ({children}) => <h5 className="text-base font-medium text-white mb-1">{children}</h5>,
              h6: ({children}) => <h6 className="text-sm font-medium text-white mb-1">{children}</h6>,
    
              // TEXTO
              p: ({children}) => <p className="text-gray-200 mb-3 leading-relaxed">{children}</p>,
              strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
              em: ({children}) => <em className="text-gray-300 italic">{children}</em>,
              del: ({children}) => <del className="text-gray-400 line-through">{children}</del>,
    
              // CÓDIGO
              code: ({children}) => <code className="bg-gray-800 text-emerald-400 px-1 py-0.5 rounded text-sm">{children}</code>,
              pre: ({children}) => <pre className="bg-gray-800 p-3 rounded text-emerald-400 overflow-x-auto mb-3">{children}</pre>,
    
              // CITAÇÕES E LINHA
              blockquote: ({children}) => <blockquote className="border-l-4 border-sky-500 pl-4 italic text-gray-300 mb-3">{children}</blockquote>,
              hr: () => <hr className="border-t border-gray-600 my-4" />,
    
              // LISTAS
              ul: ({children}) => <ul className="list-disc list-inside text-gray-200 mb-3 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside text-gray-200 mb-3 space-y-1">{children}</ol>,
              li: ({children}) => <li className="text-gray-200">{children}</li>,
    
              // LINKS E IMAGENS
              a: ({children, href}) => <a href={href} className="text-sky-400 hover:text-sky-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
              img: ({src, alt}) => (
                <img 
                  src={src} 
                  alt={alt} 
                  className="max-w-full h-auto rounded border border-gray-600 mb-3"
                />
              ),
    
              // TABELAS
              table: ({children}) => (
                <div className="overflow-x-auto mb-4 mt-2">
                  <table className="border-collapse border border-gray-600 w-full min-w-full">
                    {children}
                  </table>
                </div>
              ),
              thead: ({children}) => (
                <thead className="bg-gray-800">{children}</thead>
              ),
              tbody: ({children}) => (
                <tbody>{children}</tbody>
              ),
              tr: ({children}) => (
                <tr className="border-b border-gray-600">{children}</tr>
              ),
              th: ({children}) => (
                <th className="border border-gray-600 px-3 py-2 text-white font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({children}) => (
                <td className="border border-gray-600 px-3 py-2 text-gray-200">
                  {children}
                </td>
              ),
    
              // CHECKBOXES (lista de tarefas)
              input: ({type, checked, disabled}) => {
                if (type === 'checkbox') {
                  return (
                    <input 
                      type="checkbox" 
                      checked={checked || false}
                      disabled={true}
                      className="mr-2 accent-sky-500 pointer-events-none"
                    />
                  );
                }
                return null;
              },
            }}
          >
            {content || "# Pré-visualização\n\nDigite algo no editor à esquerda para ver a formatação markdown aqui."}
          </ReactMarkdown>
          </div>
        </section>
      </main>

      {/* Footer - Lista de notas */}
      <footer className="mt-6 border-t border-gray-700 pt-4">
        <h2 className="text-xl mb-2 font-semibold">Suas notas</h2>
        {loadingNotes ? (
          <p>Carregando...</p>
        ) : notes.length === 0 ? (
          <p className="opacity-70">Nenhuma nota salva.</p>
        ) : (
          <ul className="space-y-1">
            {notes.map((n) => (
              <li
                key={n.id}
                className={`flex items-center justify-between hover:bg-gray-700/40 rounded px-2 py-1 cursor-pointer transition ${
                  selectedId === n.id ? 'bg-sky-500/20 border border-sky-500' : ''
                }`}
              >
                <span onClick={() => handleSelect(n)} className="flex-1">
                  {n.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(n.id);
                  }}
                  className="text-red-400 hover:text-red-200 ml-2"
                  title="Excluir"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </div>
  );
}