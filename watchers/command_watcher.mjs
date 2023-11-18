'use strict';
import { spawn } from 'child_process';

/**
 * Модуль для наблюдения за тем, что выдаёт в ответ заданная команда при переодическом её запуске.
 * @module watchers/command_watcher
 * @exports event
*/

/**
* Функция для предобработки результата выполнения команды. Вызывается, если два последовательных вызова команды дали разный результат и до вызова функции trigger
* @callback pre
* @param {string} text - Результат работы команды.
* @returns {*} Обработанный результат работы команды.
 */

/**
* Функция обрабатывает результат работы команды, и выдаёт решение: сообщать об этом изменении или нет.
* @callback trigger
* @param {*} data - Результат работы команды. Если была определена функция pre, то результат работы этой функции.
* @returns {boolean}  Возврат "true" означает, что следует сообщить об изменении в ответе команды, "false" - не сообщать об этом изменении.
 */

/**
* Функция для постобработки результата работы команды. Вызывается после вызова функции trigger.
* @callback post
* @param {*} data - Результат работы команды. Если была определена функция pre, то результат работы этой функции.
* @returns {string} Обработанный результат работы команды.
 */

/**
 * Функция обратного вызова. Вызывается, чтобы сообщить во внешний код об изменении в результате выполнения заданной команды.
 * @callback callback
 * @param {string} msg - Текст сообщения. Состоит из заголовка и резульатата работы команды после обработки функциями pre и post, если они заданы.
 */

/**
 * Следит за изменениями результате работы заданной команды. Для этого эта команда переодически вызывается, результаты двух последовательных вызовов сравниваются друг с другом. Обработка начинается, если два последовательных вызова дают разный результат.
 * @param {object} input - Объект с входными параметрами.
 * @param {string} input.command - Команда, которую необходимо переодически исполнять для отслеживания результатов её работы.
 * @param {string[]} input.args - Массив аргументов для заданной команды.
 * @param {number} input.period - Периодичность вызова команды в мс.
 * @param {pre} [input.pre] - Функция предобработки результата работы команды (до вызова функции trigger).
 * @param {trigger} [input.trigger] - Функция, для принятия решения о том, сообщать об обнаруженном изменении в результате выполнения команды или не сообщать.
 * @param {post} [input.post] - Функция для постобработки результата работы команды (после вызова функции trigger).
 * @param {string} [input.header] - Заголовок. Добавляется к финальному сообщению.
 * @param {number} [input.timeout] - Время (мс), на которое следует прервать отслеживание изменений в результате выполнения команды, после отправки очередного сообщения.
 * @param {callback[]} callbacks - Массив функций обратного вызова, куда будет отправляться сообщение об изменениях в результате выполнения команды.
 */
export function event(input, callbacks)
{
	let dataOld = null;
	let timerId = null;
	execCommand(onexec);

	function onexec(err, data)
	{
		timerId = setTimeout(() => execCommand(onexec), input.period);
		if (err)
		{
			send(err);
		}
		else
		{
			if (dataOld === null) dataOld = data;
			if (dataOld !== data)
			{
				dataOld = data;
				send(data);
			}
		}
		function send(data)
		{
			if (input.pre) data = input.pre(data);
			let trigger = true;
			if (input.trigger) trigger = input.trigger(data);
			if (trigger)
			{
				if (input.post) data = input.post(data);
				if (input.header) data = input.header + '\n' + data;
				for (let callback of callbacks) callback(data);
				if (input.timeout > 0)
				{
					if (timerId) clearInterval(timerId);
					dataOld = null;
					setTimeout(() => execCommand(onexec), input.timeout);
				}
			}
		}
	}

	function execCommand(onexec)
	{
		const execId = spawn(input.command, input.args ? input.args : [], { cwd: input.workdir });
		execId.on('error', (e) =>
		{
			onexec(e);
		});
		let data = '';
		execId.stdout.on('data', (chunk) =>
		{
			data += chunk;
		});
		let error = '';
		execId.stderr.on('data', (chunk) =>
		{
			error += chunk;
		});
		execId.on('close', () =>
		{
			if (error === '') error = null;
			onexec(error, data);
		});
	}
}