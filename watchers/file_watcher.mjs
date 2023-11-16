'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * @module
*/

/**
* Функция для предобработки содержимого файла, в котором обнаружены изменения.
* @callback pre
* @param {string} text - Содержимое файла.
* @param {string} fPath - Полный путь к файлу, содержимое которого изменилось.
* @param {string} filename - Только имя файла, содержимое которого изменилось.
* @returns {string} - Обработанный текст файла.
 */

/**
* Функция обрабатывает содержимое изменённого файла, и выдаёт решение: сообщать об этом изменении или нет.
* @callback trigger
* @param {string} text - Содержимое файла. Если была определена функция pre, то результат работы этой функции.
* @returns {boolean} - true: Сообщить об изменении в файле, false - не сообщать об этом изменении.
 */

/**
* Функция для постобработки содержимого файла (после работы функции trigger).
* @callback post
* @param {string} text - Содержимое файла. Если была определена функция pre, то результат работы этой функции.
* @param {string} fPath - Полный путь к файлу, содержимое которого изменилось.
* @param {string} filename - Только имя файла, содержимое которого изменилось.
* @returns {string} - Обработанный текст файла.
 */

/**
 * Функция обратного вызова. Вызывается, чтобы сообщить об изменении в наблюдаемом файле во внешний код
 * @callback callback
 * @param {string} msg - Текст сообщения. Состоит из заголовка и содержимого файла после обработки функциями pre и post, если они заданы.
 */

/**
 * Следит за изменениями в заданном каталоге или конкретном файле.
 * @param {object} input - Объект с входными параметрами.
 * @param {string} input.path - Путь к отслеживаемой директории и файлу.
 * @param {pre} [input.pre] - Функция предобработки содержимого файла, в котором обнаружены изменения.
 * @param {trigger} [input.trigger] - Функция, для принятия решения о том, сообщать об обнаруженном изменении в файле или нет.
 * @param {string} [input.header] - Заголовок. Добавляется к финальному сообщению.
 * @param {number} [input.timeout] - Время (мс), на которое следует прервать отслеживание изменений, после отправки очередного сообщения.
 * @param {callback[]} callbacks - Массив функций обратного вызова, куда будет отправляться сообщение об изменениях в директории или файле.
 */
export function event(input, callbacks)
{
	const jitterTime = 1000;
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
