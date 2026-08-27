import { useState, type FormEvent } from "react";
import { useScope } from "../contexts/ScopeContext";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { getErrorMessage } from "../services/api";

export function ScopeSwitch() {
  const { scope, familyGroupId, familyGroupName, setPersonal, setFamily } = useScope();
  const { user, refreshUser } = useAuth();
  const [manageOpen, setManageOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const memberships = user?.memberships || [];

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const group = await authService.createFamilyGroup(groupName);
      await refreshUser();
      setFamily(group.id);
      setGroupName("");
      setManageOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível criar o grupo."));
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinGroup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const group = await authService.joinFamilyGroup(inviteCode);
      await refreshUser();
      setFamily(group.id);
      setInviteCode("");
      setManageOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, "Código de convite inválido."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="scope-switch">
        <button
          type="button"
          className={`scope-pill ${scope === "PERSONAL" ? "scope-pill-active" : ""}`}
          onClick={setPersonal}
        >
          Pessoal
        </button>
        {memberships.map((m) => (
          <button
            key={m.familyGroupId}
            type="button"
            className={`scope-pill ${scope === "FAMILY" && familyGroupId === m.familyGroupId ? "scope-pill-active" : ""}`}
            onClick={() => setFamily(m.familyGroupId)}
          >
            {m.familyGroup.name}
          </button>
        ))}
        <button type="button" className="scope-pill scope-pill-add" onClick={() => setManageOpen(true)}>
          + Família
        </button>
      </div>

      <Modal open={manageOpen} title="Perfil família" onClose={() => setManageOpen(false)}>
        {familyGroupName && scope === "FAMILY" && (
          <p className="hint-block">
            Convide alguém para "{familyGroupName}" compartilhando o código de convite (visível em Configurações).
          </p>
        )}
        <form onSubmit={handleCreateGroup} className="stack-form">
          <h3 className="form-subheading">Criar um novo grupo familiar</h3>
          <Input
            label="Nome do grupo"
            placeholder="Ex.: Família Silva"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy}>
            Criar grupo
          </Button>
        </form>

        <div className="form-divider" />

        <form onSubmit={handleJoinGroup} className="stack-form">
          <h3 className="form-subheading">Entrar em um grupo existente</h3>
          <Input
            label="Código de convite"
            placeholder="Cole o código recebido"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
          <Button type="submit" variant="secondary" disabled={busy}>
            Entrar no grupo
          </Button>
        </form>

        {error && <p className="field-error">{error}</p>}
      </Modal>
    </>
  );
}
