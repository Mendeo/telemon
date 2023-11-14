'use strict';
export function testSmart(smartJson)
{
	let post = null;
	const smart = JSON.parse(smartJson);
	if (!smart.smart_status.passed)
	{
		post = () => 'Ошибка smart!\nsmart_status.passed: false';
		return { result: true, post };
	}
	if (smart.ata_smart_data.self_test.status.value !== 0)
	{
		post = () => 'Ошибка smart!\nself_test.status.value !== 0';
		return { result: true, post };
	}
	let result = false;
	let error = 'Ошибка smart!\n';
	for (let row of smart.ata_smart_attributes.table)
	{
		if (row.id === 1 && row.raw.value !== 0) //Raw_Read_Error_Rate
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		if (row.id === 5 && row.raw.value !== 0) //Reallocated_Sector_Ct
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		if (row.id === 7 && row.raw.value !== 0) //Seek_Error_Rate
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		if (row.id === 10 && row.raw.value !== 0) //Spin_Retry_Count
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		if (row.id === 11 && row.raw.value !== 0) //Calibration_Retry_Count
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		if (row.id === 194 && row.raw.value >= 50) //Temperature_Celsius
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		if (row.id === 196 && row.raw.value !== 0) //Reallocated_Event_Count
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		if (row.id === 197 && row.raw.value !== 0) //Current_Pending_Sector
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		if (row.id === 198 && row.raw.value !== 0) //Offline_Uncorrectable
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		if (row.id === 199 && row.raw.value !== 0) //UDMA_CRC_Error_Count
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		if (row.id === 200 && row.raw.value !== 0) //Multi_Zone_Error_Rate
		{
			result = true;
			error += `${row.name} = ${row.raw.value}\n`;
		}
		return { result, post: () => result ? error : null };
	}
}