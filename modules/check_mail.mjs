'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
const input = '/var/mail';

export function event(callback)
{
	let tid = null;
	fs.watch(input, (eventType, filename)=>
	{
		if (eventType === 'change' && tid === null)
		{
			tid = setTimeout(() =>
			{
				tid = null;
				const fPath = path.join(input, filename);
				if (fs.existsSync(fPath))
				{
					const fileData = fs.readFileSync(fPath).toString();
					const msg = `File: ${filename}\n${fileData}`;
					callback(msg);
				}
			}, 500);
		}
	});
}