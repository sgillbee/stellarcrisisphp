# Table: `words`

Source DDL: [sc.sql](sc.sql#L548-L800)

## Purpose

Dictionary of words/names used by the application for procedural name generation (systems, cities, fleets, etc.). Populated with thousands of short words used by `nameFleet()` and other random-name utilities.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `word` varchar(60) NOT NULL DEFAULT '' — The word entry.

## Data notes

- The dump contains ~3,200+ rows (seed data inserted in `sc.sql`). Do not duplicate full data in the spec — reference the seed data in the repository.

## Application mappings

- Used by name-generation functions such as `nameFleet()` and the map generator in `game/makemap.php`.
- Also referenced by `utility/cities.txt` and `utility/builddict.php` for name lists.

## Notes

- This table is read-only at runtime for name selection; no application code writes new rows during typical gameplay.
