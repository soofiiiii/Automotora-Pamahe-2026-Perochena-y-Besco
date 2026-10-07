import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => toggleRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => inputRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const question = text.trim().slice(0, MAX_QUESTION);
    if (!question || busy) return;

    setMessages((current) => [...current, { from: "user", text: question }]);
    setText("");
    setBusy(true);

    try {
      const response = await chatbotService.ask(question);
      const answer =
        typeof response === "string"
          ? response
          : (response.respuesta ?? "No pude responder esa consulta.");
      setMessages((current) => [...current, { from: "bot", text: answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text: "No pude conectarme con el asistente. Podés contactarnos directamente por WhatsApp o teléfono.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chatbot">
      {open && (
        <section
          id="chatbot-panel"
          className="chatbot__panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="chatbot-title"
        >
          <header>
            <span id="chatbot-title">
              <Bot aria-hidden="true" />
              Asistente Pamahe
            </span>
            <button
              className="icon-button"
              type="button"
              onClick={() => close(true)}
              aria-label="Cerrar asistente"
            >
              <X aria-hidden="true" />
            </button>
          </header>
          <div className="chatbot__privacy">
            No envíes cédulas, contraseñas, datos bancarios ni información sensible.{" "}
            <Link to="/privacidad">Privacidad</Link>
          </div>
          <div
            className="chatbot__messages"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Conversación con el asistente"
          >
            {messages.map((message, index) => (
              <div
                className={`chat-msg chat-msg--${message.from}`}
                key={`${message.from}-${index}`}
              >
                {message.text}
              </div>
            ))}
            {busy && (
              <div className="chat-msg chat-msg--bot" aria-label="El asistente está escribiendo">
                Escribiendo…
              </div>
            )}
          </div>
          <form onSubmit={send}>
            <label className="sr-only" htmlFor="chatbot-question">
              Consulta
            </label>
            <input
              ref={inputRef}
              id="chatbot-question"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Escribí tu consulta"
              maxLength={MAX_QUESTION}
              autoComplete="off"
            />
            <button
              type="submit"
              className="icon-button"
              aria-label="Enviar consulta"
              disabled={busy || !text.trim()}
            >
              <Send aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
      <button
        ref={toggleRef}
        className="chatbot__toggle"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        aria-expanded={open}
        aria-controls="chatbot-panel"
      >
        <MessageCircle aria-hidden="true" />
      </button>
    </div>
  );
}
