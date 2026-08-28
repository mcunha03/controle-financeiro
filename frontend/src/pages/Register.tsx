import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { getErrorMessage } from "../services/api";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível criar sua conta."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="sidebar-brand-mark">$</span>
          <h1>Controle Financeiro</h1>
        </div>
        <p className="auth-subtitle">Crie sua conta para começar a organizar suas finanças.</p>

        <form onSubmit={handleSubmit} className="stack-form">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            hint="Mínimo de 6 caracteres."
          />
          {error && <p className="field-error">{error}</p>}
          <Button type="submit" disabled={busy} className="auth-submit">
            {busy ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="auth-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
