import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { chatbotService } from "../../../services/api";

const MAX_QUESTION = 500;

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ from: "bot" | "user"; text: string }>>([
    {
      from: "bot",
      text: "Hola. Puedo ayudarte con horarios, contacto y consultas generales sobre Automotora Pamahe.",
    },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const q = text.trim().slice(0, MAX_QUESTION);
    if (!q || busy) return;
    setMessages((m) => [...m, { from: "user", text: q }]);
    setText("");
    setBusy(true);
    try {
      const r = await chatbotService.ask(q);
      const answer = typeof r === "string" ? r : (r.respuesta ?? "No pude responder esa consulta.");
      setMessages((m) => [...m, { from: "bot", text: answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "No pude conectarme con el asistente. Podés contactarnos directamente por WhatsApp o teléfono." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chatbot">
      {open && (
        <section className="chatbot__panel" aria-label="Asistente de Pamahe" role="dialog">
          <header>
            <span><Bot />Asistente Pamahe</span>
            <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Cerrar asistente"><X /></button>
          </header>
          <div className="chatbot__privacy">
            No envíes cédulas, contraseñas, datos bancarios ni información sensible. <Link to="/privacidad">Privacidad</Link>
          </div>
          <div className="chatbot__messages" aria-live="polite">
            {messages.map((m, i) => <div className={`chat-msg chat-msg--${m.from}`} key={`${m.from}-${i}`}>{m.text}</div>)}
            {busy && <div className="chat-msg chat-msg--bot">Escribiendo…</div>}
          </div>
          <form onSubmit={send}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribí tu consulta"
              aria-label="Consulta"
              maxLength={MAX_QUESTION}
              autoComplete="off"
            />
            <button className="icon-button" aria-label="Enviar" disabled={busy || !text.trim()}><Send /></button>
          </form>
        </section>
      )}
      <button
        className="chatbot__toggle"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        aria-expanded={open}
      >
        <MessageCircle />
      </button>
    </div>
  );
}
