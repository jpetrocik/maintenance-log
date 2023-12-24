const UNREPORTED_MILEAGE_SQL = `
select my_garage.id, 
       my_garage.name as car, 
	   user_accounts.phone as phone, 
	   user_accounts.aToken as aToken,
	   invitations.iToken as cToken,
	   datediff(now(),
	   max(mileage_log.created_date)) as last_reported 
from  mileage_log 
    join my_garage on mileage_log.carId = my_garage.id 
	join invitations on invitations.oToken = my_garage.token 
	join user_accounts on invitations.uToken =  user_accounts.uToken 
	where my_garage.status=\'ACTIVE\' and invitations.role=10 
	group by my_garage.id, user_accounts.phone, user_accounts.aToken, invitations.iToken, my_garage.name 
	having last_reported > ?`;

export { UNREPORTED_MILEAGE_SQL }