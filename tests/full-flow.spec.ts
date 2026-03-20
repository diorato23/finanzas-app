import { test, expect } from '@playwright/test';

test.describe('App Finanças - Fluxo Completo', () => {

    test('deve registrar um novo usuário e navegar para o dashboard', async ({ page }) => {
        // Dados únicos para este teste
        const timestamp = Date.now();
        const testUserEmail = `user_${timestamp}@example.com`;
        const testUserName = `Teste E2E ${timestamp}`;
        const testFamilyName = `Familia Playwright ${timestamp}`;

        // Aumentar o timeout para este teste específico
        test.setTimeout(90000);

        console.log('Iniciando navegação para /login...');
        await page.goto('/login');

        // Preencher campos de registro
        console.log('Preenchendo formulário de registro...');
        const signupCard = page.locator('div:has-text("Crear Cuenta Nueva")');

        await signupCard.locator('#nombre').fill(testUserName);
        await signupCard.locator('#familia').fill(testFamilyName);
        await signupCard.locator('#email-signup').fill(testUserEmail);
        await signupCard.locator('#password-signup').fill('senha123456');

        console.log('Clicando em "Crear Grupo Familiar"...');
        await signupCard.getByRole('button', { name: /Crear Grupo Familiar/i }).click();

        console.log('Aguardando redirecionamento para o dashboard...');
        await page.waitForURL(/.*dashboard/, { timeout: 45000 });
        await expect(page).toHaveURL(/.*dashboard/);

        // Verificar se o dashboard carregou elementos básicos
        await expect(page.getByText(/Saldo Total/i)).toBeVisible();
        await expect(page.getByText(/Últimos Movimientos/i)).toBeVisible();

        // Navegar para Categorias
        console.log('Navegando para Categorías...');
        // Clicar no link de Categorias na Sidebar (Desktop ou Bottom Nav)
        await page.getByRole('link', { name: /Categorías/i }).first().click();

        await page.waitForURL(/.*categorias/, { timeout: 15000 });

        // Criar uma nova categoria para testar
        console.log('Criando nova categoria "Alimentación"...');
        const catCard = page.locator('div:has-text("Nueva Categoría")');
        await catCard.locator('#nombre').fill('Alimentación');
        await catCard.getByRole('button', { name: /Guardar/i }).click();

        // Verificar se a categoria apareceu com o Emoji automático (🍔 Alimentación)
        console.log('Verificando emoji automático na listagem...');
        await expect(page.getByText(/🍔 Alimentación/i)).toBeVisible({ timeout: 15000 });
    });
});
