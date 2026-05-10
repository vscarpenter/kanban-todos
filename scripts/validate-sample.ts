import { readFileSync } from 'fs';
import { validateExportData, validateDataRelationships } from '../src/lib/utils/validation';
import { deserializeTask, deserializeBoard } from '../src/lib/utils/exportImport/serialize';
import { logger } from '../src/lib/utils/logger';

const file = process.argv[2] ?? 'sample-export.json';
const data = JSON.parse(readFileSync(file, 'utf-8'));

const schema = validateExportData(data);
const rel = validateDataRelationships(data);

logger.info('Schema validation results', { isValid: schema.isValid, errors: schema.errors.length, warnings: schema.warnings.length });
logger.info('Relationships validation results', { isValid: rel.isValid, errors: rel.errors.length, warnings: rel.warnings.length });

let deserializeErrors = 0;
for (const t of data.tasks) {
  try { deserializeTask(t); } catch (e) { deserializeErrors++; logger.error('Task deserialization failed', { taskId: t.id, error: e }); }
}
for (const b of data.boards) {
  try { deserializeBoard(b); } catch (e) { deserializeErrors++; logger.error('Board deserialization failed', { boardId: b.id, error: e }); }
}

if (deserializeErrors > 0) {
  logger.warn('Deserialization errors detected', { count: deserializeErrors });
} else {
  logger.info('All items deserialized successfully');
}
