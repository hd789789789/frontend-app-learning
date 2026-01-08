export function formatInteger(value) {
	const num = Number(value) || 0;
	// Vietnamese formatting: thousands separator = dot, decimal separator = comma
	return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num);
}

export function formatDecimal(value, fractionDigits = 1) {
	const num = Number(value) || 0;
	return new Intl.NumberFormat('vi-VN', {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(num);
}