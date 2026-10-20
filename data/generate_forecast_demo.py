"""Produce clearly synthetic monthly history for checking forecast integration."""
import csv
from pathlib import Path

base = Path(__file__).resolve().parent
rows = []
for month_index in range(48):
    year = 2022 + month_index // 12
    month = month_index % 12 + 1
    value = 100 + month_index * 1.2 + (month_index % 12) * 0.5
    rows.append({"entity_name": "DemoCo (synthetic)", "field_name": "revenue_ttm", "observation_date": f"{year}-{month:02d}-01", "value": f"{value:.2f}"})
with (base / "synthetic_forecast_history.csv").open("w", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
    writer.writeheader(); writer.writerows(rows)
with (base / "synthetic_forecast_incoming.csv").open("w", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=["entry_id", "entity_name", "field_name", "entered_value", "entry_date"])
    writer.writeheader(); writer.writerow({"entry_id": "DEMO-1", "entity_name": "DemoCo (synthetic)", "field_name": "revenue_ttm", "entered_value": "250", "entry_date": "2026-01-01"})
