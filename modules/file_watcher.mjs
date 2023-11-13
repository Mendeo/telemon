'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * @param {input} - Объект со следующими свойствами: path - путь к файлу или папке. Остальные не обязательные: timeout - время паузы мониторинга после срабатывания. Минимальное время 500 мс, middleware - функция обрабатывающая данные из изменённого файла.
 * @param {callback} - callback - функция, вызывается после наступления события.
 */
export function event(input, callback)
{
	const jitterTime = 500;
	let tid = null;
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
			let isWatchingEnabled = true;
			fs.watch(input.path, (eventType, filename)=>
			{
				if (eventType === 'change' && tid === null && isWatchingEnabled)
				{
					tid = setTimeout(() =>
					{
						tid = null;
						const fPath = isFile ?  input.path : path.join(input.path, filename);
						if (fs.existsSync(fPath))
						{
							const fileData = fs.readFileSync(fPath).toString();
							const fileDataProcessed = middleware(fileData);
							let trigger = true;
							if (input.trigger) trigger = input.trigger(fileDataProcessed);
							if (trigger)
							{
								const msg = `${input.header ? input.header + '\n' : ''}${fileDataProcessed}`;
								callback(msg);
								if (input.timeout > 0)
								{
									isWatchingEnabled = false;
									setTimeout(() => isWatchingEnabled = true, input.timeout);
								}
							}
						}
					}, jitterTime);
				}
			});
		}
	});
}

function simpleMiddleware(fileData)
{
	return fileData;
}
