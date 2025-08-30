import { CSSLink } from '../../src/cssBuilder/cssLink';
import { CumulativeCSSService } from '../../src/cssBuilder/CumulativeCSSService';

describe('CumulativeCSSService', () => {
  let service: CumulativeCSSService;

  beforeEach(() => {
    service = new CumulativeCSSService();
  });

  describe('generateCumulativeRules', () => {
    it('should return empty array for less than 2 selectors', () => {
      // Arrange
      const selectors: CSSLink[] = [
        {
          uid: 'single-selector',
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
      const result = service.generateCumulativeRules(selectors);

      // Assert
      expect(result).toEqual([]);
    });

    it('should generate combined rules for text and background selectors', () => {
      // Arrange
      const selectors: CSSLink[] = [
        {
          uid: 'text-selector',
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
          uid: 'bg-selector',
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
      const result = service.generateCumulativeRules(selectors);

      // Assert
      expect(result).toContain('/* Cumulative Rules - Multiple attributes can combine */');
      expect(result.join('\n')).toMatch(/\[data-link-status="completed"\s+i\]\[data-link-priority="high"\s+i\], \.scl-cumulative-[a-f0-9]+/);
      expect(result).toContain('    color: var(--text-selector-color) !important;');
      expect(result).toContain('    background-color: var(--bg-selector-background-color) !important;');
    });

    it('should handle tag and path selectors correctly', () => {
      // Arrange
      const selectors: CSSLink[] = [
        {
          uid: 'tag-selector',
          type: 'tag',
          name: '',
          value: 'project',
          match: 'exact',
          matchCaseSensitive: false,
          selectText: true,
          selectBackground: false,
          selectPrepend: false,
          selectAppend: false
        },
        {
          uid: 'path-selector',
          type: 'path',
          name: '',
          value: 'Projects/',
          match: 'startswith',
          matchCaseSensitive: false,
          selectText: false,
          selectBackground: true,
          selectPrepend: false,
          selectAppend: false
        }
      ];

      // Act
      const result = service.generateCumulativeRules(selectors);

      // Assert
      expect(result.join('\n')).toMatch(/\[data-link-tags\*="project" i\]\[data-link-path\^="Projects\/" i\], \.scl-cumulative-[a-f0-9]+/);
      expect(result).toContain('    color: var(--tag-selector-color) !important;');
      expect(result).toContain('    background-color: var(--path-selector-background-color) !important;');
    });

    it('should combine two text selectors with bold font weight', () => {
      // Arrange
      const selectors: CSSLink[] = [
        {
          uid: 'text1',
          type: 'attribute',
          name: 'status',
          value: 'done',
          match: 'exact',
          matchCaseSensitive: false,
          selectText: true,
          selectBackground: false,
          selectPrepend: false,
          selectAppend: false
        },
        {
          uid: 'text2',
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
      const result = service.generateCumulativeRules(selectors);

      // Assert
      expect(result).toContain('    color: var(--text1-color) !important;');
      expect(result).toContain('    font-weight: bold;');
    });

    it('should handle 3+ selector combinations', () => {
      // Arrange
      const selectors: CSSLink[] = [
        {
          uid: 'prepend1',
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
          uid: 'prepend2',
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
          uid: 'prepend3',
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
      const result = service.generateCumulativeRules(selectors);

      // Assert
      // Should contain 3-way combination
      expect(result.join('\n')).toContain('[data-link-tags*="project" i][data-link-tags*="bug" i][data-link-tags*="urgent" i]');
      expect(result).toContain('    content: var(--prepend1-before) var(--prepend2-before) var(--prepend3-before) !important;');
    });

    it('should respect maxCombinations limit', () => {
      // Arrange
      const limitedService = new CumulativeCSSService(2); // Limit to 2 selectors max
      const selectors: CSSLink[] = [
        { uid: 'sel1', type: 'attribute', name: 'a', value: '1', match: 'exact', matchCaseSensitive: false, selectText: true, selectBackground: false, selectPrepend: false, selectAppend: false },
        { uid: 'sel2', type: 'attribute', name: 'b', value: '2', match: 'exact', matchCaseSensitive: false, selectText: true, selectBackground: false, selectPrepend: false, selectAppend: false },
        { uid: 'sel3', type: 'attribute', name: 'c', value: '3', match: 'exact', matchCaseSensitive: false, selectText: true, selectBackground: false, selectPrepend: false, selectAppend: false },
        { uid: 'sel4', type: 'attribute', name: 'd', value: '4', match: 'exact', matchCaseSensitive: false, selectText: true, selectBackground: false, selectPrepend: false, selectAppend: false }
      ];

      // Act
      const result = limitedService.generateCumulativeRules(selectors);

      // Assert
      // Should not contain 3+ way combinations
      expect(result.join('\n')).not.toContain('[data-link-a="1" i][data-link-b="2" i][data-link-c="3" i]');
      // Should contain 2-way combinations
      expect(result.join('\n')).toContain('[data-link-a="1"  i][data-link-b="2"  i], .scl-cumulative-');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for null selectors array', () => {
      // Act & Assert
      expect(() => service.generateCumulativeRules(null as any)).toThrow('Selectors array cannot be null or undefined');
    });

    it('should throw error for undefined selectors array', () => {
      // Act & Assert
      expect(() => service.generateCumulativeRules(undefined as any)).toThrow('Selectors array cannot be null or undefined');
    });

    it('should handle empty selectors array', () => {
      // Act
      const result = service.generateCumulativeRules([]);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle single selector array', () => {
      // Arrange
      const selectors: CSSLink[] = [
        {
          uid: 'single',
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
      const result = service.generateCumulativeRules(selectors);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('CSS Selector Generation', () => {
    it('should handle case sensitive matching', () => {
      // Arrange
      const selectors: CSSLink[] = [
        {
          uid: 'case-sensitive',
          type: 'attribute',
          name: 'status',
          value: 'Done',
          match: 'exact',
          matchCaseSensitive: true,
          selectText: true,
          selectBackground: false,
          selectPrepend: false,
          selectAppend: false
        },
        {
          uid: 'case-insensitive',
          type: 'attribute',
          name: 'priority',
          value: 'HIGH',
          match: 'exact',
          matchCaseSensitive: false,
          selectText: false,
          selectBackground: true,
          selectPrepend: false,
          selectAppend: false
        }
      ];

      // Act
      const result = service.generateCumulativeRules(selectors);

      // Assert
      expect(result.join('\n')).toMatch(/\[data-link-status="Done" \]\[data-link-priority="HIGH"\s+i\], \.scl-cumulative-[a-f0-9]+/);
    });

    it('should handle different match types', () => {
      // Arrange
      const selectors: CSSLink[] = [
        {
          uid: 'starts-with',
          type: 'attribute',
          name: 'path',
          value: 'Projects/',
          match: 'startswith',
          matchCaseSensitive: false,
          selectText: true,
          selectBackground: false,
          selectPrepend: false,
          selectAppend: false
        },
        {
          uid: 'contains',
          type: 'attribute',
          name: 'title',
          value: 'important',
          match: 'contains',
          matchCaseSensitive: false,
          selectText: false,
          selectBackground: true,
          selectPrepend: false,
          selectAppend: false
        }
      ];

      // Act
      const result = service.generateCumulativeRules(selectors);

      // Assert
      expect(result.join('\n')).toMatch(/\[data-link-path\^="Projects\/"\s+i\]\[data-link-title\*="important"\s+i\], \.scl-cumulative-[a-f0-9]+/);
    });
  });
});
