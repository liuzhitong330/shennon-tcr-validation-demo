(function () {
  "use strict";

  const data = window.SHENNON_DEMO_DATA;
  const $ = (id) => document.getElementById(id);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const formatMillions = (value) => `${value < 0.1 ? value.toFixed(2) : value.toFixed(1)} M`;
  const log10 = (value) => Math.log(value) / Math.LN10;

  function updateBatch() {
    const cells = clamp($("cell-count").value, 0, 999);
    const viability = clamp($("viability").value, 0, 100);
    const tcr = clamp($("tcr-positive").value, 0, 100);
    const background = clamp($("background").value, 0, 100);
    const t = data.batchThresholds;
    const gates = [
      { name: "viability", pass: viability >= t.viabilityPct },
      { name: "TCR-positive fraction", pass: tcr >= t.tcrPositivePct },
      { name: "untransduced background", pass: background <= t.maxBackgroundPct }
    ];
    const failed = gates.filter((gate) => !gate.pass);
    const qualified = cells * (viability / 100) * (tcr / 100);
    const isPass = failed.length === 0;

    $("qualified-cells").textContent = `${qualified.toFixed(2)} M`;
    $("gates-passed").textContent = `${gates.length - failed.length} / ${gates.length}`;
    $("limiting-gate").textContent = isPass ? "None" : failed[0].name;
    $("batch-status").textContent = isPass ? "Ready for functional assay" : "Hold before functional assay";
    $("batch-badge").textContent = isPass ? "Pass" : "Hold";
    $("batch-badge").className = `status-badge ${isPass ? "pass" : "hold"}`;

    if (isPass) {
      $("batch-action").textContent = "Proceed while carrying an untransduced control into every target condition.";
    } else if (tcr < t.tcrPositivePct) {
      $("batch-action").textContent = "Check vector preparation, transduction conditions, and flow gating before using this batch in a large donor panel.";
    } else if (background > t.maxBackgroundPct) {
      $("batch-action").textContent = "Resolve baseline activation or culture stress before attributing a signal to the introduced TCR.";
    } else {
      $("batch-action").textContent = "Recover viability and recount the culture before committing cells to the functional assay.";
    }
    updateAssay();
  }

  function sliderToEc50(value) {
    return Math.pow(10, Number(value) / 100);
  }

  function formatDose(value) {
    if (value < 1) return `${value.toFixed(2)} nM`;
    if (value < 10) return `${value.toFixed(1)} nM`;
    return `${Math.round(value).toLocaleString()} nM`;
  }

  function makeSeries(points, low, high) {
    const step = (Math.log(high) - Math.log(low)) / (points - 1);
    return Array.from({ length: points }, (_, index) => Math.exp(Math.log(low) + index * step));
  }

  function updateDose() {
    const ec50 = sliderToEc50($("ec50-slider").value);
    const points = clamp($("point-slider").value, 8, 12);
    const low = 0.1;
    const high = 5000;
    const series = makeSeries(points, low, high);
    $("ec50-output").textContent = formatDose(ec50);
    $("point-output").textContent = String(points);
    $("dose-list").innerHTML = series.map((dose) => `<span>${formatDose(dose)}</span>`).join("");
    $("series-note").textContent = `The ${points}-point series spans 0.1–5,000 nM, bracketing both edges of the published 1–500 nM EC50 interval by tenfold.`;
    drawDoseChart(ec50, series);
    updateAssay();
  }

  function drawDoseChart(ec50, series) {
    const svg = $("dose-chart");
    const width = 680;
    const height = 330;
    const margin = { top: 24, right: 18, bottom: 52, left: 52 };
    const xMin = -1;
    const xMax = log10(5000);
    const x = (dose) => margin.left + ((log10(dose) - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);
    const y = (response) => margin.top + (1 - response / 100) * (height - margin.top - margin.bottom);
    const logistic = (dose) => 100 / (1 + Math.pow(ec50 / dose, 1.15));
    const curveDoses = makeSeries(140, 0.1, 5000);
    const path = curveDoses.map((dose, index) => `${index ? "L" : "M"}${x(dose).toFixed(2)},${y(logistic(dose)).toFixed(2)}`).join(" ");
    const xTicks = [0.1, 1, 10, 100, 1000, 5000];
    const yTicks = [0, 25, 50, 75, 100];
    const plotBottom = height - margin.bottom;
    const rangeX = x(data.reportedEc50Nm.min);
    const rangeWidth = x(data.reportedEc50Nm.max) - rangeX;

    svg.innerHTML = `
      <title id="dose-chart-title">Illustrative CD69 dose-response curve at ${formatDose(ec50)}</title>
      <desc id="dose-chart-desc">A logistic curve shown against a shaded one to five hundred nanomolar published EC50 interval.</desc>
      <rect x="${rangeX}" y="${margin.top}" width="${rangeWidth}" height="${plotBottom - margin.top}" fill="#dfece9" opacity="0.72"></rect>
      ${yTicks.map((tick) => `<line x1="${margin.left}" x2="${width - margin.right}" y1="${y(tick)}" y2="${y(tick)}" stroke="#deded8" stroke-width="1"></line><text x="${margin.left - 10}" y="${y(tick) + 4}" text-anchor="end" font-family="Arial, sans-serif" font-size="11" fill="#6b6b67">${tick}</text>`).join("")}
      ${xTicks.map((tick) => `<line x1="${x(tick)}" x2="${x(tick)}" y1="${plotBottom}" y2="${plotBottom + 5}" stroke="#777" stroke-width="1"></line><text x="${x(tick)}" y="${plotBottom + 22}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#6b6b67">${tick >= 1000 ? `${tick / 1000}k` : tick}</text>`).join("")}
      <line x1="${margin.left}" x2="${width - margin.right}" y1="${plotBottom}" y2="${plotBottom}" stroke="#777" stroke-width="1"></line>
      <line x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${plotBottom}" stroke="#777" stroke-width="1"></line>
      <path d="${path}" fill="none" stroke="#1d7068" stroke-width="3"></path>
      <line x1="${x(ec50)}" x2="${x(ec50)}" y1="${y(50)}" y2="${plotBottom}" stroke="#1d1d1b" stroke-width="1" stroke-dasharray="4 4"></line>
      <circle cx="${x(ec50)}" cy="${y(50)}" r="5" fill="#1d1d1b"></circle>
      ${series.map((dose) => `<circle cx="${x(dose)}" cy="${y(logistic(dose))}" r="3" fill="#fff" stroke="#1d7068" stroke-width="1.5"></circle>`).join("")}
      <text x="${(rangeX + rangeWidth / 2).toFixed(1)}" y="${margin.top + 16}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#1d7068">reported EC50 window</text>
      <text x="${(margin.left + width - margin.right) / 2}" y="${height - 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#3d3d39">peptide concentration (nM, log scale)</text>
      <text transform="translate(14 ${(margin.top + plotBottom) / 2}) rotate(-90)" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#3d3d39">normalized CD69 response (%)</text>
    `;
  }

  function updateAssay() {
    const donors = clamp($("donors").value, 1, 8);
    const candidates = clamp($("candidates").value, 1, 12);
    const replicates = clamp($("replicates").value, 1, 4);
    const effectors = clamp($("effectors").value, 5000, 100000);
    const targets = document.querySelectorAll(".target-context:checked").length;
    const points = clamp($("point-slider").value, 8, 12);
    const wells = donors * candidates * replicates * targets * points;
    const plates = Math.ceil(wells / 96);
    const effectorTotalM = wells * effectors / 1000000;
    const cells = clamp($("cell-count").value, 0, 999);
    const viability = clamp($("viability").value, 0, 100);
    const tcr = clamp($("tcr-positive").value, 0, 100);
    const qualifiedM = cells * viability / 100 * tcr / 100;
    const coverage = effectorTotalM > 0 ? qualifiedM / effectorTotalM * 100 : 0;

    $("well-count").textContent = wells.toLocaleString();
    $("plate-count").textContent = plates.toLocaleString();
    $("effector-total").textContent = formatMillions(effectorTotalM);
    $("cell-coverage").textContent = `${coverage.toFixed(1)}%`;

    const antigenControl = document.querySelector('[value="antigen-negative"]').checked;
    const hlaControl = document.querySelector('[value="hla-negative"]').checked;
    let interpretation = `This design can test ${donors} donor${donors === 1 ? "" : "s"} and ${candidates} candidate${candidates === 1 ? "" : "s"} across ${points} peptide concentrations.`;
    if (antigenControl && hlaControl) interpretation += " It can separately test antigen dependence and HLA restriction.";
    else if (!antigenControl && !hlaControl) interpretation += " Add antigen-negative and HLA-negative targets before making a specificity claim.";
    else interpretation += ` Add the missing ${antigenControl ? "HLA-negative" : "antigen-negative"} target to complete the specificity test.`;
    if (coverage < 100) interpretation += ` The current qualified batch covers only ${coverage.toFixed(1)}% of the calculated effector-cell need; reduce scope or expand cells first.`;
    else interpretation += " The current batch covers the calculated effector-cell requirement.";
    $("assay-interpretation").textContent = interpretation;
  }

  document.querySelectorAll("input").forEach((input) => input.addEventListener("input", () => {
    if (input.id === "ec50-slider" || input.id === "point-slider") updateDose();
    else if (input.classList.contains("target-context") || ["donors", "candidates", "replicates", "effectors"].includes(input.id)) updateAssay();
    else updateBatch();
  }));

  document.querySelectorAll("[data-batch-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = data.batchPresets[button.dataset.batchPreset];
      $("cell-count").value = preset.cells;
      $("viability").value = preset.viability;
      $("tcr-positive").value = preset.tcr;
      $("background").value = preset.background;
      document.querySelectorAll("[data-batch-preset]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      updateBatch();
    });
  });

  updateBatch();
  updateDose();
})();
