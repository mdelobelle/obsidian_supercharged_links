import { CSSLink, matchSign } from './cssLink';

/**
 * Service responsible for generating cumulative CSS rules
 * Follows Single Responsibility Principle by focusing only on cumulative CSS generation
 */
export class CumulativeCSSService {
    private maxCombinations: number;

    constructor(maxCombinations: number = 5) {
        this.maxCombinations = maxCombinations;
    }

    /**
     * Generates cumulative CSS rules that combine multiple selectors
     * @param selectors Array of CSS selectors to combine
     * @returns Array of CSS instruction strings
     * @throws Error if selectors array is null or undefined
     */
    generateCumulativeRules(selectors: CSSLink[]): string[] {
        // Input validation following fail-fast pattern
        if (!selectors) {
            throw new Error('Selectors array cannot be null or undefined');
        }

        const instructions: string[] = [];

        if (selectors.length < 2) {
            return instructions; // Need at least 2 selectors to combine
        }

        instructions.push("", "/* Cumulative Rules - Multiple attributes can combine */");

        // Generate combinations for all possible subsets of 2 or more selectors
        this.generateAllCombinations(selectors).forEach(combination => {
            const combinedRule = this.generateCombinedRuleForMultiple(combination);
            if (combinedRule.length > 0) {
                instructions.push(...combinedRule);
            }
        });

        return instructions;
    }

    /**
     * Generates all possible combinations of selectors (2 or more)
     * Limited by maxCombinations to prevent CSS bloat
     * @param selectors Array of selectors to combine
     * @returns Array of selector combinations
     */
    private generateAllCombinations(selectors: CSSLink[]): CSSLink[][] {
        const combinations: CSSLink[][] = [];
        const maxSelectors = Math.min(selectors.length, this.maxCombinations + 1); // +1 because maxCombinations was for pairs

        // Generate combinations of size 2 to maxSelectors
        for (let size = 2; size <= maxSelectors; size++) {
            combinations.push(...this.getCombinations(selectors, size));
        }

        return combinations;
    }

    /**
     * Gets all combinations of a specific size from an array
     * @param arr Array to get combinations from
     * @param size Size of each combination
     * @returns Array of combinations
     */
    private getCombinations<T>(arr: T[], size: number): T[][] {
        if (size > arr.length) return [];
        if (size === 1) return arr.map(item => [item]);
        if (size === arr.length) return [arr];

        const combinations: T[][] = [];

        for (let i = 0; i <= arr.length - size; i++) {
            const head = arr[i];
            const tailCombinations = this.getCombinations(arr.slice(i + 1), size - 1);
            tailCombinations.forEach(tail => {
                combinations.push([head, ...tail]);
            });
        }

        return combinations;
    }

    /**
     * Generates a combined CSS rule for multiple selectors
     * @param selectors Array of selectors to combine
     * @returns Array of CSS instruction strings for the combined rule
     */
    private generateCombinedRuleForMultiple(selectors: CSSLink[]): string[] {
        if (selectors.length < 2) return [];

        const rules: string[] = [];

        // Generate combined attribute selector
        const combinedAttributeSelector = selectors.map(s => this.generateCSSSelector(s)).join('');

        // Generate class-based selector for runtime application
        const combinationClass = this.generateCombinationClassName(selectors);
        const combinedClassSelector = `.${combinationClass}`;
        const baseSelector = `${combinedAttributeSelector}, ${combinedClassSelector}`;

        // Generate main styles (text, background)
        const mainStyles = this.generateMainStylesForMultiple(selectors);
        if (mainStyles.length > 0) {
            rules.push("", `${baseSelector} {`, ...mainStyles, "}");
        }

        // Generate prepend styles (::before pseudo-element)
        const prependStyles = this.generatePrependStylesForMultiple(selectors);
        if (prependStyles.length > 0) {
            rules.push("", `.data-link-icon${combinedAttributeSelector}::before, .data-link-icon.${combinationClass}::before {`, ...prependStyles, "}");
        }

        // Generate append styles (::after pseudo-element)
        const appendStyles = this.generateAppendStylesForMultiple(selectors);
        if (appendStyles.length > 0) {
            rules.push("", `.data-link-icon-after${combinedAttributeSelector}::after, .data-link-icon-after.${combinationClass}::after {`, ...appendStyles, "}");
        }

        return rules;
    }

    /**
     * Generates a combined CSS rule for two selectors
     * @param selector1 First CSS selector
     * @param selector2 Second CSS selector
     * @returns Array of CSS instruction strings for the combined rule
     */
    private generateCombinedRule(selector1: CSSLink, selector2: CSSLink): string[] {
        const rules: string[] = [];

        // Generate both attribute-based selector and class-based selector
        const cssSelector1 = this.generateCSSSelector(selector1);
        const cssSelector2 = this.generateCSSSelector(selector2);
        const combinedAttributeSelector = cssSelector1 + cssSelector2;

        // Generate class-based selector for runtime application
        const combinationClass = this.generateCombinationClassName([selector1, selector2]);
        const combinedClassSelector = `.${combinationClass}`;
        const baseSelector = `${combinedAttributeSelector}, ${combinedClassSelector}`;

        // Generate main styles (text, background)
        const mainStyles = this.generateMainStyles(selector1, selector2);
        if (mainStyles.length > 0) {
            rules.push("", `${baseSelector} {`, ...mainStyles, "}");
        }

        // Generate prepend styles (::before pseudo-element) with higher specificity
        const prependStyles = this.generatePrependStyles(selector1, selector2);
        if (prependStyles.length > 0) {
            rules.push("", `.data-link-icon${combinedAttributeSelector}::before, .data-link-icon.${combinationClass}::before {`, ...prependStyles, "}");
        }

        // Generate append styles (::after pseudo-element) with higher specificity
        const appendStyles = this.generateAppendStyles(selector1, selector2);
        if (appendStyles.length > 0) {
            rules.push("", `.data-link-icon-after${combinedAttributeSelector}::after, .data-link-icon-after.${combinationClass}::after {`, ...appendStyles, "}");
        }

        return rules;
    }

    /**
     * Generates CSS selector string for a given CSSLink
     * @param selector CSSLink to generate selector for
     * @returns CSS selector string
     */
    private generateCSSSelector(selector: CSSLink): string {
        if (selector.type === 'attribute') {
            return `[data-link-${selector.name}${matchSign[selector.match]}="${selector.value}" ${selector.matchCaseSensitive ? "" : " i"}]`;
        } else if (selector.type === 'tag') {
            return `[data-link-tags*="${selector.value}" i]`;
        } else {
            return `[data-link-path${matchSign[selector.match]}="${selector.value}" ${selector.matchCaseSensitive ? "" : "i"}]`;
        }
    }

    /**
     * Generates main styles (text, background) for two selectors
     * @param selector1 First selector
     * @param selector2 Second selector
     * @returns Array of CSS style strings
     */
    private generateMainStyles(selector1: CSSLink, selector2: CSSLink): string[] {
        const styles: string[] = [];

        // Handle text styling - combine intelligently
        if (selector1.selectText && selector2.selectText) {
            // Both have text styling - use first selector's color but make it bold
            styles.push(`    color: var(--${selector1.uid}-color) !important;`);
            styles.push(`    font-weight: bold;`);
        } else if (selector1.selectText) {
            styles.push(`    color: var(--${selector1.uid}-color) !important;`);
            styles.push(`    font-weight: var(--${selector1.uid}-weight);`);
        } else if (selector2.selectText) {
            styles.push(`    color: var(--${selector2.uid}-color) !important;`);
            styles.push(`    font-weight: var(--${selector2.uid}-weight);`);
        }

        // Handle background styling - use whichever selector has it
        if (selector1.selectBackground || selector2.selectBackground) {
            const bgSelector = selector1.selectBackground ? selector1 : selector2;
            styles.push(`    background-color: var(--${bgSelector.uid}-background-color) !important;`);
            styles.push(`    border-radius: 5px;`);
            styles.push(`    padding-left: 2px;`);
            styles.push(`    padding-right: 2px;`);
            styles.push(`    text-decoration: var(--${bgSelector.uid}-decoration) !important;`);
        }

        return styles;
    }

    /**
     * Generates prepend styles (::before pseudo-element) for two selectors
     * @param selector1 First selector
     * @param selector2 Second selector
     * @returns Array of CSS style strings
     */
    private generatePrependStyles(selector1: CSSLink, selector2: CSSLink): string[] {
        const prependSelectors = [selector1, selector2].filter(s => s.selectPrepend);
        if (prependSelectors.length === 0) {
            return [];
        }

        // Concatenate multiple prepend values with !important to override individual rules
        const prependValues = prependSelectors.map(s => `var(--${s.uid}-before)`).join(' ');
        return [`    content: ${prependValues} !important;`];
    }

    /**
     * Generates append styles (::after pseudo-element) for two selectors
     * @param selector1 First selector
     * @param selector2 Second selector
     * @returns Array of CSS style strings
     */
    private generateAppendStyles(selector1: CSSLink, selector2: CSSLink): string[] {
        const appendSelectors = [selector1, selector2].filter(s => s.selectAppend);
        if (appendSelectors.length === 0) {
            return [];
        }

        // Concatenate multiple append values with !important to override individual rules
        const appendValues = appendSelectors.map(s => `var(--${s.uid}-after)`).join(' ');
        return [`    content: ${appendValues} !important;`];
    }

    /**
     * Generates main styles (text, background) for multiple selectors
     * @param selectors Array of selectors
     * @returns Array of CSS style strings
     */
    private generateMainStylesForMultiple(selectors: CSSLink[]): string[] {
        const styles: string[] = [];

        // Handle text styling - use first text selector's color, make bold if multiple
        const textSelectors = selectors.filter(s => s.selectText);
        if (textSelectors.length > 0) {
            const firstTextSelector = textSelectors[0];
            styles.push(`    color: var(--${firstTextSelector.uid}-color) !important;`);

            if (textSelectors.length > 1) {
                styles.push(`    font-weight: bold;`);
            } else {
                styles.push(`    font-weight: var(--${firstTextSelector.uid}-weight);`);
            }
        }

        // Handle background styling - use first background selector
        const backgroundSelectors = selectors.filter(s => s.selectBackground);
        if (backgroundSelectors.length > 0) {
            const firstBgSelector = backgroundSelectors[0];
            styles.push(`    background-color: var(--${firstBgSelector.uid}-background-color) !important;`);
            styles.push(`    border-radius: 5px;`);
            styles.push(`    padding-left: 2px;`);
            styles.push(`    padding-right: 2px;`);
            styles.push(`    text-decoration: var(--${firstBgSelector.uid}-decoration) !important;`);
        }

        return styles;
    }

    /**
     * Generates prepend styles (::before pseudo-element) for multiple selectors
     * @param selectors Array of selectors
     * @returns Array of CSS style strings
     */
    private generatePrependStylesForMultiple(selectors: CSSLink[]): string[] {
        const prependSelectors = selectors.filter(s => s.selectPrepend);
        if (prependSelectors.length === 0) {
            return [];
        }

        // Concatenate all prepend values
        const prependValues = prependSelectors.map(s => `var(--${s.uid}-before)`).join(' ');
        return [`    content: ${prependValues} !important;`];
    }

    /**
     * Generates append styles (::after pseudo-element) for multiple selectors
     * @param selectors Array of selectors
     * @returns Array of CSS style strings
     */
    private generateAppendStylesForMultiple(selectors: CSSLink[]): string[] {
        const appendSelectors = selectors.filter(s => s.selectAppend);
        if (appendSelectors.length === 0) {
            return [];
        }

        // Concatenate all append values
        const appendValues = appendSelectors.map(s => `var(--${s.uid}-after)`).join(' ');
        return [`    content: ${appendValues} !important;`];
    }

    /**
     * Generates a unique CSS class name for a combination of rules
     * @param rules Array of rules to combine
     * @returns CSS class name
     */
    private generateCombinationClassName(rules: CSSLink[]): string {
        // Sort rules by UID to ensure consistent class names
        const sortedUids = rules.map(r => r.uid).sort();
        const combinedString = sortedUids.join('-');

        // Simple hash function for generating consistent class names
        let hash = 0;
        for (let i = 0; i < combinedString.length; i++) {
            const char = combinedString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        // Convert to hex and ensure positive
        const hexHash = Math.abs(hash).toString(16);
        return `scl-cumulative-${hexHash}`;
    }
}
