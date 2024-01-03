alter table my_garage drop mileage;

alter table user_accounts change uToken userToken varchar(50);
alter table user_accounts change aToken authToken varchar(50);

rename table invitations to invitation;

alter table service_history change service description varchar(300);

alter table my_garage add license varchar(25);
alter table my_garage add vin varchar(75);