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
  const [showHelp, setShowHelp] = useState<boolean>(false);

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

  // Função para exportar/baixar arquivo .md
  const handleExport = () => {
    if (!title.trim() && !content.trim()) {
      alert("Não há conteúdo para exportar.");
      return;
    }
  
    const fileName = title.trim() || "nota-sem-titulo";
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-gray-900 to-gray-800 p-4 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-lg sm:text-2xl font-bold flex-shrink-0">Markdown Notebook</h1>
        <div className="flex gap-2 items-center flex-shrink-0">
          <button
            onClick={handleExport}
            className="border border-green-400 px-2 sm:px-3 py-1 rounded hover:bg-green-500/20 transition text-xs sm:text-sm"
            title="Exportar como arquivo .md"
          >
            Exportar
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="border border-blue-400 px-2 sm:px-3 py-1 rounded hover:bg-blue-500/20 transition text-xs sm:text-sm"
            title="Guia de Markdown"
          >
            Ajuda
          </button>
          {user ? (
            <>
              <span className="text-xs sm:text-sm opacity-75 hidden xs:inline">
                Olá, {user.displayName?.split(" ")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="border border-red-400 px-2 sm:px-3 py-1 rounded hover:bg-red-500/20 transition text-xs sm:text-sm"
              >
                Sair
              </button>
            </>
          ) : (
            <button
              className="border border-sky-400 px-2 sm:px-3 py-1 rounded hover:bg-sky-500/20 transition text-xs sm:text-sm"
              onClick={handleLogin}
            >
              Entrar com Google
            </button>
          )}
        </div>
      </header>

      {/* Editor / Preview */}
      <main className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 min-h-0">
        <section className="flex flex-col gap-2 min-h-0">
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da nota"
              className="flex-1 bg-transparent border border-gray-700 rounded p-2 outline-none focus:ring-1 focus:ring-sky-500 text-sm sm:text-base"
            />
            <button
              onClick={handleNewNote}
              className="border border-gray-500 px-2 sm:px-3 py-1 rounded hover:bg-gray-500/20 transition text-sm flex-shrink-0"
              title="Nova nota"
            >
              Nova
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 bg-transparent border border-gray-700 rounded p-2 font-mono resize-none outline-none focus:ring-1 focus:ring-sky-500 text-sm sm:text-base min-h-[250px] sm:min-h-0"
            placeholder="# Digite seu markdown aqui..."
          />
          <button
            onClick={handleSave}
            className="disabled:opacity-50 border border-emerald-500 rounded p-2 hover:bg-emerald-500/20 transition text-sm sm:text-base"
            disabled={!user}
          >
            {selectedId ? "Atualizar nota" : "Salvar nota"}
          </button>
        </section>

        {/* Preview - Markdown básico funcional */}
        <section className="border border-gray-700 rounded p-2 sm:p-4 overflow-y-auto min-h-0">
          <div className="prose prose-invert max-w-none prose-sm sm:prose-base">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // CABEÇALHOS
              h1: ({children}) => <h1 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-4">{children}</h1>,
              h2: ({children}) => <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-3">{children}</h2>,
              h3: ({children}) => <h3 className="text-base sm:text-xl font-medium text-white mb-1 sm:mb-2">{children}</h3>,
              h4: ({children}) => <h4 className="text-lg font-medium text-white mb-2">{children}</h4>,
              h5: ({children}) => <h5 className="text-base font-medium text-white mb-1">{children}</h5>,
              h6: ({children}) => <h6 className="text-sm font-medium text-white mb-1">{children}</h6>,
    
              // TEXTO
              p: ({children}) => <p className="text-gray-200 mb-2 sm:mb-3 leading-relaxed text-xs sm:text-base">{children}</p>,
              strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
              em: ({children}) => <em className="text-gray-300 italic">{children}</em>,
              del: ({children}) => <del className="text-gray-400 line-through">{children}</del>,
    
              // CÓDIGO
              code: ({children}) => <code className="bg-gray-800 text-emerald-400 px-1 py-0.5 rounded text-xs break-all">{children}</code>,
              pre: ({children}) => <pre className="bg-gray-800 p-2 sm:p-3 rounded text-emerald-400 overflow-x-auto mb-2 sm:mb-3 text-xs">{children}</pre>,
    
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
                <th className="border border-gray-600 px-1 sm:px-3 py-1 sm:py-2 text-white font-semibold text-left text-xs sm:text-sm">
                  {children}
                </th>
              ),
              td: ({children}) => (
                <td className="border border-gray-600 px-1 sm:px-3 py-1 sm:py-2 text-gray-200 text-xs sm:text-sm">
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
      <footer className="mt-6 border-t border-gray-700 pt-4 h-48 flex flex-col">
        <h2 className="text-base sm:text-xl mb-2 font-semibold">Suas notas</h2>
        {loadingNotes ? (
          <p>Carregando...</p>
        ) : notes.length === 0 ? (
          <p className="opacity-70">Nenhuma nota salva.</p>
        ) : (
          <ul className="space-y-1 flex-1 overflow-y-auto">
            {notes.map((n) => (
              <li
                key={n.id}
                className={`flex items-center justify-between hover:bg-gray-700/40 rounded px-2 py-1 cursor-pointer transition text-xs sm:text-base ${
                  selectedId === n.id ? 'bg-sky-500/20 border border-sky-500' : ''
                }`}
              >
                <span 
                  onClick={() => handleSelect(n)} 
                  className="flex-1 truncate pr-2"
                  title={n.title}
                >
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

      {/* Modal de Ajuda */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header do Modal */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">📚 Guia de Markdown</h2>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Conteúdo do Modal */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
              {/* Cabeçalhos */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-1">
                  📝 Cabeçalhos
                </h3>
                <div className="bg-gray-900 p-3 rounded text-sm">
                  <div className="text-gray-300 mb-2">Digite:</div>
                  <code className="text-emerald-400">
                    # Título 1<br/>
                    ## Título 2<br/>
                    ### Título 3<br/>
                    #### Título 4<br/>
                    ##### Título 5
                  </code>
                  <div className="text-gray-300 mt-3 mb-1">Resultado:</div>
                  <div className="border-l-2 border-sky-500 pl-3">
                    <h1 className="text-2xl font-bold text-white">Título 1</h1>
                    <h2 className="text-xl font-semibold text-white">Título 2</h2>
                    <h3 className="text-lg font-medium text-white">Título 3</h3>
                    <h4 className="text-base font-medium text-white">Título 4</h4>
                    <h5 className="text-base font-medium text-white">Título 5</h5>
                  </div>
                </div>
              </div>

              {/* Formatação de Texto */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-1">
                  ✨ Formatação de Texto
                </h3>
                <div className="bg-gray-900 p-3 rounded text-sm">
                  <div className="text-gray-300 mb-2">Digite:</div>
                  <code className="text-emerald-400">
                    **Negrito**<br/>
                    *Itálico*<br/>
                    ~~Riscado~~<br/>
                    `código inline`
                  </code>
                  <div className="text-gray-300 mt-3 mb-1">Resultado:</div>
                  <div className="border-l-2 border-sky-500 pl-3 text-gray-200">
                    <strong className="text-white font-bold">Negrito</strong><br/>
                    <em className="italic">Itálico</em><br/>
                    <del className="line-through text-gray-400">Riscado</del><br/>
                    <code className="bg-gray-800 text-emerald-400 px-1 rounded">código inline</code>
                  </div>
                </div>
              </div>

              {/* Listas */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-1">
                  📋 Listas
                </h3>
                <div className="bg-gray-900 p-3 rounded text-sm">
                  <div className="text-gray-300 mb-2">Digite:</div>
                  <code className="text-emerald-400">
                    - Item 1<br/>
                    - Item 2<br/>
                    &nbsp;&nbsp;- Sub-item<br/>
                    <br/>
                    1. Primeiro<br/>
                    2. Segundo<br/>
                    3. Terceiro
                  </code>
                  <div className="text-gray-300 mt-3 mb-1">Resultado:</div>
                  <div className="border-l-2 border-sky-500 pl-3 text-gray-200">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Item 1</li>
                      <li>Item 2
                        <ul className="list-disc list-inside ml-4">
                          <li>Sub-item</li>
                        </ul>
                      </li>
                    </ul>
                    <ol className="list-decimal list-inside space-y-1 mt-2">
                      <li>Primeiro</li>
                      <li>Segundo</li>
                      <li>Terceiro</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Links e Imagens */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-1">
                🔗 Links e Imagens
                </h3>
                <div className="bg-gray-900 p-3 rounded text-sm">
                  <div className="text-gray-300 mb-2">Digite:</div>
                  <code className="text-emerald-400">
                    [Texto do link](https://exemplo.com)<br/>
                    ![Alt da imagem](url-da-imagem.jpg)
                  </code>
                  <div className="text-gray-300 mt-3 mb-1">Resultado:</div>
                  <div className="border-l-2 border-sky-500 pl-3 text-gray-200">
                    <a href="#" className="text-sky-400 hover:text-sky-300 underline">Texto do link</a><br/>
                    <span className="text-gray-400">🖼️ Imagem seria exibida aqui</span>
                  </div>
                </div>
              </div>

              {/* Citações */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-1">
                💬 Citações
                </h3>
                <div className="bg-gray-900 p-3 rounded text-sm">
                  <div className="text-gray-300 mb-2">Digite:</div>
                  <code className="text-emerald-400">
                    &gt; Esta é uma citação<br/>
                    &gt; Pode ter várias linhas
                  </code>
                  <div className="text-gray-300 mt-3 mb-1">Resultado:</div>
                  <div className="border-l-2 border-sky-500 pl-3">
                    <blockquote className="border-l-4 border-sky-500 pl-4 italic text-gray-300">
                      Esta é uma citação<br/>
                      Pode ter várias linhas
                    </blockquote>
                </div>
                </div>
              </div>

              {/* Código */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-1">
                  💻 Blocos de Código
                </h3>
                <div className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                  <div className="text-gray-300 mb-2">Digite:</div>
                  <pre className="bg-gray-800 p-3 rounded text-emerald-400 text-xs overflow-x-auto">
                    <code>{`\`\`\`javascript
function exemplo() {
  console.log("Olá!");
}
\`\`\``}            </code>
                  </pre>
    
                  <div className="text-gray-300 mt-3 mb-1">Resultado:</div>
                  <div className="border-l-2 border-sky-500 pl-3">
                    <pre className="bg-gray-800 p-3 rounded text-emerald-400 text-xs overflow-x-auto">
                      <code>{`function exemplo() {
  console.log("Olá!");
}`}                   </code>
                    </pre>
                </div>
                </div>
              </div>

              {/* Tabelas */} 
              <div className="space-y-3 lg:col-span-2">
                <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-1">
                  📊 Tabelas
                </h3>
                <div className="bg-gray-900 p-3 rounded text-sm">
                  <div className="text-gray-300 mb-2">Digite:</div>
                  <code className="text-emerald-400">
                    | Nome | Idade | Cidade |<br/>
                    |------|-------|--------|<br/>
                    | João | 25 | SP |<br/>
                    | Maria | 30 | RJ |
                  </code>
                  <div className="text-gray-300 mt-3 mb-1">Resultado:</div>
                  <div className="border-l-2 border-sky-500 pl-3 overflow-x-auto">
                    <table className="border-collapse border border-gray-600 w-full text-xs">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="border border-gray-600 px-2 py-1 text-white font-semibold text-left">Nome</th>
                          <th className="border border-gray-600 px-2 py-1 text-white font-semibold text-left">Idade</th>
                          <th className="border border-gray-600 px-2 py-1 text-white font-semibold text-left">Cidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-600 px-2 py-1 text-gray-200">João</td>
                          <td className="border border-gray-600 px-2 py-1 text-gray-200">25</td>
                          <td className="border border-gray-600 px-2 py-1 text-gray-200">SP</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-600 px-2 py-1 text-gray-200">Maria</td>
                          <td className="border border-gray-600 px-2 py-1 text-gray-200">30</td>
                          <td className="border border-gray-600 px-2 py-1 text-gray-200">RJ</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Lista de Tarefas */}
              <div className="space-y-3 lg:col-span-2">
                <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-1">
                  ✅ Lista de Tarefas
                </h3>
                <div className="bg-gray-900 p-3 rounded text-sm">
                  <div className="text-gray-300 mb-2">Digite:</div>
                  <code className="text-emerald-400">
                    - [x] Tarefa concluída<br/>
                    - [ ] Tarefa pendente<br/>
                    - [ ] Outra tarefa
                  </code>
                  <div className="text-gray-300 mt-3 mb-1">Resultado:</div>
                  <div className="border-l-2 border-sky-500 pl-3 text-gray-200">
                    <div className="space-y-1">
                      <div>
                        <input type="checkbox" checked disabled className="mr-2 accent-sky-500" />
                        Tarefa concluída
                      </div>
                      <div>
                      <input type="checkbox" disabled className="mr-2 accent-sky-500" />
                      Tarefa pendente
                      </div>
                    <div>
                      <input type="checkbox" disabled className="mr-2 accent-sky-500" />
                      Outra tarefa
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Dicas extras */}
          <div className="mt-6 p-4 bg-blue-900/30 rounded border border-blue-500/30">
            <h4 className="text-blue-300 font-semibold mb-2">💡 Dicas:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Use linhas vazias para separar parágrafos</li>
              <li>• Para quebra de linha simples, termine a linha com dois espaços</li>
              <li>• Use `---` sozinho numa linha para criar uma linha horizontal</li>
              <li>• Você pode combinar formatações: `**_negrito e itálico_**`</li>
            </ul>
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-4 border-t border-gray-700 text-center">
          <button
            onClick={() => setShowHelp(false)}
            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded transition"
          >
            Entendi
          </button>
        </div>
    </div>
  </div>
)}
    </div>
  );
}