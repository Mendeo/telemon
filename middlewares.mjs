'use strict';
export function tail(text, n)
{
	const arr = text.split('\n');
	return arr.slice(arr.length - n, arr.length).join('\n');
}

export function parseRPItemp(str)
{
	const aux = str.split('=')[1];
	const index = aux.indexOf('\'');
	if (index == -1) return false;
	return aux.slice(0, index);
}

export function parseLoadAverageFromUptime(str, n) //n - Level (1, 2 or 3);
{
	const label = 'load average: ';
	const index = str.indexOf(label) + label.length;
	if (index === -1) return '';
	const data = str.slice(index, -1).split(', ');
	return data[n - 1];
}
export function getStrSize(size)
{
	if (size === 0) return '0 ' + 'Б';
	const sizeOfSize = Math.floor(Math.log2(size) / 10);
	let suffix = '';
	switch (sizeOfSize)
	{
	case 0:
		return size + ' ' + 'Б';
	case 1:
		suffix = 'КиБ';
		break;
	case 2:
		suffix = 'МиБ';
		break;
	case 3:
		suffix = 'ГиБ';
		break;
	case 4:
		suffix = 'ТиБ';
		break;
	case 5:
		suffix = 'ПиБ';
		break;
	}
	return (size / Math.pow(2, sizeOfSize * 10)).toFixed(1) + ' ' + suffix;
}