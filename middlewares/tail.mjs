export function tail(text, n)
{
	const arr = text.split('\n');
	return arr.slice(arr.length - n, arr.length).join('\n');
}