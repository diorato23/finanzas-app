import { test, expect } from '@playwright/test';

test.describe('App Finanças - Smoke Test', () => {
    test('deve carregar a página inicial e redirecionar para login se não autenticado', async ({ page }) => {
        // Tenta acessar o dashboard diretamente
        await page.goto('/dashboard');

        // O Next.js deve redirecionar para /login (aumentando timeout para 30s)
        await page.waitForURL(/.*login/, { timeout: 30000 });
        await expect(page).toHaveURL(/.*login/);

        // Verifica se o título de login está presente usando o texto
        await expect(page.getByText(/Iniciar Sesión/i).first()).toBeVisible({ timeout: 15000 });
    });

    test('página de login deve ter os campos necessários', async ({ page }) => {
        await page.goto('/login');

        // Usando IDs específicos que vimos no código
        const emailInput = page.locator('#email-login');
        const passwordInput = page.locator('#password-login');
        const submitButton = page.locator('button[type="submit"]').first();

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();
        await expect(submitButton).toHaveText(/Ingresar/i);
    });
});
