alter table my_garage drop mileage;

alter table user_accounts change uToken userToken varchar(50);
alter table user_accounts drop column authToken;

rename table invitations to invitation;

alter table service_history change service description varchar(300);

alter table my_garage add license varchar(25);
alter table my_garage add vin varchar(75);

CREATE TABLE `login_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userToken` VARCHAR(50) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires` TIMESTAMP NOT NULL,
  `used` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`)
);

CREATE TABLE `refresh_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userToken` VARCHAR(50) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`)
);

alter table user_accounts drop column authToken;

alter table invitation drop column rToken;
alter table invitation drop column carId;

CREATE TABLE `fcm_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userToken` VARCHAR(50) NOT NULL,
  `fcmToken` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userToken_UNIQUE` (`userToken`)
);

