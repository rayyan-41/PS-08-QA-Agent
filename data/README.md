# Data

## `ps08_data_entries.csv`

The sample dataset provided with problem statement PS-08. It has 300 rows, one per data entry made by an analyst, and 14 columns.

| Column | Type | Notes |
|---|---|---|
| `entry_id` | string | Unique key, `ENT-00001` to `ENT-00300` |
| `analyst_id` | string | `ANA-xxx`, 99 distinct analysts |
| `entity_name` | string | Company the entry is about, 8 distinct values |
| `field_name` | string | One of 10 fields: `revenue_ttm`, `net_income`, `eps`, `market_cap`, `total_assets`, `operating_margin`, `debt_equity_ratio`, `dividend_yield`, `acquisition_date`, `completion_status` |
| `entered_value` | float | The value the analyst entered (range in file: about -413 to 49,893) |
| `expected_range_min` | float | Lower bound of the expected range for this entry |
| `expected_range_max` | float | Upper bound of the expected range for this entry |
| `previous_value` | float | Prior value for the same field |
| `entry_date` | date | `YYYY-MM-DD`, from 2026-01-02 to 2026-09-28 |
| `status_at_entry` | string | `Draft`, `Submitted`, `Approved`, `Rejected` |
| `has_supporting_doc` | bool | `True` / `False` |
| `error_type` | string | Label. `None` (223 rows) or one of 7 error types, see below |
| `was_rejected` | bool | `True` exactly when `error_type` is not `None` (77 rows) |
| `rejection_reason` | string | Empty when not rejected, otherwise identical to `error_type` |

### Error type counts

| `error_type` | Rows |
|---|---|
| None | 223 |
| Duplicate Entry | 17 |
| Format Error | 12 |
| Logical Inconsistency | 12 |
| Range Violation | 11 |
| Stale Data | 10 |
| Missing Document | 8 |
| Date Conflict | 7 |

## Things to know before building on this data

- **`None` is a string, not a missing value.** pandas turns it into `NaN` by default. Read with `pd.read_csv(path, keep_default_na=False)` or map it explicitly.
- **The labels do not follow from the columns.** The data looks synthetic, and simple rules do not reproduce `error_type`:
  - 47 rows labelled `None` have `entered_value` outside `[expected_range_min, expected_range_max]`, while 8 of the 11 `Range Violation` rows are inside their range.
  - 6 of the 8 `Missing Document` rows have `has_supporting_doc = True`.
  - Every field, including `acquisition_date` and `completion_status`, stores a plain number in `entered_value`.
- Because of this, a model trained only on these labels will score close to chance. Rule checks (range, missing document, duplicates, date order) and the historical labels will disagree on many rows. Report catch rate and false alarm rate against the labels honestly, and say what each check is based on.
- `rejection_reason` and `was_rejected` are derived from `error_type`. Do not use them as input features when predicting `error_type`, or the evaluation leaks the answer.
