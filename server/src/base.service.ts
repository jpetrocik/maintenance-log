import {sqlQuery} from './mysql';

export class BaseService {

	protected async executeQuery(sqlStatement: string, sqlParams: any): Promise<any> {
		let results = await sqlQuery(sqlStatement, sqlParams);
		if (results[0].length)
			return results[0];

		return undefined;
	}

}
