export function formatInteger(value) {
\tconst num = Number(value) || 0;
\t// Vietnamese formatting: thousands separator = dot, decimal separator = comma
\treturn new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num);
}

export function formatDecimal(value, fractionDigits = 1) {
\tconst num = Number(value) || 0;
\treturn new Intl.NumberFormat('vi-VN', {
\t\tminimumFractionDigits: fractionDigits,
\t\tmaximumFractionDigits: fractionDigits,
\t}).format(num);
}


