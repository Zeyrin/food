/**
 * Numéro de semaine ISO 8601 : la semaine 1 est celle qui contient le
 * premier jeudi de l'année. On se déplace sur le jeudi de la semaine
 * courante, puis on compte les jeudis depuis le 1er janvier.
 */
export function numeroSemaine(date = new Date()): number {
  const jeudi = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  jeudi.setUTCDate(jeudi.getUTCDate() + 4 - (jeudi.getUTCDay() || 7))
  const premierJanvier = Date.UTC(jeudi.getUTCFullYear(), 0, 1)
  return Math.ceil(((jeudi.getTime() - premierJanvier) / 86400000 + 1) / 7)
}
