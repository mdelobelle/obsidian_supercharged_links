import { CumulativeLinkService } from '../../src/linkAttributes/CumulativeLinkService';
import { SuperchargedLinksSettings } from '../../src/settings/SuperchargedLinksSettings';
import { CSSLink } from '../../src/cssBuilder/cssLink';

// Mock HTMLElement
class MockHTMLElement {
    private classes: Set<string> = new Set();
    
    addClass(className: string) {
        this.classes.add(className);
    }
    
    hasClass(className: string): boolean {
        return this.classes.has(className);
    }
    
    getClasses(): string[] {
        return Array.from(this.classes);
    }
}

describe('CumulativeLinkService', () => {
    let service: CumulativeLinkService;
    let mockSettings: SuperchargedLinksSettings;

    beforeEach(() => {
        mockSettings = {
            targetAttributes: [],
            targetTags: true,
            getFromInlineField: true,
            enableTabHeader: true,
            activateSnippet: true,
            enableEditor: true,
            enableFileList: true,
            enableBacklinks: true,
            enableQuickSwitcher: true,
            enableSuggestor: true,
            enableCumulative: true,
            selectors: [
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
            ]
        };

        service = new CumulativeLinkService(mockSettings);
    });

    describe('applyCumulativeStyles', () => {
        it('should not apply styles when cumulative is disabled', () => {
            // Arrange
            mockSettings.enableCumulative = false;
            service.updateSettings(mockSettings);
            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = { status: 'completed', priority: 'high' };

            // Act
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert
            expect(mockLink.getClasses()).toHaveLength(0);
        });

        it('should not apply styles when only one rule matches', () => {
            // Arrange
            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = { status: 'completed' }; // Only matches one rule

            // Act
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert
            expect(mockLink.getClasses()).toHaveLength(0);
        });

        it('should apply cumulative class when multiple rules match', () => {
            // Arrange
            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = { status: 'completed', priority: 'high' }; // Matches both rules

            // Act
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert
            const classes = mockLink.getClasses();
            expect(classes).toHaveLength(1);
            expect(classes[0]).toMatch(/^scl-cumulative-[a-f0-9]+$/);
        });

        it('should handle non-string attribute values', () => {
            // Arrange
            mockSettings.selectors.push({
                uid: 'number-rule',
                type: 'attribute',
                name: 'count',
                value: '5',
                match: 'exact',
                matchCaseSensitive: false,
                selectText: true,
                selectBackground: false,
                selectPrepend: false,
                selectAppend: false
            });
            service.updateSettings(mockSettings);

            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = {
                status: 'completed',
                count: 5 as any // Number value
            };

            // Act
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert
            const classes = mockLink.getClasses();
            expect(classes).toHaveLength(1);
            expect(classes[0]).toMatch(/^scl-cumulative-[a-f0-9]+$/);
        });

        it('should handle tag-based rules correctly', () => {
            // Arrange
            mockSettings.selectors.push({
                uid: 'tag-project',
                type: 'tag',
                name: '',
                value: 'project',
                match: 'exact',
                matchCaseSensitive: false,
                selectText: true,
                selectBackground: false,
                selectPrepend: false,
                selectAppend: false
            });
            service.updateSettings(mockSettings);

            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = { 
                status: 'completed', 
                tags: 'project work important' 
            };

            // Act
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert
            const classes = mockLink.getClasses();
            expect(classes).toHaveLength(1);
            expect(classes[0]).toMatch(/^scl-cumulative-[a-f0-9]+$/);
        });

        it('should handle path-based rules correctly', () => {
            // Arrange
            mockSettings.selectors.push({
                uid: 'path-projects',
                type: 'path',
                name: '',
                value: 'Projects/',
                match: 'startswith',
                matchCaseSensitive: false,
                selectText: false,
                selectBackground: true,
                selectPrepend: false,
                selectAppend: false
            });
            service.updateSettings(mockSettings);

            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = { 
                status: 'completed', 
                path: 'Projects/MyProject.md' 
            };

            // Act
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert
            const classes = mockLink.getClasses();
            expect(classes).toHaveLength(1);
            expect(classes[0]).toMatch(/^scl-cumulative-[a-f0-9]+$/);
        });

        it('should handle boolean attribute values', () => {
            // Arrange
            mockSettings.selectors.push({
                uid: 'boolean-rule',
                type: 'attribute',
                name: 'published',
                value: 'true',
                match: 'exact',
                matchCaseSensitive: false,
                selectText: true,
                selectBackground: false,
                selectPrepend: false,
                selectAppend: false
            });
            service.updateSettings(mockSettings);

            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = {
                status: 'completed',
                published: true as any // Boolean value
            };

            // Act
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert
            const classes = mockLink.getClasses();
            expect(classes).toHaveLength(1);
            expect(classes[0]).toMatch(/^scl-cumulative-[a-f0-9]+$/);
        });

        it('should handle array attribute values', () => {
            // Arrange
            mockSettings.selectors.push({
                uid: 'array-rule',
                type: 'attribute',
                name: 'categories',
                value: 'work',
                match: 'contains',
                matchCaseSensitive: false,
                selectText: true,
                selectBackground: false,
                selectPrepend: false,
                selectAppend: false
            });
            service.updateSettings(mockSettings);

            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = {
                status: 'completed',
                categories: ['work', 'important'] as any // Array value
            };

            // Act
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert
            const classes = mockLink.getClasses();
            expect(classes).toHaveLength(1);
            expect(classes[0]).toMatch(/^scl-cumulative-[a-f0-9]+$/);
        });

        it('should handle case sensitivity correctly', () => {
            // Arrange
            mockSettings.selectors = [
                {
                    uid: 'case-sensitive',
                    type: 'attribute',
                    name: 'status',
                    value: 'Completed',
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
            service.updateSettings(mockSettings);

            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = {
                status: 'Completed', // Exact case match
                priority: 'high' // Different case, should still match
            };

            // Act
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert
            const classes = mockLink.getClasses();
            expect(classes).toHaveLength(1);
            expect(classes[0]).toMatch(/^scl-cumulative-[a-f0-9]+$/);
        });

        it('should handle different match types', () => {
            // Arrange
            mockSettings.selectors = [
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
                },
                {
                    uid: 'ends-with',
                    type: 'attribute',
                    name: 'filename',
                    value: '.md',
                    match: 'endswith',
                    matchCaseSensitive: false,
                    selectText: false,
                    selectBackground: false,
                    selectPrepend: true,
                    selectAppend: false
                }
            ];
            service.updateSettings(mockSettings);

            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = {
                path: 'Projects/MyProject.md',
                title: 'Very important task',
                filename: 'task.md'
            };

            // Act
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert
            const classes = mockLink.getClasses();
            expect(classes).toHaveLength(1);
            expect(classes[0]).toMatch(/^scl-cumulative-[a-f0-9]+$/);
        });
    });

    describe('Error Handling', () => {
        it('should handle null link element gracefully', () => {
            // Arrange
            const linkAttributes = { status: 'completed', priority: 'high' };

            // Act & Assert - should not throw
            expect(() => service.applyCumulativeStyles(null as any, linkAttributes)).not.toThrow();
        });

        it('should handle null link attributes gracefully', () => {
            // Arrange
            const mockLink = new MockHTMLElement() as any;

            // Act & Assert - should not throw
            expect(() => service.applyCumulativeStyles(mockLink, null as any)).not.toThrow();
        });

        it('should handle undefined link attributes gracefully', () => {
            // Arrange
            const mockLink = new MockHTMLElement() as any;

            // Act & Assert - should not throw
            expect(() => service.applyCumulativeStyles(mockLink, undefined as any)).not.toThrow();
        });

        it('should handle malformed selector rules gracefully', () => {
            // Arrange
            mockSettings.selectors = [
                {
                    uid: 'malformed',
                    type: 'attribute' as any,
                    name: null as any, // Malformed
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
            service.updateSettings(mockSettings);

            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = { status: 'completed' };

            // Act & Assert - should not throw and should continue processing valid rules
            expect(() => service.applyCumulativeStyles(mockLink, linkAttributes)).not.toThrow();
        });
    });

    describe('Settings Management', () => {
        it('should update settings correctly', () => {
            // Arrange
            const newSettings = {
                ...mockSettings,
                enableCumulative: false
            };

            // Act
            service.updateSettings(newSettings);

            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = { status: 'completed', priority: 'high' };
            service.applyCumulativeStyles(mockLink, linkAttributes);

            // Assert - should not apply styles when disabled
            expect(mockLink.getClasses()).toHaveLength(0);
        });

        it('should handle settings with empty selectors array', () => {
            // Arrange
            const emptySettings = {
                ...mockSettings,
                selectors: []
            };
            service.updateSettings(emptySettings);

            const mockLink = new MockHTMLElement() as any;
            const linkAttributes = { status: 'completed', priority: 'high' };

            // Act & Assert - should not throw
            expect(() => service.applyCumulativeStyles(mockLink, linkAttributes)).not.toThrow();
            expect(mockLink.getClasses()).toHaveLength(0);
        });
    });
});
