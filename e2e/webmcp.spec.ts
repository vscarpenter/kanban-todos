import { test, expect, taskCard, column, type Page } from './fixtures';

/**
 * Real-browser smoke test for the WebMCP tool layer. Opt in with
 * WEBMCP_E2E=1 and run the "webmcp" Playwright project, which launches the
 * installed Chrome with the WebMCP feature enabled:
 *
 *   WEBMCP_E2E=1 bunx playwright test --project=webmcp
 *
 * The default chromium project ignores this file, so `bun run test:e2e`
 * stays green on machines without a WebMCP-capable browser.
 */

const EXPECTED_TOOLS = [
  'cascade_create_task',
  'cascade_delete_task',
  'cascade_get_board',
  'cascade_get_task',
  'cascade_list_boards',
  'cascade_list_tasks',
  'cascade_move_task',
  'cascade_update_task',
];

interface ToolResult {
  ok: boolean;
  changed?: boolean;
  task: { id: string; status: string };
}

// Calls a registered tool the way a bridge does: getTools, then executeTool
// with a JSON string, which is what Chrome 152 accepts.
async function callTool(page: Page, name: string, args: Record<string, unknown>): Promise<ToolResult> {
  return page.evaluate(
    async ({ name, args }) => {
      const modelContext = document.modelContext;
      if (!modelContext) throw new Error('document.modelContext is undefined; enable WebMCP in this browser');
      const tool = (await modelContext.getTools()).find((candidate) => candidate.name === name);
      if (!tool) throw new Error(`Tool not registered: ${name}`);
      return JSON.parse(await modelContext.executeTool(tool, JSON.stringify(args))) as ToolResult;
    },
    { name, args }
  );
}

test.describe('WebMCP tools', () => {
  test.skip(!process.env.WEBMCP_E2E, 'Opt in with WEBMCP_E2E=1 and a Chrome build with WebMCP enabled');

  test('registers the Cascade tools and shows the indicator', async ({ page }) => {
    const names = await page.evaluate(async () => {
      const modelContext = document.modelContext;
      if (!modelContext) throw new Error('document.modelContext is undefined; enable WebMCP in this browser');
      return (await modelContext.getTools()).map((tool) => tool.name).sort();
    });

    expect(names).toEqual(EXPECTED_TOOLS);
    await expect(page.getByText('Agent tools on')).toBeVisible();
  });

  test('creates, moves, and deletes a task through executeTool and the board follows', async ({ page }) => {
    const title = 'Created by WebMCP';

    const created = await callTool(page, 'cascade_create_task', { title, tags: ['agent'] });
    expect(created.ok).toBe(true);
    await expect(column(page, 'To Do').locator('.task-card', { hasText: title })).toBeVisible();

    const moved = await callTool(page, 'cascade_move_task', { taskId: created.task.id, status: 'done' });
    expect(moved.changed).toBe(true);
    await expect(column(page, 'Done').locator('.task-card', { hasText: title })).toBeVisible();

    const again = await callTool(page, 'cascade_move_task', { taskId: created.task.id, status: 'done' });
    expect(again.changed).toBe(false);

    await callTool(page, 'cascade_delete_task', { taskId: created.task.id });
    await expect(taskCard(page, title)).toHaveCount(0);
  });

  test('rejects bad input and leaves the board alone', async ({ page }) => {
    await expect(callTool(page, 'cascade_create_task', { title: '' })).rejects.toThrow();
    await expect(page.locator('.task-card')).toHaveCount(0);
  });
});
