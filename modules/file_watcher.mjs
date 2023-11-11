'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * @param {input} - Объект с двумя свойствами: path - путь к файлу или папке, timeout - время паузы мониторинга после срабатывания. Минимальное время 500 мс.
 * @param {callback} - callback - функция, вызывается после наступления события.
 */
export function event(input, callback)
{
	let tid = null;
	let timeout = input.timeout;
	if (!timeout) timeout = 500;
	if (timeout < 500) timeout = 500;
	fs.watch(input.path, (eventType, filename)=>
	{
		if (eventType === 'change' && tid === null)
		{
			tid = setTimeout(() =>
			{
				tid = null;
				const fPath = path.join(input.path, filename);
				if (fs.existsSync(fPath))
				{
					const fileData = fs.readFileSync(fPath).toString();
					const msg = `File: ${filename}\n${fileData}`;
					callback(msg);
				}
			}, timeout);
		}
	});
}