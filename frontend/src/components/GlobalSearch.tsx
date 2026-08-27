import { useEffect, useRef, useState } from "react";
import { useScope } from "../contexts/ScopeContext";
import { searchService, type SearchResults } from "../services/dashboardService";
import { formatCurrency, formatDate } from "../utils/format";

export function GlobalSearch() {
  const { scope, familyGroupId } = useScope();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(() => {
      searchService.search({ scope, familyGroupId }, query.trim()).then((data) => {
        setResults(data);
        setOpen(true);
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, scope, familyGroupId]);

  const hasResults =
    results && (results.movements.length || results.wallets.length || results.cards.length || results.investments.length);

  return (
    <div className="global-search" ref={containerRef}>
      <input
        type="search"
        placeholder="Buscar movimentações, carteiras, cartões..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        className="global-search-input"
      />
      {open && query.trim().length >= 2 && (
        <div className="global-search-results">
          {!hasResults && <p className="global-search-empty">Nenhum resultado para "{query}".</p>}
          {results?.movements && results.movements.length > 0 && (
            <div className="global-search-group">
              <span className="global-search-group-title">Movimentações</span>
              {results.movements.slice(0, 5).map((m) => (
                <div key={m.id} className="global-search-item">
                  <span>{m.description}</span>
                  <span className={m.type === "EXPENSE" ? "amount-negative" : "amount-positive"}>
                    {formatCurrency(m.amount)}
                  </span>
                  <span className="global-search-date">{formatDate(m.date)}</span>
                </div>
              ))}
            </div>
          )}
          {results?.wallets && results.wallets.length > 0 && (
            <div className="global-search-group">
              <span className="global-search-group-title">Carteiras</span>
              {results.wallets.map((w) => (
                <div key={w.id} className="global-search-item">
                  <span>{w.name}</span>
                  <span>{formatCurrency(w.balance)}</span>
                </div>
              ))}
            </div>
          )}
          {results?.cards && results.cards.length > 0 && (
            <div className="global-search-group">
              <span className="global-search-group-title">Cartões</span>
              {results.cards.map((c) => (
                <div key={c.id} className="global-search-item">
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          )}
          {results?.investments && results.investments.length > 0 && (
            <div className="global-search-group">
              <span className="global-search-group-title">Investimentos</span>
              {results.investments.map((i) => (
                <div key={i.id} className="global-search-item">
                  <span>{i.name}</span>
                  <span>{formatCurrency(i.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
