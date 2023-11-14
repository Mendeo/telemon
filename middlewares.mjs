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
