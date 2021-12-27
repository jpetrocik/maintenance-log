const serviceDue = `
select ms.carId, 
       ms.id, 
       ms.service, 
       ms.mileage, 
       ms.months, 
       max(s.serviceDate) as last_service_date, 
       max(s.mileage) as last_service_mileage, 
	   DATE_ADD(COALESCE(max(s.serviceDate),c.inserviceDate), INTERVAL months  MONTH) as due_by, 
	   DATEDIFF(DATE_ADD(COALESCE(max(s.serviceDate),c.inserviceDate), INTERVAL months  MONTH), now()) as  due_in_days, 
	   COALESCE(max(s.mileage),0)+ms.mileage-c.mileage as due_in_miles 
from ${CAR_DETAILS_TABLE} c 
    join ${SCHEDULE_LOG_TABLE} ms on c.id=ms.carId 
    left outer join ${SERVICE_LOG_TABLE} s on s.service=ms.service and s.carId=ms.carId 
where ms.carId=? 
group by ms.id, ms.service, ms.mileage, ms.months
`;

const upcomingService = "select * from (" + serviceDue + ") as s where due_in_days<30 or due_in_miles<500 order by due_in_days, due_in_miles";

module.exports = upcomingService;