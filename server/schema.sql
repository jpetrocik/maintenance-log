alter table my_garage drop mileage;

alter table user_accounts change uToken userToken varchar(50);
alter table user_accounts change aToken authToken varchar(50);

rename table invitations to invitation;

alter table service_history change service description varchar(300);
