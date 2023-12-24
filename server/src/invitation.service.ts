import {BaseService} from './base.service';
import {tokenGenerator} from './tokens';

class InvitationService extends BaseService {

	async userInvitations(userToken) : Promise<string[]> {
		let results = await this.executeQuery("select object_token from invitation where user_token=?", [userToken]);
		return results.map(x => x.oToken);
	}

	async resolveInvitation(invitationToken: string) : Promise<string|undefined> {
		let results = await this.executeQuery("select objectToken from invitation where invitationToken=?", [invitationToken]);
		// carId = results.length ? results[0].carId : undefined
		return results.length ? results[0].objectToken : undefined
	}

	async createInvitation(userToken: string, objectToken: string): Promise<string|undefined>  {
		let token = tokenGenerator(25);
		await this.executeQuery("insert into invitation (iToken, uToken, oToken) values (?, ?, ?)", [token, userToken, objectToken]);
		return token;
	}

}

const invitationService = new InvitationService();

export { invitationService }