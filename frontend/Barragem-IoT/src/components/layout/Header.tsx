import DeviceSelector from "@/components/ui/DeviceSelector";

export default function Header({ page }: { page: string }) {
  return <header className="app-header"><h1>{page}</h1><DeviceSelector ariaLabel="Dispositivo" defaultValue="arduino-mega-01" /><span className="sp" /><span className="st neutral">Não verificado</span><span className="badge">DADOS SIMULADOS</span></header>;
}
