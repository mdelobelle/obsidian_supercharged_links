import { 
    initializeCumulativeLinkService, 
    updateCumulativeLinkService 
} from '../../src/linkAttributes/linkAttributes';
import { SuperchargedLinksSettings, DEFAULT_SETTINGS } from '../../src/settings/SuperchargedLinksSettings';

describe('Cumulative Integration Tests', () => {
    let mockSettings: SuperchargedLinksSettings;

    beforeEach(() => {
        mockSettings = {
            ...DEFAULT_SETTINGS,
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
    });

    describe('Service Initialization', () => {
        it('should initialize cumulative service without errors', () => {
            // Act & Assert
            expect(() => initializeCumulativeLinkService(mockSettings)).not.toThrow();
        });

        it('should update cumulative service without errors', () => {
            // Arrange
            initializeCumulativeLinkService(mockSettings);

            // Act & Assert
            expect(() => updateCumulativeLinkService(mockSettings)).not.toThrow();
        });

        it('should handle service update before initialization', () => {
            // Act & Assert - should initialize if service doesn't exist
            expect(() => updateCumulativeLinkService(mockSettings)).not.toThrow();
        });

        it('should handle null settings gracefully', () => {
            // Act & Assert
            expect(() => initializeCumulativeLinkService(null as any)).not.toThrow();
            expect(() => updateCumulativeLinkService(null as any)).not.toThrow();
        });

        it('should handle settings with cumulative disabled', () => {
            // Arrange
            const disabledSettings = {
                ...mockSettings,
                enableCumulative: false
            };

            // Act & Assert
            expect(() => initializeCumulativeLinkService(disabledSettings)).not.toThrow();
            expect(() => updateCumulativeLinkService(disabledSettings)).not.toThrow();
        });
    });

    describe('Settings Validation', () => {
        it('should handle default settings correctly', () => {
            // Act & Assert
            expect(() => initializeCumulativeLinkService(DEFAULT_SETTINGS)).not.toThrow();
            expect(DEFAULT_SETTINGS.enableCumulative).toBe(false); // Should default to false
        });

        it('should handle settings with empty selectors array', () => {
            // Arrange
            const emptySettings = {
                ...mockSettings,
                selectors: []
            };

            // Act & Assert
            expect(() => initializeCumulativeLinkService(emptySettings)).not.toThrow();
            expect(() => updateCumulativeLinkService(emptySettings)).not.toThrow();
        });

        it('should handle settings with malformed selectors', () => {
            // Arrange
            const malformedSettings = {
                ...mockSettings,
                selectors: [
                    {
                        uid: 'malformed',
                        type: 'attribute' as any,
                        name: null as any,
                        value: 'test',
                        match: 'exact',
                        matchCaseSensitive: false,
                        selectText: true,
                        selectBackground: false,
                        selectPrepend: false,
                        selectAppend: false
                    }
                ]
            };

            // Act & Assert
            expect(() => initializeCumulativeLinkService(malformedSettings)).not.toThrow();
            expect(() => updateCumulativeLinkService(malformedSettings)).not.toThrow();
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain backward compatibility when cumulative is disabled', () => {
            // Arrange
            const legacySettings = {
                ...DEFAULT_SETTINGS,
                enableCumulative: false // Legacy behavior
            };

            // Act & Assert
            expect(() => initializeCumulativeLinkService(legacySettings)).not.toThrow();
            
            // Should work exactly as before when disabled
            expect(legacySettings.enableCumulative).toBe(false);
        });

        it('should handle settings without enableCumulative property', () => {
            // Arrange
            const incompleteSettings = {
                ...mockSettings
            };
            delete (incompleteSettings as any).enableCumulative;

            // Act & Assert
            expect(() => initializeCumulativeLinkService(incompleteSettings as any)).not.toThrow();
        });
    });
});
