export function getCurrentShopifyVersion(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  // Determine quarter
  let quarter: string;
  if (month <= 3) quarter = "01";
  else if (month <= 6) quarter = "04";
  else if (month <= 9) quarter = "07";
  else quarter = "10";

  const predicted = `${year}-${quarter}`;

  // More precise version range: current year -1 to current year +1
  const knownVersions: string[] = [];
  for (let y = year - 1; y <= year + 1; y++) {
    ["01", "04", "07", "10"].forEach((q) => knownVersions.push(`${y}-${q}`));
  }

  //Sort to ensure latest version is last
  knownVersions.sort();

  //Better fallback: use the latest known version that's <= predicted
  if (!knownVersions.includes(predicted)) {
    const validVersions = knownVersions.filter(v => v <= predicted);
    return validVersions.length > 0 ? validVersions[validVersions.length - 1] : knownVersions[knownVersions.length - 1];
  }

  return predicted;
}