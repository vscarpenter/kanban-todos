import { readFileSync } from 'fs';
import { validateExportData, validateDataRelationships } from '../src/lib/utils/validation';
import { deserializeTask, deserializeBoard } from '../src/lib/utils/exportImport/serialize';

const file = process.argv[2] ?? 'sample-export.json';
const data = JSON.parse(readFileSync(file, 'utf-8'));

const schema = validateExportData(data);
const rel = validateDataRelationships(data);

console.log('Schema valid:', schema.isValid, '| errors:', schema.errors.length, '| warnings:', schema.warnings.length);
console.log('Relationships valid:', rel.isValid, '| errors:', rel.errors.length, '| warnings:', rel.warnings.length);

let deserializeErrors = 0;
for (const t of data.tasks) {
  try { deserializeTask(t); } catch (e) { deserializeErrors++; console.log('task', t.id, e); }
}
for (const b of data.boards) {
  try { deserializeBoard(b); } catch (e) { deserializeErrors++; console.log('board', b.id, e); }
}
console.log('Deserialize errors:', deserializeErrors);
