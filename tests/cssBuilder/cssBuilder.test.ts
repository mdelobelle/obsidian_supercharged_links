import { buildCSS } from '../../src/cssBuilder/cssBuilder';
import { CSSLink } from '../../src/cssBuilder/cssLink';

// Mock plugin for testing
const mockPlugin = {
  app: {
    vault: {
      adapter: {
        mkdir: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(false),
        remove: jest.fn().mockResolvedValue(undefined)
      },
      create: jest.fn().mockResolvedValue(undefined)
    },
    workspace: {
      trigger: jest.fn()
    }
  },
  settings: {
    activateSnippet: false,
    enableCumulative: false
  }
};

describe('CSS Builder - Style Settings Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate Style Settings configuration section', async () => {
    // Arrange
    const selectors: CSSLink[] = [
      {
        uid: 'test-selector',
        type: 'attribute',
        name: 'status',
        value: 'completed',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: true,
        selectBackground: true,
        selectPrepend: false,
        selectAppend: false
      }
    ];

    // Act
    await buildCSS(selectors, mockPlugin as any);

    // Assert
    const generatedCSS = (mockPlugin.app.vault.create as jest.Mock).mock.calls[0][1];
    
    // Should contain Style Settings header
    expect(generatedCSS).toContain('/* @settings');
    expect(generatedCSS).toContain('name: Supercharged Links');
    expect(generatedCSS).toContain('id: supercharged-links');
    
    // Should contain selector configuration
    expect(generatedCSS).toContain('id: test-selector');
    expect(generatedCSS).toContain('title: status is completed');
    expect(generatedCSS).toContain('id: test-selector-color');
    expect(generatedCSS).toContain('id: c-test-selector-use-background');
    
    // Should end Style Settings section properly
    expect(generatedCSS).toContain('*/');
  });

  it('should preserve original CSS structure when cumulative is disabled', async () => {
    // Arrange
    const selectors: CSSLink[] = [
      {
        uid: 'status-done',
        type: 'attribute',
        name: 'status',
        value: 'done',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: true,
        selectBackground: false,
        selectPrepend: false,
        selectAppend: false
      }
    ];

    // Act
    await buildCSS(selectors, mockPlugin as any);

    // Assert
    const generatedCSS = (mockPlugin.app.vault.create as jest.Mock).mock.calls[0][1];
    
    // Should contain CSS variables
    expect(generatedCSS).toContain(':root {');
    expect(generatedCSS).toContain('--status-done-color:');
    expect(generatedCSS).toContain('--status-done-weight: initial;');
    
    // Should contain CSS rules
    expect(generatedCSS).toContain('[data-link-status="done"  i] {');
    expect(generatedCSS).toContain('color: var(--status-done-color) !important;');
    
    // Should NOT contain cumulative rules
    expect(generatedCSS).not.toContain('/* Cumulative Rules');
  });

  it('should generate cumulative CSS rules when enableCumulative is true', async () => {
    // Arrange
    const cumulativePlugin = {
      ...mockPlugin,
      settings: {
        ...mockPlugin.settings,
        enableCumulative: true
      }
    };

    const selectors: CSSLink[] = [
      {
        uid: 'status-completed',
        type: 'attribute',
        name: 'status',
        value: 'completed',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: true,
        selectBackground: false,
        selectPrepend: false,
        selectAppend: false
      },
      {
        uid: 'priority-high',
        type: 'attribute',
        name: 'priority',
        value: 'high',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: false,
        selectBackground: true,
        selectPrepend: false,
        selectAppend: false
      }
    ];

    // Act
    await buildCSS(selectors, cumulativePlugin as any);

    // Assert
    const generatedCSS = (cumulativePlugin.app.vault.create as jest.Mock).mock.calls[0][1];

    // Should contain cumulative rules section
    expect(generatedCSS).toContain('/* Cumulative Rules - Multiple attributes can combine */');

    // Should contain both attribute selector and class selector
    expect(generatedCSS).toContain('[data-link-status="completed"  i][data-link-priority="high"  i], .scl-cumulative-');

    // Should combine styles from both selectors
    expect(generatedCSS).toContain('color: var(--status-completed-color) !important;');
    expect(generatedCSS).toContain('background-color: var(--priority-high-background-color) !important;');
  });

  it('should concatenate prepend icons when multiple rules have prepend', async () => {
    // Arrange
    const cumulativePlugin = {
      ...mockPlugin,
      settings: {
        ...mockPlugin.settings,
        enableCumulative: true
      }
    };

    const selectors: CSSLink[] = [
      {
        uid: 'tag-project',
        type: 'tag',
        name: '',
        value: 'project',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: false,
        selectBackground: false,
        selectPrepend: true,
        selectAppend: false
      },
      {
        uid: 'tag-bug',
        type: 'tag',
        name: '',
        value: 'bug',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: false,
        selectBackground: false,
        selectPrepend: true,
        selectAppend: false
      }
    ];

    // Act
    await buildCSS(selectors, cumulativePlugin as any);

    // Assert
    const generatedCSS = (cumulativePlugin.app.vault.create as jest.Mock).mock.calls[0][1];

    // Should contain cumulative rules section
    expect(generatedCSS).toContain('/* Cumulative Rules - Multiple attributes can combine */');

    // Should contain combined ::before selector with concatenated content
    expect(generatedCSS).toContain('::before {');
    expect(generatedCSS).toContain('content: var(--tag-project-before) var(--tag-bug-before);');
  });

  it('should handle 3+ selector combinations', async () => {
    // Arrange
    const cumulativePlugin = {
      ...mockPlugin,
      settings: {
        ...mockPlugin.settings,
        enableCumulative: true
      }
    };

    const selectors: CSSLink[] = [
      {
        uid: 'tag-project',
        type: 'tag',
        name: '',
        value: 'project',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: false,
        selectBackground: false,
        selectPrepend: true,
        selectAppend: false
      },
      {
        uid: 'tag-bug',
        type: 'tag',
        name: '',
        value: 'bug',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: false,
        selectBackground: false,
        selectPrepend: true,
        selectAppend: false
      },
      {
        uid: 'tag-urgent',
        type: 'tag',
        name: '',
        value: 'urgent',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: false,
        selectBackground: false,
        selectPrepend: true,
        selectAppend: false
      }
    ];

    // Act
    await buildCSS(selectors, cumulativePlugin as any);

    // Assert
    const generatedCSS = (cumulativePlugin.app.vault.create as jest.Mock).mock.calls[0][1];

    // Should contain 3-way combination
    expect(generatedCSS).toContain('[data-link-tags*="project" i][data-link-tags*="bug" i][data-link-tags*="urgent" i]');

    // Should concatenate all three prepend values
    expect(generatedCSS).toContain('content: var(--tag-project-before) var(--tag-bug-before) var(--tag-urgent-before)');
  });

  it('should handle mixed prepend and append combinations', async () => {
    // Arrange
    const cumulativePlugin = {
      ...mockPlugin,
      settings: {
        ...mockPlugin.settings,
        enableCumulative: true
      }
    };

    const selectors: CSSLink[] = [
      {
        uid: 'prepend-icon',
        type: 'attribute',
        name: 'status',
        value: 'completed',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: false,
        selectBackground: false,
        selectPrepend: true,
        selectAppend: false
      },
      {
        uid: 'append-icon',
        type: 'attribute',
        name: 'priority',
        value: 'high',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: false,
        selectBackground: false,
        selectPrepend: false,
        selectAppend: true
      },
      {
        uid: 'text-style',
        type: 'attribute',
        name: 'type',
        value: 'task',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: true,
        selectBackground: false,
        selectPrepend: false,
        selectAppend: false
      }
    ];

    // Act
    await buildCSS(selectors, cumulativePlugin as any);

    // Assert
    const generatedCSS = (cumulativePlugin.app.vault.create as jest.Mock).mock.calls[0][1];

    // Should contain 3-way combination with separate pseudo-element rules
    expect(generatedCSS).toContain('[data-link-status="completed"  i][data-link-priority="high"  i][data-link-type="task"  i]');

    // Should have separate ::before and ::after rules
    expect(generatedCSS).toContain('::before {');
    expect(generatedCSS).toContain('content: var(--prepend-icon-before) !important;');
    expect(generatedCSS).toContain('::after {');
    expect(generatedCSS).toContain('content: var(--append-icon-after) !important;');

    // Should have main styles
    expect(generatedCSS).toContain('color: var(--text-style-color) !important;');
  });

  it('should preserve Style Settings section when cumulative is enabled', async () => {
    // Arrange
    const cumulativePlugin = {
      ...mockPlugin,
      settings: {
        ...mockPlugin.settings,
        enableCumulative: true
      }
    };

    const selectors: CSSLink[] = [
      {
        uid: 'test-selector',
        type: 'attribute',
        name: 'status',
        value: 'completed',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: true,
        selectBackground: false,
        selectPrepend: false,
        selectAppend: false
      }
    ];

    // Act
    await buildCSS(selectors, cumulativePlugin as any);

    // Assert
    const generatedCSS = (cumulativePlugin.app.vault.create as jest.Mock).mock.calls[0][1];

    // Should preserve Style Settings section
    expect(generatedCSS).toContain('/* @settings');
    expect(generatedCSS).toContain('name: Supercharged Links');
    expect(generatedCSS).toContain('id: supercharged-links');
    expect(generatedCSS).toContain('*/');
  });

  it('should handle error in cumulative CSS generation gracefully', async () => {
    // Arrange
    const cumulativePlugin = {
      ...mockPlugin,
      settings: {
        ...mockPlugin.settings,
        enableCumulative: true
      }
    };

    // Create malformed selectors that might cause errors
    const selectors: CSSLink[] = [
      {
        uid: 'malformed',
        type: 'attribute' as any,
        name: null as any, // This might cause issues
        value: 'test',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: true,
        selectBackground: false,
        selectPrepend: false,
        selectAppend: false
      },
      {
        uid: 'valid',
        type: 'attribute',
        name: 'status',
        value: 'completed',
        match: 'exact',
        matchCaseSensitive: false,
        selectText: false,
        selectBackground: true,
        selectPrepend: false,
        selectAppend: false
      }
    ];

    // Act & Assert - should not throw
    await expect(buildCSS(selectors, cumulativePlugin as any)).resolves.not.toThrow();

    // Should still generate basic CSS even if cumulative fails
    const generatedCSS = (cumulativePlugin.app.vault.create as jest.Mock).mock.calls[0][1];
    expect(generatedCSS).toContain('/* @settings');
  });

  it('should handle empty selectors array with cumulative enabled', async () => {
    // Arrange
    const cumulativePlugin = {
      ...mockPlugin,
      settings: {
        ...mockPlugin.settings,
        enableCumulative: true
      }
    };

    // Act
    await buildCSS([], cumulativePlugin as any);

    // Assert
    const generatedCSS = (cumulativePlugin.app.vault.create as jest.Mock).mock.calls[0][1];

    // Should still generate basic structure
    expect(generatedCSS).toContain('/* @settings');
    expect(generatedCSS).not.toContain('/* Cumulative Rules');
  });
});
