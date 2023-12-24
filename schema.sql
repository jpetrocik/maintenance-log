alter table my_garage drop mileage;

alter table user_accounts change uToken userToken varchar(50);
alter table user_accounts change aToken authToken varchar(50);

rename table invitations to invitation;

alter table service_history change service description varchar(300);



select i.invitationToken, name, max(m.mileage) as mileage, DATEDIFF(now(), max(m.created_date)) as mileageReportedDays
from my_garage c join invitation i ON c.token=i.objectToken
left join  mileage_log m ON c.id=m.carId
where c.status='ACTIVE' and i.userToken='tkeDjCaiHbxC3Ir4T8eLufyNi'
order by c.year desc, c.make asc, c.model asc, c.id desc
