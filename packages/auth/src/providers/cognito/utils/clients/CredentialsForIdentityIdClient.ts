import { UserPoolHttpClient } from './HttpClients';
import { UserPoolClient } from './UserPoolClient';
import {
	GetCredentialsForIdentityCommandOutput,
	GetCredentialsForIdentityCommandInput,
} from '@aws-sdk/client-cognito-identity';
export type CredentialsForIdentityIdClientInput = Pick<
	GetCredentialsForIdentityCommandInput,
	'IdentityId' | 'Logins'
>;

export async function credentialsForIdentityIdClient(
	params: CredentialsForIdentityIdClientInput
): Promise<GetCredentialsForIdentityCommandOutput> {
	const client = new UserPoolHttpClient(UserPoolClient.region, 'identity');
	const result: GetCredentialsForIdentityCommandOutput =
		await client.send<GetCredentialsForIdentityCommandOutput>(
			'GetCredentialsForIdentity',
			{
				...params,
			}
		);
	return result;
}
