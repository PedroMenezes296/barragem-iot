import type { UpdateAlarmConfigDto } from "@/generated/api/models";
import type { AlarmLimitsDraft } from "@/components/alerts/AlarmLimitsForm";

export function parseAlarmDraft(draft: AlarmLimitsDraft): UpdateAlarmConfigDto {
  const parsed = [draft.reference, draft.dry, draft.attention, draft.flood].map((value) => {
    const text = value.trim();
    if (!/^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(text))
      throw new Error(
        "Preencha a referência e os três níveis com números de até duas casas decimais.",
      );
    return Number(text.replace(",", "."));
  });
  const [distanciaFundoCm, secaCm, atencaoCm, inundacaoCm] = parsed;
  if (!(distanciaFundoCm > 2 && distanciaFundoCm <= 400))
    throw new Error("A distância sensor–fundo deve ser maior que 2 e até 400 cm.");
  const maximum = Number((distanciaFundoCm - 2).toFixed(2));
  const values = [secaCm, atencaoCm, inundacaoCm];
  if (
    values.some(
      (value) => !Number.isFinite(value) || value < 0 || value > maximum,
    )
  )
    throw new Error(
      `Use níveis entre 0 e ${maximum.toLocaleString("pt-BR")} cm.`,
    );
  if (!(secaCm < atencaoCm && atencaoCm < inundacaoCm))
    throw new Error(
      "O nível de seca deve ser menor que o de atenção, e o de atenção deve ser menor que o de inundação.",
    );
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(draft.deviceId.trim()))
    throw new Error("Informe um identificador de dispositivo válido.");
  return {
    idDispositivo: draft.deviceId.trim(),
    ativo: draft.enabled,
    distanciaFundoCm,
    secaCm,
    atencaoCm,
    inundacaoCm,
  };
}
