/* Tela provisória para Meteorologia e Alertas. */
export default function EmBreve({ nome }) {
  const rota = nome === "Alertas" ? "alertas" : "previsoes-tempo";
  return (
    <>
      <h2 className="t">{nome}</h2>
      <section className="card">
        <p className="note" style={{ margin: 0 }}>Tela prevista para a próxima etapa (GET /{rota}).</p>
      </section>
    </>
  );
}
