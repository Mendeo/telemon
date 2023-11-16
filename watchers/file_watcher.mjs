'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * @param {input} - Объект со следующими свойствами: path - путь к файлу или папке. Остальные не обязательные: timeout - время паузы мониторинга после срабатывания. Минимальное время 500 мс, middleware - функция обрабатывающая данные из изменённого файла.
 * @param {callback} - callback - функция, вызывается после наступления события.
 */
export function event(input, callbacks)
{
	const jitterTime = 500;
	fs.stat(input.path, (err, stats) =>
	{
		if (err)
		{
			for (let callback of callbacks) callback(err);
		}
		else
		{
			const isFile = stats.isFile();
			let isWatchingEnabled = true;
			let tid = null;
			fs.watch(input.path, (eventType, filename)=>
			{
				console.log(eventType, filename);
				if (eventType === 'change' && tid === null && isWatchingEnabled)
				{
					tid = setTimeout(() =>
					{
						tid = null;
						const fPath = isFile ?  input.path : path.join(input.path, filename);
						if (fs.existsSync(fPath))
						{
							let data = fs.readFileSync(fPath).toString();
							if (input.pre) data = input.pre(data, fPath, filename);
							let trigger = true;
							if (input.trigger) trigger = input.trigger(data);
							if (trigger)
							{
								if (input.post) data = input.post(data, fPath, filename);
								const msg = `${input.header ? input.header + '\n' : ''}${data}`;
								for (let callback of callbacks) callback(msg);
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
