import { CSSLink } from '../cssBuilder/cssLink';
import { SuperchargedLinksSettings } from '../settings/SuperchargedLinksSettings';

/**
 * Service responsible for applying cumulative styling to links
 * Follows Single Responsibility Principle by focusing only on cumulative link processing
 */
export class CumulativeLinkService {
    private settings: SuperchargedLinksSettings;

    constructor(settings: SuperchargedLinksSettings) {
        this.settings = settings;
    }

    /**
     * Applies cumulative styling to a link element if multiple rules match
     * Ensures previously added cumulative classes are removed when they no longer apply
     * @param link The HTML link element to process
     * @param linkAttributes The attributes extracted from the linked file
     */
    applyCumulativeStyles(link: HTMLElement, linkAttributes: Record<string, string>): void {
        try {
            // Validate inputs
            if (!link || !linkAttributes) {
                return;
            }

            // Always remove any existing cumulative class before re-evaluating
            this.removeExistingCumulativeClasses(link);

            if (!this.settings.enableCumulative) {
                return; // Feature disabled; nothing else to do after cleanup
            }

            const matchingRules = this.findMatchingRules(linkAttributes);

            if (matchingRules.length > 1) {
                // Multiple rules match - apply cumulative styling
                this.applyCombinedStyling(link, matchingRules, linkAttributes);
            }
        } catch (error) {
            console.error('Failed to apply cumulative styles:', error);
            console.error('Link attributes:', linkAttributes);
            console.error('Settings selectors:', this.settings.selectors);
            // Continue without cumulative styling
        }
    }

    /**
     * Finds all rules that match the given link attributes
     * @param linkAttributes The attributes from the linked file
     * @returns Array of matching CSS rules
     */
    private findMatchingRules(linkAttributes: Record<string, string>): CSSLink[] {
        const matchingRules: CSSLink[] = [];

        for (const selector of this.settings.selectors) {
            try {
                if (this.doesRuleMatch(selector, linkAttributes)) {
                    matchingRules.push(selector);
                }
            } catch (error) {
                console.error(`Failed to match rule ${selector.uid}:`, error);
                console.error('Rule:', selector);
                console.error('Attributes:', linkAttributes);
                // Continue with other rules
            }
        }

        return matchingRules;
    }

    /**
     * Checks if a rule matches the given attributes
     * @param rule The CSS rule to check
     * @param attributes The link attributes
     * @returns True if the rule matches
     */
    private doesRuleMatch(rule: CSSLink, attributes: Record<string, string>): boolean {
        if (rule.type === 'attribute') {
            const attributeValue = attributes[rule.name];
            if (!attributeValue) {
                return false;
            }

            // Convert attribute value to string and handle different types safely
            const attributeValueStr = String(attributeValue);
            const ruleValue = rule.matchCaseSensitive ? rule.value : rule.value.toLowerCase();
            const attrValue = rule.matchCaseSensitive ? attributeValueStr : attributeValueStr.toLowerCase();

            switch (rule.match) {
                case 'exact':
                    return attrValue === ruleValue;
                case 'contains':
                    return attrValue.includes(ruleValue);
                case 'startswith':
                    return attrValue.startsWith(ruleValue);
                case 'endswith':
                    return attrValue.endsWith(ruleValue);
                default:
                    return false;
            }
        } else if (rule.type === 'tag') {
            const tags = attributes['tags'];
            if (!tags) {
                return false;
            }
            // Convert tags to string safely
            const tagsStr = String(tags);
            const tagValue = rule.matchCaseSensitive ? rule.value : rule.value.toLowerCase();
            const tagsValue = rule.matchCaseSensitive ? tagsStr : tagsStr.toLowerCase();
            return tagsValue.includes(tagValue);
        } else if (rule.type === 'path') {
            const path = attributes['path'];
            if (!path) {
                return false;
            }
            // Convert path to string safely
            const pathStr = String(path);
            const ruleValue = rule.matchCaseSensitive ? rule.value : rule.value.toLowerCase();
            const pathValue = rule.matchCaseSensitive ? pathStr : pathStr.toLowerCase();

            switch (rule.match) {
                case 'exact':
                    return pathValue === ruleValue;
                case 'contains':
                    return pathValue.includes(ruleValue);
                case 'startswith':
                    return pathValue.startsWith(ruleValue);
                case 'endswith':
                    return pathValue.endsWith(ruleValue);
                default:
                    return false;
            }
        }

        return false;
    }

    /**
     * Applies combined styling to a link element
     * @param link The HTML link element
     * @param matchingRules Array of matching rules
     * @param linkAttributes The link attributes
     */
    private applyCombinedStyling(link: HTMLElement, matchingRules: CSSLink[], linkAttributes: Record<string, string>): void {
        // Generate a unique class name for this combination
        const combinationClass = this.generateCombinationClassName(matchingRules);

        // Add the combination class to the link
        link.addClass(combinationClass);

        // Also ensure individual data attributes are still present
        // (This is handled by the original setLinkNewProps function)
    }

    /**
     * Generates a unique CSS class name for a combination of rules
     * @param rules Array of matching rules
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





	    /**
	     * Remove any previously applied cumulative classes, so UI can downgrade when rules no longer match
	     */
	    private removeExistingCumulativeClasses(link: HTMLElement): void {
	        // Remove any class starting with 'scl-cumulative-'
	        const classes = (link.className || '').split(/\s+/);
	        for (const c of classes) {
	            if (c && c.startsWith('scl-cumulative-')) {
	                link.removeClass(c);
	            }
	        }
	    }


    updateSettings(settings: SuperchargedLinksSettings): void {
        this.settings = settings;
    }
}
