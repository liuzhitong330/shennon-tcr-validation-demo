window.SHENNON_DEMO_DATA = {
  reportedEc50Nm: { min: 1, max: 500 },
  epitope: {
    gene: "MAGE-A1",
    positions: "96–104",
    sequence: "SLFRAVITK",
    restriction: "HLA-A*03:01"
  },
  batchThresholds: {
    viabilityPct: 80,
    tcrPositivePct: 40,
    maxBackgroundPct: 10
  },
  batchPresets: {
    clean: { cells: 2.4, viability: 91, tcr: 63, background: 3 },
    "low-transduction": { cells: 2.4, viability: 89, tcr: 24, background: 4 },
    "high-background": { cells: 2.4, viability: 92, tcr: 61, background: 19 }
  },
  sources: [
    {
      label: "ShennonBio MAGE-A1 TCR abstract",
      url: "https://jitc.bmj.com/content/13/Suppl_2/A383",
      facts: [
        "MAGE-A1 96–104:HLA-A*03:01",
        "Jurkat CD69 EC50 range 1–500 nM",
        "primary T cells from multiple healthy donors",
        "CD137, CD69, CD25, IFNγ, IL-2 and target-cell lysis",
        "no response without MAGE-A1 or HLA-A*03:01"
      ]
    },
    {
      label: "Cancer Antigenic Peptide Database",
      url: "https://caped.icp.ucl.ac.be/Peptide/list",
      facts: ["SLFRAVITK", "MAGE-A1 positions 96–104", "HLA-A3 restriction"]
    }
  ]
};
