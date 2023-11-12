'use strict';
import { spawn } from 'child_process';

/**
 * @param {input} - Объект со следующими свойствами: command - команда для исполнения, period - периодичность опроса. Остальные не обязательные: args - аргументы команды, workdir - рабочая папка, header - заголовок сообщения, timeout - время паузы мониторинга после срабатывания. Минимальное время 500 мс, middleware - функция обрабатывающая данные из изменённого файла.
 * @param {callback} - callback - функция, вызывается после наступления события.
 */
export function event(input, callback)
{
	let dataOld = null;
	let timerId = null;
	execCommand(onexec);

	function onexec(err, data)
	{
		if (err)
		{
			send(err);
		}
		else
		{
			if (dataOld === null) dataOld = data;
			if (dataOld !== data)
			{
				send(data, input.middleware);
				dataOld = data;
			}
		}
		timerId = setTimeout(() => execCommand(onexec), input.period);
		function send(data, middleware)
		{
			if (middleware) data = middleware(data);
			if (input.header) data = input.header + '\n' + data;
			callback(data);
			if (input.timeout > 0)
			{
				if (timerId) clearInterval(timerId);
				setTimeout(() => execCommand(onexec), input.timeout);
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