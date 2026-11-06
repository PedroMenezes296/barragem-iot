import Card from "@/components/ui/Card";
import { formatNumber } from "@/utils/formatters";

export default function DistanceCard({ value }: { value: number | null | undefined }) {
  return <Card><h3><span>Distância sensor → água</span></h3><div className="big">{formatNumber(value)}<small>cm</small></div><p className="note">Não é o nível da água. Mede o espaço entre o sensor e a superfície.</p></Card>;
}
