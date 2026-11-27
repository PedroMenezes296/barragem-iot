import type { UpdateAlarmConfigDto } from "@/generated/api/models";
import type { AlarmLimitsDraft } from "@/components/alerts/AlarmLimitsForm";

export function parseAlarmDraft(draft: AlarmLimitsDraft): UpdateAlarmConfigDto {
  const parsed = [
    draft.reference,
    draft.full,
    draft.dry,
    draft.attention,
    draft.flood,
  ].map((value) => {
    const text = value.trim();
    if (!/^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(text))
      throw new Error(
        "Preencha as referências e os três percentuais com números de até duas casas decimais.",
      );
    return Number(text.replace(",", "."));
  });
  const [distanciaFundoCm, alturaCheioCm, secaPct, atencaoPct, inundacaoPct] =
    parsed;
  if (!(distanciaFundoCm > 2 && distanciaFundoCm <= 400))
    throw new Error(
      "A distância sensor–fundo deve ser maior que 2 e até 400 cm.",
    );
  const maximum = Number((distanciaFundoCm - 2).toFixed(2));
  if (!(alturaCheioCm > 0 && alturaCheioCm <= maximum))
    throw new Error(
      `A altura em 100% deve ser maior que zero e até ${maximum.toLocaleString("pt-BR")} cm.`,
    );
  const values = [secaPct, atencaoPct, inundacaoPct];
  if (
    values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)
  )
    throw new Error("Use limites entre 0 e 100%.");
  if (!(secaPct < atencaoPct && atencaoPct < inundacaoPct))
    throw new Error(
      "O nível de seca deve ser menor que o de atenção, e o de atenção deve ser menor que o de inundação.",
    );
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(draft.deviceId.trim()))
    throw new Error("Informe um identificador de dispositivo válido.");
  return {
    idDispositivo: draft.deviceId.trim(),
    ativo: draft.enabled,
    distanciaFundoCm,
    alturaCheioCm,
    secaPct,
    atencaoPct,
    inundacaoPct,
  };
}

export function convertLegacyLimits(
  full: string,
  limits: { secaCm: number; atencaoCm: number; inundacaoCm: number },
) {
  const height = Number(full.trim().replace(",", "."));
  if (
    !/^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(full.trim()) ||
    !Number.isFinite(height) ||
    height <= 0
  )
    throw new Error("Informe a altura da água em 100% antes de converter.");
  const [dry, attention, flood] = [
    limits.secaCm,
    limits.atencaoCm,
    limits.inundacaoCm,
  ].map(
    (value) =>
      Math.floor(
        (Math.round(value * 100) * 10000 + Math.round(height * 100) / 2) /
          Math.round(height * 100),
      ) / 100,
  );
  if (!(0 <= dry && dry < attention && attention < flood && flood <= 100))
    throw new Error(
      "A conversão não cabe em 0 a 100% ou sobrepõe limites. Revise a altura de 100% ou preencha os percentuais manualmente.",
    );
  return {
    dry: String(dry),
    attention: String(attention),
    flood: String(flood),
  };
}
