import { test, expect } from '@playwright/test';

// All E2E tests run against a real server (started by playwright.config.js webServer).
// AUTH_TOKEN=test-password, NODE_ENV=development

test.describe('happy path', () => {
  test('redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[type=password]')).toBeVisible();
  });

  test('login with correct password loads the terminal', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type=password]', 'test-password');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/');
    // xterm.js renders a canvas element inside .xterm
    await expect(page.locator('.xterm')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('wrong password', () => {
  test('shows error message on incorrect password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type=password]', 'wrong-password');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL(/\/login\?error=1/);
    await expect(page.locator('.error')).toContainText('Incorrect password');
  });
});

test.describe('key row', () => {
  test('key row buttons are visible after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type=password]', 'test-password');
    await page.click('button[type=submit]');
    await expect(page.locator('.xterm')).toBeVisible({ timeout: 5000 });
    // Ctrl+C button is present
    await expect(page.getByRole('button', { name: 'Control C' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Escape' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tab' })).toBeVisible();
  });
});

test.describe('reconnect overlay', () => {
  test('reconnect overlay appears when WS is closed', async ({ page }) => {
    // Record every WebSocket the page opens so the test can close the
    // terminal's socket without the app shipping a test-only global.
    await page.addInitScript(() => {
      const NativeWS = window.WebSocket;
      window.__openSockets = [];
      window.WebSocket = class extends NativeWS {
        constructor(...args) {
          super(...args);
          window.__openSockets.push(this);
        }
      };
    });

    await page.goto('/login');
    await page.fill('input[type=password]', 'test-password');
    await page.click('button[type=submit]');
    await expect(page.locator('.xterm')).toBeVisible({ timeout: 5000 });

    // Force WebSocket close from the browser side
    await page.waitForFunction(() =>
      window.__openSockets.some((ws) => ws.readyState === WebSocket.OPEN));
    const closed = await page.evaluate(() => {
      const open = window.__openSockets.filter((ws) => ws.readyState === WebSocket.OPEN);
      open.forEach((ws) => ws.close());
      return open.length;
    });
    expect(closed).toBeGreaterThan(0);

    // Overlay should appear (attempt 1)
    await expect(page.locator('text=Reconnecting')).toBeVisible({ timeout: 5000 });
  });
});
