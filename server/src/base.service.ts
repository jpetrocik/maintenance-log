import {sqlQuery} from './mysql';

export class BaseService {

	protected async executeQuery(sqlStatement: string, sqlParams: any): Promise<any> {
		let results = await sqlQuery(sqlStatement, sqlParams);
		return results[0];
	}

}
