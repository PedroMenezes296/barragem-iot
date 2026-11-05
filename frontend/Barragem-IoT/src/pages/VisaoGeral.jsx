import { ChartCard, SERIES_NIVEL } from "../components/Chart";
import { TODAS, AGORA, fmt, hhmm, dmy } from "../data/leituras";

export default function VisaoGeral() {
  const u = TODAS[0];
  const ultimas = TODAS.slice(0, 7);
  const min = Math.round((AGORA - u.t) / 60000);
  return (
    <>
      <div>
        <h2 className="t">Estado atual do reservatório</h2>
        <p className="lead">Nível da água, umidade e condição do sistema em uma única tela.</p>
      </div>

      <div className="grid two">
        <section className="card">
          <h3><span>Estado do sistema</span><span className="pill ok">Atualizado</span></h3>
          <div className="mid">Última leitura há {min} min</div>
          <p className="note">Recebimento a cada 15 minutos.</p>
        </section>
        <section className="card">
          <h3><span>Última leitura</span></h3>
          <div className="mid">{hhmm(u.t)}:00 <small>{dmy(u.t)}</small></div>
          <p className="note">arduino-mega-01 · Brasília (UTC−3)</p>
        </section>
      </div>

      <div className="grid">
        <section className="card">
          <h3><span>Distância sensor → água</span></h3>
          <div className="big">{fmt(u.dist)}<small>cm</small></div>
          <p className="note">Não é o nível da água. Mede o espaço entre o sensor e a superfície.</p>
        </section>
        <section className="card">
          <h3><span>Nível da água</span></h3>
          <div className="row"><span className="big" style={{ color: "var(--acc)" }}>{fmt(u.ult)}<small>cm</small></span><span className="lab">Ultrassônico</span></div>
          <div className="row" style={{ marginTop: 6 }}><span className="mid">{fmt(u.res)}<small>cm</small></span><span className="lab">Resistivo</span></div>
          <p className="note">Referência calibrada: fundo do reservatório.</p>
        </section>
        <section className="card">
          <h3><span>Umidade do ar</span></h3>
          <div className="big" style={{ color: "var(--hum)" }}>{u.um}<small>%</small></div>
          <p className="note">Condição do ar junto ao reservatório. Sensor ambiental DHT.</p>
        </section>
      </div>

      <div className="chartrow">
        <ChartCard title="Últimas leituras" unit="Nível · cm" rows={ultimas} series={SERIES_NIVEL} color="var(--acc)"
          noteExtra="13:00–14:30 · Intervalos sem leitura aparecem como lacunas." />
        <section className="card">
          <h3><span>Alertas ativos</span><span className="pill off">0</span></h3>
          <div className="empty">
            <span className="pill ok">Sem ocorrências</span>
            <p className="note" style={{ margin: 0 }}>Nenhum alerta registrado. Não há ocorrências para este dispositivo.</p>
          </div>
        </section>
      </div>

      <section className="card">
        <h3><span>Guia de estados · exemplos, não dados atuais</span></h3>
        <div className="chips">
          <span className="pill warn">Desatualizado</span><span className="lab">Leitura há mais de 30 min</span>
          <span className="pill off">Sem dados</span><span className="lab">Nenhuma leitura</span>
          <span className="pill bad">API fora do ar</span>
        </div>
        <p className="note">Exemplo de calibração · 04/11 às 13:30 · Resistivo: Não calibrado. A distância de 49,4 cm permanece válida; o nível não é convertido para zero.</p>
      </section>
    </>
  );
}
