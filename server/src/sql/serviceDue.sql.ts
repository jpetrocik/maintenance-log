const SERVICE_DUE_SQL = `
select ms.carId, 
       ms.id, 
       ms.service, 
       ms.mileage, 
       ms.months, 
       max(s.serviceDate) as last_service_date, 
       max(s.mileage) as last_service_mileage, 
	   DATE_ADD(COALESCE(max(s.serviceDate),c.inserviceDate), INTERVAL months  MONTH) as due_by, 
	   LEAST(DATEDIFF(DATE_ADD(COALESCE(max(s.serviceDate),c.inserviceDate), INTERVAL months  MONTH), now()) * 34, 
	   COALESCE(max(s.mileage),0)+ms.mileage-c.mileage) as due_in 
from car c 
    join scheduled_maintenance ms on c.id=ms.carId 
    left outer join service_history s on s.service=ms.service and s.carId=ms.carId 
where ms.carId=? 
group by ms.id, ms.service, ms.mileage, ms.months
`;

const UPCOMING_SERVICE_SQL = `select * from (${SERVICE_DUE_SQL}) as s where due_in<500 order by due_in desc`;

export { SERVICE_DUE_SQL, UPCOMING_SERVICE_SQL}