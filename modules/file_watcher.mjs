'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * @param {input} - Объект со следующими свойствами: path - путь к файлу или папке. Остальные не обязательные: timeout - время паузы мониторинга после срабатывания. Минимальное время 500 мс, middleware - функция обрабатывающая данные из изменённого файла.
 * @param {callback} - callback - функция, вызывается после наступления события.
 */
export function event(input, callback)
{
	let tid = null;
	let timeout = input.timeout;
	if (!timeout) timeout = 500;
	if (timeout < 500) timeout = 500;
	let middleware = input.middleware;
	if (!middleware) middleware = simpleMiddleware;
	fs.stat(input.path, (err, stats) =>
	{
		if (err)
		{
			callback(err);
		}
		else
		{
			const isFile = stats.isFile();
			fs.watch(input.path, (eventType, filename)=>
			{
				console.log(eventType);
				if (eventType === 'change' && tid === null)
				{
					tid = setTimeout(() =>
					{
						tid = null;
						const fPath = isFile ?  input.path : path.join(input.path, filename);
						if (fs.existsSync(fPath))
						{
							const fileData = fs.readFileSync(fPath).toString();
							const fileDataProcessed = middleware(fileData);
							const msg = `${input.header ? input.header + '\n' : ''}${fileDataProcessed}`;
							callback(msg);
						}
					}, timeout);
				}
			});
		}
	});
}

function simpleMiddleware(fileData)
{
	return fileData;
}
