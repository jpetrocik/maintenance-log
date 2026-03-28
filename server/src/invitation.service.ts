import {BaseService} from './base.service';
import {tokenGenerator} from './tokens';

class InvitationService extends BaseService {

	async userInvitations(userToken) : Promise<string[]> {
		let results = await this.executeQuery("select invitationToken from invitation where userToken=?", [userToken]);
		return results.map(x => x.invitationToken);
	}

	async resolveInvitation(invitationToken: string) : Promise<string|undefined> {
		let results = await this.executeQuery("select objectToken from invitation where invitationToken=?", [invitationToken]);
		return results.length ? results[0].objectToken : undefined
	}

	async createInvitation(userToken: string, objectToken: string): Promise<string|undefined>  {
		let token = tokenGenerator(25);
		await this.executeQuery("insert into invitation (invitationToken, userToken, objectToken) values (?, ?, ?)", [token, userToken, objectToken]);
		return token;
	}

}

const invitationService = new InvitationService();

export { invitationService }