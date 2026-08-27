import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { getErrorMessage } from "../services/api";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível entrar. Confira seu email e senha."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="sidebar-brand-mark">₡</span>
          <h1>Razão</h1>
        </div>
        <p className="auth-subtitle">Controle financeiro pessoal e familiar.</p>

        <form onSubmit={handleSubmit} className="stack-form">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="field-error">{error}</p>}
          <Button type="submit" disabled={busy} className="auth-submit">
            {busy ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="auth-footer">
          Ainda não tem conta? <Link to="/registro">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
