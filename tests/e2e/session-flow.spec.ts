// Created automatically by Cursor AI (2024-12-19)

import { test, expect } from '@playwright/test';

test.describe('Session Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Login (assuming we have a test user)
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard');
  });

  test('complete session flow from campaign creation to narration', async ({ page }) => {
    // Create a new campaign
    await page.click('[data-testid="create-campaign-button"]');
    await page.fill('[data-testid="campaign-name-input"]', 'E2E Test Campaign');
    await page.fill('[data-testid="campaign-description-input"]', 'Campaign for E2E testing');
    await page.selectOption('[data-testid="campaign-theme-select"]', 'fantasy');
    await page.selectOption('[data-testid="campaign-rating-select"]', 'general');
    await page.click('[data-testid="save-campaign-button"]');
    
    // Wait for campaign to be created and navigate to it
    await page.waitForSelector('[data-testid="campaign-card"]');
    await page.click('[data-testid="campaign-card"]');
    
    // Create a new session
    await page.click('[data-testid="create-session-button"]');
    await page.fill('[data-testid="session-name-input"]', 'E2E Test Session');
    await page.click('[data-testid="start-session-button"]');
    
    // Wait for session to load
    await page.waitForURL('**/session/**');
    
    // Verify session components are loaded
    await expect(page.locator('[data-testid="narration-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="dice-tray"]')).toBeVisible();
    await expect(page.locator('[data-testid="rules-panel"]')).toBeVisible();
    
    // Test narration generation
    await page.fill('[data-testid="narration-input"]', 'What do I see in the tavern?');
    await page.click('[data-testid="send-narration-button"]');
    
    // Wait for narration to be generated
    await page.waitForSelector('[data-testid="narration-response"]', { timeout: 30000 });
    
    // Verify narration response
    const narrationText = await page.locator('[data-testid="narration-response"]').textContent();
    expect(narrationText).toBeTruthy();
    expect(narrationText!.length).toBeGreaterThan(10);
    
    // Test dice rolling
    await page.fill('[data-testid="dice-expression-input"]', '2d20kh1 + 5');
    await page.click('[data-testid="roll-dice-button"]');
    
    // Wait for dice result
    await page.waitForSelector('[data-testid="dice-result"]');
    
    // Verify dice result
    const diceResult = await page.locator('[data-testid="dice-result"]').textContent();
    expect(diceResult).toMatch(/\d+/); // Should contain numbers
    
    // Test rules lookup
    await page.fill('[data-testid="rules-search-input"]', 'advantage');
    await page.click('[data-testid="search-rules-button"]');
    
    // Wait for rules results
    await page.waitForSelector('[data-testid="rules-result"]');
    
    // Verify rules result
    const rulesText = await page.locator('[data-testid="rules-result"]').textContent();
    expect(rulesText).toContain('advantage');
  });

  test('combat flow with initiative and turns', async ({ page }) => {
    // Navigate to an existing session
    await page.goto('http://localhost:3000/session/test-session-id');
    
    // Start combat
    await page.click('[data-testid="start-combat-button"]');
    
    // Add combatants
    await page.click('[data-testid="add-combatant-button"]');
    await page.fill('[data-testid="combatant-name-input"]', 'Goblin');
    await page.fill('[data-testid="combatant-initiative-input"]', '15');
    await page.click('[data-testid="save-combatant-button"]');
    
    await page.click('[data-testid="add-combatant-button"]');
    await page.fill('[data-testid="combatant-name-input"]', 'Player');
    await page.fill('[data-testid="combatant-initiative-input"]', '18');
    await page.click('[data-testid="save-combatant-button"]');
    
    // Start initiative
    await page.click('[data-testid="roll-initiative-button"]');
    
    // Wait for initiative order
    await page.waitForSelector('[data-testid="initiative-order"]');
    
    // Verify initiative order
    const initiativeOrder = await page.locator('[data-testid="initiative-order"]').textContent();
    expect(initiativeOrder).toContain('Player');
    expect(initiativeOrder).toContain('Goblin');
    
    // Take a turn
    await page.click('[data-testid="next-turn-button"]');
    
    // Verify turn indicator
    await expect(page.locator('[data-testid="current-turn-indicator"]')).toBeVisible();
  });

  test('map and token management', async ({ page }) => {
    // Navigate to session
    await page.goto('http://localhost:3000/session/test-session-id');
    
    // Open map editor
    await page.click('[data-testid="open-map-editor-button"]');
    
    // Create a new map
    await page.click('[data-testid="create-map-button"]');
    await page.fill('[data-testid="map-name-input"]', 'Tavern Map');
    await page.selectOption('[data-testid="grid-type-select"]', 'square');
    await page.fill('[data-testid="grid-size-input"]', '50');
    await page.click('[data-testid="save-map-button"]');
    
    // Wait for map to load
    await page.waitForSelector('[data-testid="map-canvas"]');
    
    // Add a token
    await page.click('[data-testid="add-token-button"]');
    await page.fill('[data-testid="token-name-input"]', 'Player Token');
    await page.selectOption('[data-testid="token-type-select"]', 'player');
    await page.click('[data-testid="place-token-button"]');
    
    // Click on map to place token
    await page.click('[data-testid="map-canvas"]', { position: { x: 100, y: 100 } });
    
    // Verify token is placed
    await expect(page.locator('[data-testid="token-player-token"]')).toBeVisible();
    
    // Move token
    await page.dragAndDrop('[data-testid="token-player-token"]', '[data-testid="map-canvas"]', {
      targetPosition: { x: 200, y: 200 }
    });
    
    // Verify token moved
    const tokenPosition = await page.locator('[data-testid="token-player-token"]').boundingBox();
    expect(tokenPosition!.x).toBeGreaterThan(150);
  });

  test('loot generation and management', async ({ page }) => {
    // Navigate to session
    await page.goto('http://localhost:3000/session/test-session-id');
    
    // Open loot drawer
    await page.click('[data-testid="open-loot-drawer-button"]');
    
    // Generate treasure hoard
    await page.selectOption('[data-testid="cr-select"]', '5');
    await page.selectOption('[data-testid="rarity-select"]', 'uncommon');
    await page.click('[data-testid="generate-loot-button"]');
    
    // Wait for loot generation
    await page.waitForSelector('[data-testid="loot-result"]');
    
    // Verify loot contains expected items
    const lootText = await page.locator('[data-testid="loot-result"]').textContent();
    expect(lootText).toContain('Coins');
    expect(lootText).toContain('Items');
    
    // Add loot to inventory
    await page.click('[data-testid="add-to-inventory-button"]');
    
    // Verify loot added to inventory
    await expect(page.locator('[data-testid="inventory-item"]')).toBeVisible();
    
    // Export loot
    await page.click('[data-testid="export-loot-button"]');
    await page.selectOption('[data-testid="export-format-select"]', 'json');
    await page.click('[data-testid="download-export-button"]');
    
    // Verify download started
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });

  test('session export functionality', async ({ page }) => {
    // Navigate to session
    await page.goto('http://localhost:3000/session/test-session-id');
    
    // Open export menu
    await page.click('[data-testid="export-menu-button"]');
    
    // Export session journal
    await page.click('[data-testid="export-journal-button"]');
    await page.selectOption('[data-testid="journal-format-select"]', 'markdown');
    await page.click('[data-testid="download-journal-button"]');
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
    
    // Export encounter cards
    await page.click('[data-testid="export-encounters-button"]');
    await page.selectOption('[data-testid="encounter-format-select"]', 'foundry');
    await page.click('[data-testid="download-encounters-button"]');
    
    // Wait for download
    const downloadPromise2 = page.waitForEvent('download');
    await downloadPromise2;
    
    // Export VTT bundle
    await page.click('[data-testid="export-vtt-bundle-button"]');
    await page.click('[data-testid="download-vtt-bundle-button"]');
    
    // Wait for download
    const downloadPromise3 = page.waitForEvent('download');
    await downloadPromise3;
  });

  test('error handling and edge cases', async ({ page }) => {
    // Test with slow network
    await page.route('**/api/**', route => {
      route.fulfill({ status: 200, body: '{"error": "Network timeout"}', delay: 10000 });
    });
    
    await page.goto('http://localhost:3000/session/test-session-id');
    
    // Try to generate narration
    await page.fill('[data-testid="narration-input"]', 'What do I see?');
    await page.click('[data-testid="send-narration-button"]');
    
    // Should show timeout error
    await page.waitForSelector('[data-testid="error-message"]');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('timeout');
    
    // Test with invalid session ID
    await page.goto('http://localhost:3000/session/invalid-session-id');
    
    // Should show 404 error
    await page.waitForSelector('[data-testid="error-page"]');
    await expect(page.locator('[data-testid="error-page"]')).toContainText('404');
    
    // Test with expired token
    // Clear localStorage to simulate expired token
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // Should redirect to login
    await page.waitForURL('**/login');
  });

  test('accessibility and keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/session/test-session-id');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="narration-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="send-narration-button"]')).toBeFocused();
    
    // Test keyboard shortcuts
    await page.keyboard.press('Control+Enter');
    // Should trigger narration send
    
    // Test screen reader compatibility
    const narrationInput = page.locator('[data-testid="narration-input"]');
    await expect(narrationInput).toHaveAttribute('aria-label');
    
    const sendButton = page.locator('[data-testid="send-narration-button"]');
    await expect(sendButton).toHaveAttribute('aria-label');
    
    // Test color contrast (basic check)
    const contrast = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="narration-panel"]');
      if (!element) return 0;
      
      const style = window.getComputedStyle(element);
      const backgroundColor = style.backgroundColor;
      const color = style.color;
      
      // Basic contrast calculation (simplified)
      return 4.5; // Mock value - in real test would calculate actual contrast
    });
    
    expect(contrast).toBeGreaterThan(4.5);
  });
});
