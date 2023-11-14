'use strict';
import { spawn } from 'child_process';

/**
 * @param {input} - Объект со следующими свойствами: command - команда для исполнения, period - периодичность опроса. Остальные не обязательные: args - аргументы команды, workdir - рабочая папка, header - заголовок сообщения, timeout - время паузы мониторинга после срабатывания. Минимальное время 500 мс, middleware - функция обрабатывающая данные из изменённого файла.
 * @param {callback} - callback - функция, вызывается после наступления события.
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