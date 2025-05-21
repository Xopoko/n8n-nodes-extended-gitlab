import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Ensure the given string value is not empty.
 */
export function requireString(
	this: IExecuteFunctions,
	value: string,
	field: string,
	itemIndex: number,
): void {
	if (!value) {
		throw new NodeOperationError(this.getNode(), `${field} must not be empty`, { itemIndex });
	}
}

/**
 * Ensure the given numeric value is positive.
 */
export function requirePositive(
	this: IExecuteFunctions,
	value: number,
	field: string,
	itemIndex: number,
): void {
	if (value <= 0) {
		throw new NodeOperationError(this.getNode(), `${field} must be a positive number`, {
			itemIndex,
		});
	}
}
