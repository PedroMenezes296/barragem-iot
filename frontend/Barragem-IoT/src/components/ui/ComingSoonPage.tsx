/* Tela provisória para Meteorologia e Alertas. */
import Card from "@/components/ui/Card";

export default function EmBreve({ nome }: { nome: "Meteorologia" | "Alertas" }) {
  const rota = nome === "Alertas" ? "alertas" : "meteorologia";
  return (
    <>
      <h2 className="t">{nome}</h2>
      <Card>
        <p className="note" style={{ margin: 0 }}>Tela prevista para a próxima etapa (GET /{rota}).</p>
      </Card>
    </>
  );
}
