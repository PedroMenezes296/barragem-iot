import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

export default function StateGuideCard() {
  return <Card><h3><span>Guia de estados · exemplos, não dados atuais</span></h3><div className="chips"><StatusBadge variant="ok">Atualizado</StatusBadge><span className="lab">Leitura recente</span><StatusBadge variant="warn">Desatualizado</StatusBadge><span className="lab">Leitura há mais de 30 min</span><StatusBadge variant="off">Sem dados</StatusBadge><span className="lab">Nenhuma leitura</span><StatusBadge variant="bad">API fora do ar</StatusBadge></div><p className="note">Exemplo de calibração · 04/11 às 13:30 · Resistivo: Não calibrado. A distância de 49,4 cm permanece válida; o nível não é convertido para zero.</p></Card>;
}
