import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import type { ActiveAlert } from "@/types/leituras";

export default function ActiveAlertsCard({ alerts = [] }: { alerts?: ActiveAlert[] }) {
  return <Card><h3><span>Alertas ativos</span><StatusBadge variant={alerts.length ? "bad" : "off"}>{alerts.length}</StatusBadge></h3>
    {alerts.length ? <div className="empty">{alerts.map((alert) => <p className="note" key={alert.id}>{alert.message}</p>)}</div> : <EmptyState><StatusBadge variant="ok">Sem ocorrências</StatusBadge><p className="note" style={{ margin: 0 }}>Nenhum alerta registrado. Não há ocorrências para este dispositivo.</p></EmptyState>}
  </Card>;
}
