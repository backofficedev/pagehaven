function getProtocolFromStage(stage: string) {
  return stage === "dev" ? "http" : "https";
}

export function addProtocolFromStage(stage: string, url: string) {
  return `${getProtocolFromStage(stage)}://${url}`;
}
