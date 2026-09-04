import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="container" style={{ padding: "80px 0" }}>
      <div className="state-card">
        <h1>404</h1>
        <p>No encontramos esta página.</p>
        <Link className="button" to="/">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}